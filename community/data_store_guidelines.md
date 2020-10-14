# Data Store Guidelines
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Overview

Modularity and flexibility are two of the core principles of Splinter. To
support these, it is almost always desirable to define data stores as Rust
traits without assumptions about the implementation or how the data is actually
stored. By using Rust traits, you can provide various implementations of the
data store that are swappable depending on the target environment and
requirements like performance, scalability, and safety guarantees.

## Data Store Basics

A data store in Splinter has three key components:

* Data structure(s) that represent the information being stored
* Rust trait(s) that define a backend-agnostic interface for the store
* Implementation(s) of the Rust traits, where each implementation provides a
  different type of backend storage

The data structures are arbitrary; the information they contain depends entirely
on what data the store is designed to hold. These data structures are used
throughout the store: in the traits, the implementations, and by the consumers
of the store.

The Rust traits provide the methods that the store's consumers interact with.
These traits define the various operations for adding, modifying, and reading
data, as well as some basic requirements for the store like thread-safety.

The implementations of the Rust traits provide the concrete mechanisms for
storing data. These implementations can use a variety of backends for storage,
including system memory, the filesystem, a database, or even the internet.

### Interface vs. Implementation

The public interface that is used by other components is made up exclusively of
the data structures and traits. Together, these two components encapsulate the
functionality of writing to and reading from the data store without exposing any
details about the type of storage (implementation) used. It is very important
that the data structures and traits do not include any arguments, fields, or
details about a specific implementation; this would violate the encapsulation
that data stores are intended to provide.

Because of the encapsulation provided by a data store's interface, the consumer
of the data store should not interact directly with the concrete implementations
of the Rust traits. By using only the public interface and not specific
implementations, the backing storage can easily be swapped out without any
changes to the code that consumes it.

Concrete store implementations should only be used directly when instantiating
the store, which is typically done on startup (like in the Splinter daemon).
Once a store is created, it should be used generically via the Rust traits.

### Module Structure

![]({% link community/images/store_diagram.svg %} "Store directory diagram")

Splinter stores should be broken up into a few different modules. The top level
of the store's module, the mod.rs file, should contain the public data
structures and traits that make up the store's interface. In the example above,
the `pub struct Record` defines the type of data being stored (data structure)
and the `pub trait RecordStore` is the store's trait that will be implemented
for different backends.

Any errors that will be used or exposed by the store's public interface should
be defined in an `error` module (an error.rs file). In the example above, the
`pub enum RecordStoreError` will be returned by the methods of the `RecordStore`,
so it's in the `error` module.

Each implementation of the store's interface should be in its own sub-module of
the store. These sub-modules should be self-contained, meaning all data, types,
and implementations for that kind of storage should exist only in that sub-module.
In the example above, there are two implementations of the `RecordStore`: a
`memory` implementation, and a `diesel` implementation.

## Designing Data Stores

This section describes the general patterns that should be used when designing a
Splinter data store.

### Traits

Data stores defined as traits allow for various backends to be implemented for
the data store. The data store’s API is then consistent across various backends
using these traits. Data stores should have clear names that describe the types
of things that are stored, regardless of implementation details. If a data store
only stores one data structure, it should be named after that data structure;
for example, a store of `Record` structs would be called `RecordStore`. Here's a
basic example of what a simple data store trait may look like for the
`RecordStore`:

```rust
pub trait RecordStore {
  fn add_record(&self, record: Record) -> Result<(), RecordStoreError>;
  fn remove_record(&self, record_id: &str) -> Result<(), RecordStoreError>;
}
```

In some cases, stores will hold multiple different data structures; in these
cases, the name should reflect the overall functionality of the store. Be
careful not to make a store that does too much; sometimes a store should be
broken down into separate stores.

Another important factor to consider when designing a store is if the store
should be defined by a single trait, or by distinct reader and writer traits.
If the store will be used strictly as a reader in some cases, or if the store is
shared across threads, then it will likely be useful to have separate traits.
If you are splitting a store called `MyStore` into reader and writer traits,
the appropriate name for the traits would be `MyStoreReader` and `MyStoreWriter`.

### Implementations

Data store implementations should have clear and concise names that tell you the
type of store it is, and what kind of backend storage is used. For example, an
implementation of the `RecordStore` that uses system memory for storage should
be called something like `MemoryRecordStore`.

### Data Structures

The simplest data stores are used to store some data structure that is identified
by a unique ID. IDs generally help stores when implementations include operations
used to fetch data. For example, you may want to store a struct `Record` that's
defined as follows:

```rust
struct Record {
  id: String,
  metadata: HashMap<String, String>,
}
```

Sometimes it is desirable for the ID to be more complicated than a string; for
example, an ID that is composed of two parts with different meanings might be
represented by a struct. In this case, the ID will be the struct rather than a
string, and the store methods will take and return this struct (or a reference
  to it) rather than a `String` (or `&str`) for the ID.

In other cases, it may not make sense for the data being stored to have an
associated ID. This may have an impact on the kinds of operations that the store
can support or how efficient the implementations can be, so keep this in mind
when designing your data stores.

All data structures should have a designated builder struct; for example,
`Record` would have a builder struct `RecordBuilder`. In addition to providing a
convenient way to create the structs, the builder can assist the user by
indicating if the struct has any missing or invalid values that will need to be
fixed to be able to add the struct to a store.

### Error Types

The structure and handling patterns of Splinter store errors should reflect the
patterns used throughout Splinter.

### Data Store Methods

#### Adding Items

Adding items to a data store will generally be accomplished with an `add_X`
method, where `X` is the name of the item to add. For instance, a method for
adding a `Record` to the store would be defined as follows:

```rust
/// Adds a `Record` to the underlying storage
///
/// # Arguments
///
///  * `record` - The record to be added
///
/// # Errors
///
/// * Returns an error if a record with the same unique ID already exists
fn add_record(&mut self, record: Record) -> Result<(), MyStoreError>
```

When the data structure being added must be unique, the add method should return
an error when a duplicate entry already exists in the store. Other errors may
also be returned in other cases depending on the requirements of the store and
what is being stored. For instance, the add method may return an error when some
additional uniqueness constraints are violated, or when the object to add is
invalid or missing values. In the case of invalid or missing values, the struct's
 builder should check these values when building the struct to reduce the
 likelihood of these errors occurring.

In addition to a method for adding a single item, it's sometimes desirable to
add multiple items at a time. A method for adding multiple `Record` items would
be defined as follows:

```rust
/// Adds multiple `Record`s to the underlying storage
///
/// # Arguments
///
///  * `records` - The new records to be added
///
/// # Errors
///
/// * Returns an error if the unique ID of any of the records already exists
fn add_records(&mut self, records: Vec<Record>) -> Result<(), MyStoreError>
```

The same error cases as when adding a single item will generally apply when
adding multiple items.

#### Updating Items

In the simplest case, updating an item in a store will look similar to adding an
item. An existing item is often replaced with a new definition. For example, a
method for replacing a `Record` with a new definition would be defined as
follows:

```rust
/// Updates an existing `Record` with a matching ID in the underlying
/// storage
///
/// # Arguments
///
///  * `record` - The record to be updated
///
/// # Errors
///
/// Returns an error if record with the same unique ID does not already exist
fn update_record(&mut self, record: Record) -> Result<(), MyStoreError>;
```

In this case, an error will be returned if a `Record` with the same unique ID as
the one passed in does not already exist. Otherwise, the matching `Record` in
the store will be replaced by the one that was passed in.

In general, update operations only make sense where there is some unique
identifier for the items in the store.

It is important to note that the add and update methods are intentionally
distinct; this is in contrast to many of the data structures in the Rust
standard library, which provide an `insert` method for both adding and updating
existing items. The reason for this is that some store implementations behave
differently for adds and updates, and they may not be able to infer which action
is required when a generic "insert" is used.

#### Removing Items

Items will generally be removed from a store using a `remove_X` method that
takes the desired item's unique ID as an argument. For example, a method for
removing a `Record` from a data store would be defined as follows:

```rust
/// Removes a `Record` with the given ID from the underlying storage
///
/// # Arguments
///
///  * `id` - The ID of the record to remove
///
/// # Errors
///
/// Returns an error if record with the given ID does not exist in the store
fn remove_record(&mut self, id: &str) -> Result<(), MyStoreError>;
```

#### Getting Individual Items

Getting individual items from a data store is usually accomplished with a
`get_X` method. For example, a method for getting a `Record` from a data store
would be defined as follows:

```rust
/// Gets the `Record` with the given ID from the underlying storage
///
/// # Arguments
///
///  * `id` - The ID of the record to get
fn get_record(&self, id: &str) -> Result<Option<Record>, MyStoreError>;
```

If a `Record` with the given ID does not exist in the store, the method should
return an `Ok(None)` value.

#### Listing Items

Listing items in a data store is usually accomplished with a `list_Xs` method.
For example, a method for list all `Record` items in a data store would be
defined as follows:

```rust
/// Lists all `Record`s in the underlying storage
fn list_records(
  &self,
) -> Result<Box<dyn ExactSizeIterator<Item = X>>, MyStoreError>;
```

It is almost always best to return an iterator from a list method; this is more
efficient than a `Vec` for some implementations. When using databases, for
instance, a `Vec` would require loading all items into memory to be returned.
When returning an iterator, the iterator's implementation can load items into
memory as needed, which would be more efficient.

An `ExactSizeIterator` is the same as a standard Rust `Iterator`, except that it
has a known size and provides a `len` method. This is often very useful and
should be provided whenever possible; however, a standard `Iterator` may be used
if `ExactSizeIterator` is not feasible.

When listing items in a store, it may be desirable to allow filtering which
items are returned. Typically, filtering should be supported by adding some
optional predicates to the list method. For example, a list method for `Record`
items that supports filtering by some predicates may be defined as follows:

```rust
/// Lists some or all `Record`s in the underlying storage
///
/// # Arguments
///
/// * `predicates` - A list of predicates to be applied to the resulting
/// list. These are applied as an AND, from a query perspective. If the list
/// is empty, it is the equivalent of no predicates (i.e. return all).
fn list_records(
  &self,
  predicates: &[RecordPredicate],
) -> Result<Box<dyn ExactSizeIterator<Item = X>>, MyStoreError>;
```

In this example, `RecordPredicate` would be an enum whose variants would provide
various ways to filter a `Record` based on the fields of the `Record` items in
the store.

In some situations, it may be sufficient (and more convenient) to provide
separate list methods instead of using predicates; this is the case when there
are a few well-defined subsets of items within the store. For example, if the
`Record` items in a store can be either "active" or "inactive", you may provide
`list_active_records` and `list_inactive_records` methods in addition to the
`list_records` method.

#### Existence Methods

It's often useful to provide convenient methods for checking the existence of
some items in a store. This will generally be accomplished with a `has_X`
method. For example, a method for checking if a `Record` with a specific ID
exists in the store may be defined as follows:

```rust
/// Checks if the `Record` with the given ID exists in the underlying storage
///
/// # Arguments
///
///  * `id` - The ID of the record to check for
fn has_record(&self, id: &str) -> Result<bool, MyStoreError>;
```

### More Complex Store Patterns

#### Internal IDs

In many cases, the data structure that is being stored provides its own unique
identifier. However, this is not always the case; sometimes the store itself
needs to provide unique identifiers for the structures being stored. In these
situations, the store’s `add_X` methods must be modified. Other operations aren’t
affected by this change, since these methods will take in the regular data
structs, which contain the ID generated by the store.

If the store is generating the object IDs, the object passed to the `add_X`
method doesn’t need to have an ID field, since an ID for the object does not
exist before it's added to the store. This intermediate object can be
represented by a separate struct which is named for the object it represents,
prefixed by `New`. For example, a `Record` struct without an ID would be called
`NewRecord`; these would be defined as follows:

```rust
pub struct Record {
  pub id: String,
  pub description: String,
}

pub struct NewRecord {
  pub description: String,
}
```

The operation would take the fields from the `NewRecord` to construct a `Record`
with a newly generated ID. The method for adding a `Record` using a `NewRecord`
to the store would be defined as follows:

```rust
/// Adds a `Record` to the underlying storage
///
/// # Arguments
///
///  * `new_record` - The record to be added
///
/// # Errors
///
/// * Returns an error if a record with the same unique ID already exists
fn add_record(&mut self, new_record: NewRecord) -> Result<(), MyStoreError>
```

#### Atomic Operations

Some stores that contain multiple types of related data will need to support
atomic updates. When atomic updates are needed, they should be combined into a
single method instead of requiring the user to call multiple methods to get the
desired result.

For example, if you have a store that contains both `RecordA` and `RecordB`
items, the implementation of the store will likely save the two structs to
different locations. If you need to provide a way to atomically remove a
`RecordA` while adding a `RecordB`, you would define a method like this:

```rust
/// Removes a `RecordA` with the given ID and adds a `RecordB` to the
/// underlying storage
///
/// # Arguments
///
/// * `recorda_id` - The ID of the `RecordA` to remove
/// * `recordb` - The `RecordB` to be added
///
/// # Errors
///
/// Returns an error if `RecordA` with the given ID does not exist in the
/// store. Returns an error if `RecordB` with the same ID already exists in
/// the store.
fn remove_recorda_and_add_recordb(
  &mut self,
  recorda_id: &str,
  recordb: RecordB,
) -> Result<(), MyStoreError>;
```

## Database Implementations

Most Splinter stores should provide a database-backed implementation. Databases
are widely supported and are the most likely storage type to be used in
production environments. This section describes the design patterns for
database-backed Splinter stores.

### Diesel

Splinter stores should be implemented using the [Diesel](https://diesel.rs/)
library. Diesel is an ORM and query builder that allows stores to interact with
different types of databases in a generic way. With Diesel, a single store
implementation can support multiple backend databases.

The name of a Splinter store implemented using Diesel should follow the standard
store naming convention. For example, an implementation of a `RecordStore` that
uses Diesel would typically be called `DieselRecordStore`.

### Types of Databases

The Splinter library provides support for PostgreSQL and SQLite databases. In
general, database-backed store implementations should support at least these two
database types.

### Module Structure

![]({% link community/images/diesel_store_diagram.svg %}
"Diesel Store directory diagram")

Because the database-backed implementations of Splinter stores are designed to
work with multiple database types, the implementation should be as modular as
possible; this means breaking the implementation up into different sub-modules
for different concerns. The diagram above demonstrates how database stores
should be organized. Each module is covered in the following sections.

### Top Level (mod.rs)

Diesel store implementations should be in a `diesel` sub-module of the store.
This module should be guarded by the `diesel` Rust feature, which ensures that
it is only compiled when database support is required. For example, the `diesel`
module would be defined in the top-level of a store module like this:

```rust
#[cfg(feature = "diesel")]
pub mod diesel;
```

The top level of the `diesel` module is defined by the `diesel/mod.rs` file,
which should contain the Rust struct that implements the store, as well as the
implementations of the store traits on that struct. For example, the
`diesel/mod.rs` file for a `RecordStore` would look something like this:

```rust
use diesel::r2d2::{ConnectionManager, Pool};

use operations::add_record::RecordStoreAddRecordOperation as _;
use operations::RecordStoreOperations;

pub struct DieselRecordStore<C: diesel::Connection + 'static> {
	connection_pool: Pool<ConnectionManager<C>>,
}

impl<C: diesel::Connection> DieselRecordStore<C> {
	fn add_record(&self, record: Record) -> Result<(), RecordStoreError> {
    RecordStoreOperations::new(&*self.connection_pool.get()?).add_record(record)
	}
	...
}
```

The `RecordStoreOperations` and the `operations` sub-module will be covered in
the next section, [Operation Traits](#operation-traits).

It is important to note that the store is defined for a generic
`diesel::Connection` type. This allows the Diesel store to be used with different
database types; each database type will have a different connection type. Some
operations, however, may be defined for specific database connection types; in
these situations, the store trait will need to be defined separately for each
supported connection type. See the
[Implementing Operations for Individual Database Types](#implementing-operations-for-individual-database-types)
section of this document for more details.

### Operations

Each operation that is performed by the store is represented by a trait specific
to the operation. Defining operations with traits allows for the operations to
be implemented differently for different database types, while still being able
to use them interchangeably in the store implementation. Here is an example of
the trait for the "add record" operation of the `DieselRecordStore`, which would
be defined in the `diesel/operations/add_record.rs` file:

```rust
pub trait RecordStoreListRecordsOperation {
  fn list_records(
    &self,
  ) -> Result<Box<dyn ExactSizeIterator<Item = Record>>, RecordStoreError>;
}
```

Notice that the trait does not have any requirements for the type of database
that is used; that is entirely up to the implementation. All operations for a
given store should be implemented by a single struct in the top level of the
`operations` module. Here is an example of the operations struct for the
`RecordStore`, which would be defined in `diesel/operations/mod.rs`:

```rust
pub struct RecordStoreOperations<'a, C> {
  conn: &'a C,
}

impl<'a, C: diesel::Connection> RecordStoreOperations<'a, C> {
  pub fn new(conn: &'a C) -> Self {
    RecordStoreOperations { conn }
  }
}
```

This struct will be able to perform the database queries using a generic
database `Connection`, which may be for any of the database types that are
supported by Diesel.

The implementations of the individual operations should be done in the
appropriate operations' module. For instance, the implementation of the
`RecordStoreAddRecordOperation` trait shown above should be in the
`diesel/operations/add_record.rs` file, right after the definition of the trait:

```rust
impl<'a, C> RecordStoreListRecordsOperation for RecordStoreOperations<'a, C>
where
  C: diesel::Connection,
{
  fn list_records(
    &self,
  ) -> Result<Box<dyn ExactSizeIterator<Item = Record>>, RecordStoreError> {
      …
  }
}
```

By implementing the operation traits on a single operations struct that holds
the database connection, we can refer to the connection using `self.connection`
in the body of the method implementations.

### Implementing Operations for Individual Database Types

A trait for each operation allows for the implementation details to be concealed
and offers flexibility in the database connection type being used. Ideally, each
operation trait uses a generic `Connection` type, which allows the operation to
be implemented for all Diesel connection types. However, there are some cases
where this is not possible due to limitations of certain database types, or is
not desirable because of optimizations for different databases.

One situation where databases require separate implementations is when Diesel's
`insert` operation is used; this operation requires that the `Connection`
implements the `SupportsDefaultKeyword` trait, which is not implemented for
`SqliteConnection`. In this case, Diesel needs to know specifically which type
of connection is used, which requires separate implementations for each database
type.

When separate implementations are required, the operations should be implemented
for each of the connection types, where each connection type is guarded by the
corresponding Rust feature. For example, implementing the
`RecordStoreListRecordsOperation` separately for SQLite and PostgreSQL would
look something like this:

```rust
#[cfg(feature = "postgres")]
impl<'a> RecordStoreListRecordsOperation
  for RecordStoreOperations<'a, diesel::pg::PgConnection>
{
  fn list_records(
    &self,
  ) -> Result<Box<dyn ExactSizeIterator<Item = Record>>, RecordStoreError> {
      …
  }
}

#[cfg(feature = "sqlite")]
impl<'a> RecordStoreListRecordsOperation
  for RecordStoreOperations<'a, diesel::sqlite::SqliteConnection>
{
  fn list_records(
    &self,
  ) -> Result<Box<dyn ExactSizeIterator<Item = Record>>, RecordStoreError> {
      …
  }
}
```

When separate implementations are used for different connection types, the Diesel
store must implement the store's traits for each connection type as well. For
example, the `DieselRecordStore` that uses the `RecordStoreOperations` struct
defined above would look like this:

```rust
#[cfg(feature = "postgres")]
impl DieselRecordStore<diesel::pg::PgConnection> {
	fn add_record(&self, record: Record) -> Result<(), RecordStoreError> {
    RecordStoreOperations::new(&*self.connection_pool.get()?).add_record(record)
	}
	...
}

#[cfg(feature = "sqlite")]
impl DieselRecordStore<diesel::sqlite::SqliteConnection> {
	fn add_record(&self, record: Record) -> Result<(), RecordStoreError> {
    RecordStoreOperations::new(&*self.connection_pool.get()?).add_record(record)
	}
	...
}
```

### Database Models and Schema

Models and schemas define the structure of the database implementation and offer
a native Rust representation of the data stored in the database. The models and
schemas also directly correspond to how the database migrations are defined.
This data must be accessible to the migrations and operations, regardless of the
backend, so they should be stored in the `diesel/models.rs` and
`diesel/schemas.rs` files, respectively.

Models and schemas must account for what is able to be represented by the
backend, as each database uniquely represents data. For instance, lists must be
represented in a way that all supported databases can store. SQLite does not
support lists, so special consideration must be taken for data that contains
lists. Lists should be represented using separate database tables and foreign
keys.

For example, if a `Record` contains a list of strings, the strings should be
stored as individual database entries, where each entry in the list is
associated with its `Record`. The Rust struct may look like this:

```rust
pub struct Record {
  pub id: String,
  pub description: String,
  pub data: Vec<String>,
}
```

The corresponding database entries would be representing using the following
models:

```rust
pub struct RecordModel {
  pub id: String,
  pub description: String,
}

pub struct RecordDataModel {
	pub id: String,
  pub data: String,
}
```
The `RecordModel` requires an `id` and `description`, since the `data` being
held in the Rust representation cannot be stored as a list in SQLite databases.
The `RecordDataModel` represents an entry in the `data` field of the Rust struct.
The `RecordDataModel` is associated with its `RecordModel` via the `id`
attribute. When querying the database, the ID allows for the `RecordDataModel`
entries to be fetched into a list which can then be parsed and organized into
the original `Record` representation.

### Database Migrations

Database migrations are necessary to apply the structure defined by models and
schemas to the database itself. Migrations are written directly in the database's
query language, so they are defined separately for each database type.

All migrations should be in a `migration` module. The `diesel/migrations/mod.rs`
should contain anything that is applicable to all migrations, such as errors for
issues that arise while running migrations. A `MigrationError` is typically
defined in this file, and is used for migrations of the various database
implementations.

Each implemented backend should have its own migrations directory. For example,
 migrations for PostgreSQL databases would be in the `diesel/migrations/postgres`
 directory. The module that this directory comprises (the `migrations::postgres`
   module in this example) should be guarded with the appropriate feature for
   that database type (the `postgres` feature in this example).

The mod.rs file in each database type's migrations folder should define a
function for running the migrations. This function requires a database connection
that is specific to the backend implementation used. For example, the
`diesel/migrations/postgres/mod.rs` file would look something like this:

```rust
embed_migrations!("./src/admin/store/diesel/migrations/sqlite/migrations");

use diesel::sqlite::SqliteConnection;

use super::MigrationError;

pub fn run_migrations(conn: &PgConnection) -> Result<(), MigrationError> {
  embedded_migrations::run(conn).map_err(|err| MigrationError {
      context: "Failed to embed migrations".to_string(),
      source: Box::new(err),
  })?;

  info!("Successfully applied PostgreSQL migrations");

  Ok(())
}
```

Diesel requires migration data to be contained within a directory titled
`migrations`, so the migrations for a PostgreSQL store, for example, would be in
the directory `diesel/migrations/postgres/migrations`.

For more on Diesel migrations, see Diesel's
[Getting Started Guide](http://diesel.rs/guides/getting-started/).
