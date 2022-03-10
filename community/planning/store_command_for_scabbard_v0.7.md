# StoreCommand for Scabbard v0.7

<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

This feature aims to add a component which can make updates to the database 
atomically. Commands to update the database can be created by any part of the
system without it having to have access to the underlying database. This
component is intended to be used by any part of the system which needs to
make database updates.

## Guide-level explanation

### StoreCommand

`StoreCommand` is a trait for defining commands which make updates to a
database. `StoreCommand`s can be created by any part of the system to
update tables in the database. A `StoreCommand` should have all of the
information necessary for making a database update this includes the values
being added and the receiver. The receiver is the object which implements the
method called in the execute function. In the diagram below the
`ExampleStoreCommand`'s receiver is the `store_factory`, this store factory
produces the store that is updated by the `ExampleStoreCommand`.

### StoreCommandExecutor

The `StoreCommandExecutor` provides an API for executing `StoreCommand`s. The
`StoreCommandExecutor` has access to the underlying database and provides the
database connection when calling execute on the `StoreCommand`s. The
`StoreCommandExecutor` has its own execute method which takes a list of commands
that implement the `StoreCommand` trait and executes them within the context of
a single transaction. The `StoreCommandExecutor` has no knowledge of how the
`StoreCommand`s are implemented, it only knows their interface.

![]({% link images/store_command_relationships.svg %} 
"Relationships of the store command objects")

## Reference-level explanation

The command module will provide a trait for defining `StoreCommand`s. The
execute function will take a generic argument, `conn`. `conn` is a connection to
the database being updated by the execute function in implementations of the
`StoreCommand` trait. The `StoreCommandExecutor` trait will also be provided in
the command module. This trait defines the command invoker and provides an API
for executing `StoreCommand`s. The `StoreCommandExecutor` trait can be
implemented for various database backends.

### StoreCommand

```rust
/// Trait for defining a command
///
/// A command will contain information that is to be applied to a database
pub trait StoreCommand {
    type Context;

    fn execute(&self, conn: &Self::Context) -> Result<(), InternalError>;
}
```

### StoreCommandExecutor

```rust
/// Provides an API for executing `StoreCommand`s
pub trait StoreCommandExecutor {
    type Context;

    fn execute<C: StoreCommand<Context = Self::Context>>(
        &self,
        store_commands: Vec<C>,
    ) -> Result<(), InternalError>;
}
```
### DieselStoreCommandExecutor

A diesel powered struct that implements the `StoreCommandExecutor` trait for
SQLite and PostgreSQL backends.

```rust
/// A `StoreCommandExecutor`, powered by [`Diesel`](https://crates.io/crates/diesel).
pub struct DieselStoreCommandExecutor<C: diesel::Connection + 'static> {
    conn: ConnectionPool<C>,
}

impl<C: diesel::Connection> DieselStoreCommandExecutor<C> {
    /// Creates a new `DieselStoreCommandExecutor`.
    ///
    /// # Arguments
    ///
    ///  * `conn`: connection pool for the database
    pub fn new(conn: Pool<ConnectionManager<C>>) -> Self {
        DieselStoreCommandExecutor { conn: conn.into() }
    }

    /// Create a new `DieselStoreCommandExecutor` with write exclusivity enabled.
    ///
    /// Write exclusivity is enforced by providing a connection pool that is wrapped in a
    /// [`RwLock`]. This ensures that there may be only one writer, but many readers.
    ///
    /// # Arguments
    ///
    ///  * `conn`: read-write lock-guarded connection pool for the database
    pub fn new_with_write_exclusivity(
        conn: Arc<RwLock<Pool<ConnectionManager<C>>>>
    ) -> Self {
        Self { conn: conn.into() }
    }
}

impl StoreCommandExecutor for DieselStoreCommandExecutor<PgConnection> {
    type Context = PgConnection;

    fn execute<C: StoreCommand<Context = Self::Context>>(
        &self,
        store_commands: Vec<C>,
    ) -> Result<(), InternalError> {
        self.conn.execute_write(|conn| {
            conn.transaction::<(), InternalError, _>(|| {
                for cmd in store_commands {
                    cmd.execute(conn)?;
                }
                Ok(())
            })
        })
    }
}

impl StoreCommandExecutor for DieselStoreCommandExecutor<SqliteConnection> {
    type Context = SqliteConnection;

    fn execute<C: StoreCommand<Context = Self::Context>>(
        &self,
        store_commands: Vec<C>,
    ) -> Result<(), InternalError> {
        self.conn.execute_write(|conn| {
            conn.transaction::<(), InternalError, _>(|| {
                for cmd in store_commands {
                    cmd.execute(conn)?;
                }
                Ok(())
            })
        })
    }
}
```

### StoreCommand Example

The following is an example `StoreCommand` which operates on the `ExampleStore`.
This store command adds a string, `value`, to a table in the `ExampleStore`.

```rust
/// Stores the value that will be set and the store factory for the store
/// being updated
pub struct SetValueExampleStoreCommand<C> {
    value: String,
    store_factory: Arc<dyn ExampleStoreFactory<Connection = C>>,
}

impl<C> SetValueExampleStoreCommand<C> {
    /// Creates a new `SetValueExampleStoreCommand`
    ///
    /// # Arguments
    ///
    /// * `value` - the value that will be added to the database
    /// * `store_factory` - a factory that can be used to retrieve an instance
    ///    of the `ExampleStore`
    pub fn new(
        value: String,
        store_factory: Arc<dyn ExampleStoreFactory<Connection = C>>,
    ) -> Self {
        SetValueExampleStoreCommand {
            value,
            store_factory,
        }
    }
}

impl<C> StoreCommand for SetValueExampleStoreCommand<C> {
    type Context = C;
    type Error = InternalError;

    /// Gets an instance of the `ExampleStore` from the store factory and uses
    /// its `set_value` method to update a specific table in the database
    ///
    /// # Arguments
    ///
    /// * `conn` - the transaction context
    fn execute(self, conn: &Self::Context) -> Result<(), Self::Error> {
        self.store_factory
            .get_store(&conn)
            .set_value(self.value.clone())
            .map_err(|e| InternalError::from_source(Box::new(e)))
    }
}
```

## Drawbacks

In the current store pattern used throughout the system, a store has a
connection pool and each transaction is executed in a different transaction
context. The addition of this component will require that all stores that are
used in `StoreCommand`s be updated so that they can operate within the context
of a transaction.

## Rationale and alternatives

Another option would be to provide an instance of a store to each component that
needs to make database updates. This practice is already used in various parts
of the system. The problem with this approach is in the way that stores are
currently implemented, each transaction is executed in a separate context which
prevents multiple database updates executed together from being atomic.

## Prior art

This component follows the command design pattern. This pattern encapsulates a
request as an object which is passed to an invoker to call execute on the
command. An invoker knows how to execute a given command but has no knowledge of
what it does.
