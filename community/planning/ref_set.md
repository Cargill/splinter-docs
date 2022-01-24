# RefSet
<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: ##summary

The `RefSet` provides a singular source of objects, similar to the Sawtooth
`BlockManager` in its scope. This generalized `RefSet` can provide a singular
reference to an object held in storage, using the ID as its reference.

## Motivation
[motivation]: ##motivation

This RFC intends to simplify and generalize the BlockManager for use with other
objects, such as batches.  This will provide broader usage for library
consumers.

## Guide-level explanation
[guide-level-explanation]: ##guide-level-explanation

The `RefSet` provides references to data objects.  For example, it can be used
to store blocks or batches.  The object manager's role is to ensure that only a
single instance of an object exists in memory.

The managed objects need to provide some value as an identifier. This ID will be
used to reference the object by other components. A reference may be requested
from the `RefSet` using a raw ID, but the manager will return a reference only
if it contains the referenced object.

The `RefSet` will provide access to its managed objects via leases.  These
leases allow the caller to reference the object, but not modify it.
Modifications may only be done by creating a new instance, with a new ID.

Unlike the current `BlockManager`, the `RefSet` will rely on the underlying
store to provide strong guarantees that an object with any references will not
be deleted. Initial store implementations will rely on RDBSs to provide those
guarantees, via foreign key constraints.

Moving the referential integrity to the underlying storage system does mean that
a component holding onto an object reference is not necessarily guaranteed that
the object exists.  It does require that the component has performed a necessary
upgrade of a raw ID before attempting to acquire a lease to the object.

If the component holding a reference requires referential integrity, it must
persist its own reference.  For example, all chain heads of interest must be
persisted, to guarantee that blocks stored via a `RefSet<Block>` are preserved.

In a SQL environment, this can be accomplished with two foreign key constraints.
The first constraint is between a block ID and a block's `previous_block_id` in
the primary block table.  The second constraint is between a `chain_head`
record's block ID and a block in the primary block table. With these
constraints, an individual block in the primary table cannot be deleted without
the referencing record being deleted.

References are held through the use of a `RefToken`.  These tokens convey
ownership of a reference to an item in the `RefSet`.  That ownership may be
transferred to another component.  In order to do so, the transferring component
may provide a `Command` to be executed when the transfer is complete. The
transferee may also provide a `Command` on acquisition of the token. These two
commands will be executed within a transactional context, such that they are
executed atomically.

## Reference-level explanation
[reference-level-explanation]: ##reference-level-explanation

### Managed Objects

Each object, `T`, with an identifier `ID`, stored in a `RefSet` has the
following requirements:

```rust
where
    T: Identifiable<ID>,
    ID: Send + Clone + Eq + Hash,
```

The trait `Identifiable` is defined as follows:

```rust
pub trait Identifiable<ID> {
    /// Return an identifier for the implementor.
    fn id(&self) -> &ID;
}
```

### RefSet

The `RefSet` struct itself has the following API:

```rust
pub struct RefSet<T, ID> {
    ...
}

impl<T, ID> RefSet<T, ID>
where
    T: Identifiable<ID>,
    ID: Send + Clone + Eq + Hash,
{
    /// Construct a new `RefSet`
    ///
    /// Args
    /// * set_store: The underlying persistences store for the objects in the
    ///   set
    pub fn new(set_store: impl SetStore<Object=T, ID = ID>) -> Self {
        ...
    }

    /// Return a lease to an item in the set, if it exists.
    ///
    /// ## Args
    ///
    /// * obj_ref: an shared id reference with which to request the item
    ///
    /// ## Returns
    ///
    /// A lease to the item, if it exists in the set.
    ///
    /// ## Errors
    ///
    /// Returns an `InternalError` if there is an issue with the underlying
    /// storage system.
    pub fn get(
        &self,
        obj_ref: &RefToken<ID>
    ) -> Result<Option<Lease<'_, T>>, InternalError> {
        ...
    }

    /// Add an item to the set.
    ///
    /// This method adds an item to the set, which results in the item being
    /// persisted via this instance's `SetStore`.
    ///
    /// ## Args
    ///
    /// * obj: an shared id reference with which to request the item
    ///
    /// ## Returns
    ///
    /// A ShareableRef to the ID of the item, based on its definition of
    /// `Identifiable`.
    ///
    /// ## Errors
    ///
    /// * Returns an `InvalidStateOrInternalError` if the item is a duplicate,
    ///   based on its identifier
    /// * Returns an `InternalError` if there is an issue with the underlying
    ///   storage system
    pub fn add(&self, obj: T)
        -> Result<RefToken<ID>, InvalidStateOrInternalError>
    {
        ...
    }

    /// Upgrade an ID to a RefToken, if it exists in the set.
    ///
    /// ## Args
    ///
    /// * id: the identifier to be upgraded
    ///
    /// ## Returns
    ///
    /// A ShareableRef to the ID, if it exists in the set.
    ///
    /// ## Errors
    ///
    /// Returns an `InternalError` if there is an issue with the underlying
    /// storage system.
    pub fn upgrade(&self, id: &ID)
        -> Result<Option<RefToken<ID>>, InternalError>
    {
        ...
    }
}
```

### Leases

An `Lease` provides read access to an item in the `RefSet`. It has the following
signature:

```rust
struct Lease<'a, T>
```

It implements `Deref<Target = T>`, which allows the lease to be used as such:

```rust
    // This set uses strings, where Identifiable has been implemented on a
    // string returning itself, with a hypothetical store.
    let set: RefSet<String, String> = RefSet::new(StringStore);

    let my_ref = set.add(String::from("my batch"))?;

    assert_eq!(Some(&String::from("my batch")), set.get(&my_ref)?.as_deref());
```

This lease is `!Send`, explicitly so that it can't be sent to other threads.
Only a `RefToken` and the `RefSet` may be sent to other threads.

### Reference Tokens

References are held through the use of a `RefToken`.  These tokens convey
ownership of a reference to an item in the `RefSet`.  That ownership may be
transferred to another component.  In order to do so, the transferring component
may provide a `Command` to be executed when the transfer is complete. The
transferee may also provide a `Command` on acquisition of the token. These two
commands will be executed within a transactional context, such that they are
executed atomically.

The details of the `RefToken` and its transfer life-cycle are as follows:

```rust
pub struct RefToken<T>(T);

impl<T: Send> RefToken<T> {
    pub fn value(&self) -> &T {
        &self.0
    }

    pub fn release<C>(
        self,
        release_commands: Vec<Box<dyn Command<T, C> + Send>>,
    ) -> TransferToken<T, C, Released> {
        TransferToken {
            id: self.0,
            commands: release_commands,
            _state: std::marker::PhantomData,
        }
    }
}

pub trait TransferState {}

pub struct Released;
impl TransferState for Released {}

pub struct Acquired;
impl TransferState for Acquired {}

pub struct TransferToken<T: Send, C, S: TransferState> {
    id: T,
    commands: Vec<Box<dyn Command<T, C> + Send>>,
    _state: std::marker::PhantomData<S>
}

impl<T, C, S> TransferToken<T, C, S> {
    pub fn value(&self) -> &T {
        &self.id
    }
}

impl<T: Send, C> TransferToken<T, C, Released> {
    pub fn acquire(
        self,
        mut acquire_commands: Vec<Box<dyn Command<T, C> + Send>>,
    ) -> TransferToken<T, C, Aqcuired> {
        let mut commands = self.commands;
        commands.append(&mut acquire_commands);
        TransferToken {
            id: self.id,
            commands,
            _state: std::marker::PhantomData,
        }
    }
}

impl<T: Send, C> TransferToken<T, C, Acquired> {
    pub fn complete(self, context: &C) -> Result<RefToken<T>, InternalError> {
        for command in self.commands {
            command.execute(&self.id, context)?;
        }
        Ok(RefToken(self.id))
    }
}

pub trait Command<T, C> {
    fn execute(&self, t: &T, context: &C) -> Result<(), InternalError>;
}
```

### Persistence

Persistence is provided to the `RefSet` via a `SetStore` implementation. This
trait provides the `RefSet` with operations that include storing, loading, and
checking for the existence of objects in the set. It is defined as follows:

```rust
pub trait SetStore: Sync + Send {
    type ID;
    type Object: Identifiable<Self::ID>;

    fn persist(&self, obj: Self::Object) -> Result<(), InternalError>;

    fn get(&self, id: &Self::ID) -> Result<Option<Self::Object>, InternalError>;

    fn has(&self, id: &Self::ID) -> Result<bool, InternalError>;
}
```

A `Lease` has a lifetime, which limits it to local (i.e. single-threaded) use.
The lease provides `Deref<Target = T>` for accessing the data.

A `RefToken` provides the reference that should be used or held by the caller
to retrieve a full reference to the data.

### Example: Replacing the BlockManager

The existing `BlockManager` can be replaced by an instance of a `RefSet`, backed
by an implementation of the `SetStore` on `Block` structures.

We can introduce several type definitions for the block management purposes:

```rust
type HeaderSignature = String;
type BlockRef = RefToken<HeaderSignature>;
type BlockManager = RefSet<Block, HeaderSignature>;
```

The `SetStore` implementation would be backed by a table. The parts of the table
relevant to this discussion are described here:

```sql
CREATE TABLE blocks (
    header_signature VARCHAR(128) NOT NULL PRIMARY KEY,
    --- ... details omitted
    previous_block_id VARCHAR(128),
    previous_block_ref VARCHAR(128),
    FOREIGN KEY(previous_block_ref) REFERENCES blocks(header_signature)
);
```

In sawtooth, there are two main components that hold on to block references: the
Completer and the Chain Controller.  The former is used to retrieve blocks the
local node doesn't have. The latter is used to track the various chain heads in
question.

In order to preserve referential integrity of the blocks being completed, the
Completer should persist a list of blocks pending completion:

```sql
CREATE TABLE pending_blocks (
    block_id VARCHAR(128) NOT NULL PRIMARY KEY,
    pending_previous_block_id: VARCHAR(128) NOT NULL,
    FOREIGN KEY(block_id) REFERENCES blocks(header_signature)
);
```

When it inserts a block into the `BlockManager` (again, just a `RefSet`), the
underlying `SetStore` implementation will insert the block without a
`previous_block_ref` if the previous block isn't yet stored. If this is
the case, the completer will insert an entry into the `pending_blocks` table for
the block awaiting its predecessor.

Once the block has been completed, it will update the `blocks` table to add the
`previous_block_ref` to create the reference link between the blocks.

The `RefToken` would be released, with a command to remove the reference from
the `pending_blocks` table.  The `TransferToken` would be sent to the chain
controller, which would acquire the token with a command to commit the block to
its own table of references. When the transfer is completed, both changes are
committed atomically.

The chain controller would likewise commit a list of chain heads. This simple
table would be as follows:

```sql
CREATE TABLE chain_heads (
    chain_head VARCHAR(128) NOT NULL PRIMARY KEY,
    FOREIGN KEY(chain_head) REFERENCES blocks(header_signature)
);
```

Any chains being considered would have a record in this table. When a chain is
no longer of interest, it can be deleted.

> Note, this simplifies the current system to these two components, but omits
> the reference needs of intermediate systems, such as block validation.

Finally, when there are no references to a block in the `blocks` table,
including via `previous_block_id` values, then the block may be deleted.

## Drawbacks
[drawbacks]: ##drawbacks

A limiting factor of this implementation is that users of the `RefSet` must
persist their references if they want to maintain referential integrity. It
strongly implies that any strictly in-memory operations must gracefully handle
missing items from the set.

However, the simplicity of this solution as well as relying on tried and true
technologies outweigh the cost.  This is especially true in the areas where
referential integrity is required.  The benefits of persisting this information
greatly outweigh the loss of in-memory integrity.

## Rationale and alternatives
[alternatives]: ##alternatives

One alternative is to maintain all the references in memory. This requires a
complex set of explicit and implicit references, as well as additional extension
points for implementing dependencies between items in the set - blocks and their
predecessors, or blocks and their batches.  These definitions depend on the
implementation of a "block" which may differ depending on library consumer.

This alternative was considered, but it was determined that move towards storing
all data in SQL provided the opportunity to make use of existing technologies to
implement inter-component references in a simplified manner.

## Prior art
[prior-art]: ##prior-art

The current `BlockManager` solves the problem of reference integrity via
in-memory reference counting.

## Unresolved questions
[unresolved]: ##unresolved-questions

* How is clean-up handled?  There are several ideas here (triggers, background
  clean process) but currently a best solution has not presented itself.

* How is atomicity of storage handled?

  An example, a block is added to a `RefSet<Block>` and consequently written to
  its underlying SQL-backed `SetStore`.  After this operation, a set of
  transaction receipts are written to the database. These operations should be
  done within the context of a database transaction, but it is unclear how to
  add that with the storage abstraction one layer below the call site of adding
  the block.
