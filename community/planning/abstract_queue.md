---
tags: [Mermaid]
mermaid: true
---

# Abstract Queue
<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This RFC proposes a generic replacement for the pending queue.  This new
functionality allows for queues with different data types.  Secondly, the new
queue API provides abstractions to support durability.  This allows for improved
stability in processing batches and blocks. Lastly, the introduction of a new
abstraction over the queue allows for batches to be injected via the queue
instead of the publisher.

## Motivation
[motivation]: #motivation

The main motivator for the new design is to provide durability of queue-related
operations. The current implementation provides no durability guarantees.
Secondarily, is to provide the capability to re-use queue capabilities for
different definitions of transactions, as defined by the library consumer.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

> Note, this RFC depends on the
> [`RefSet`]({% link community/planning/ref_set.md %}) feature.

The generic queue abstraction splits the interactions with the queue into two
aspects: popping items from the queue and updating the queue.

The `QueueView` provides the API for popping a `RefToken` for an item in the
queue. In this way, the queue provides an order to process, where the items
themselves are stored in an arbitrary fashion in a `RefSet`.

The `QueueCommands` trait provides an API for produces command-oriented changes
to the underlying store for both pushing new items onto the queue, and marking
them complete.

As operations on the items in the queue may be performed asynchronously, the
item needs to be explicitly marked as complete. This should allow for any
failures that may occur while processing the queue.  The underlying storage
implementation may determine how this is applied.

Marking an item complete accepts a `RefToken` and transforms it into a released
`TransferToken`. The implication here is that once an item has been completely
removed from the queue, it is most likely transferred to another component for
the next stage in its life-cycle.

Take, for example, a batch queue. Once a batch is completed, it will be added
to (or its reference transferred to) a candidate block.

These commands produced by the trait may be executed with other commands, such
that they are included in the context of another transaction.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

Queue consumption is provided by the `QueueView` API, backed by a `QueueStore`.
As this is a fairly trivial wrapper built on top of both a `QueueStore`
implementation and `RefSet`, the complete implementation may be included here.

```rust
/// A store interface for a removing items from a persistent queue.
pub trait QueueStore<ID>: Send + Sync {
    /// Pop an item off the front of the queue, if one is available.
    ///
    /// This should not block.
    fn pop(&self) -> Result<Option<ID>, InternalError>;

    /// Return the curent queue length.
    ///
    /// # Returns
    ///
    /// The size of the queue.
    ///
    /// # Errors
    ///
    /// An [InternalError], if the size cannot be returned.
    fn len(&self) -> Result<u64, InternalError>;
}

/// A view over a queue store which provides [`RefToken`] values for each item
/// popped off the queue.
pub struct QueueView<ID, T, Q>
where
    ID: Send + Eq + Hash + Clone,
    T: Identifiable<ID>,
    Q: QueueStore<ID>,
{
    shared_queue: Q,
    ref_set: RefSet<T, ID>,
}

impl<ID, T, Q> QueueView<ID, T, Q>
where
    ID: Send + Eq + Hash + Clone,
    T: Identifiable<ID>,
    Q: QueueStore<ID>,
{
    /// Construct a new `QueueView` from a queue store and a [`RefSet`].
    pub fn new(shared_queue: Q, ref_set: RefSet<T, ID>) -> Self {
        Self {
            shared_queue,
            ref_set,
        }
    }

    /// Return the [`RefToken`] for the next item in the queue, if there is one.
    ///
    /// This method should not block
    pub fn try_next(&self) -> Result<Option<RefToken<ID>>, InternalError> {
        self.shared_queue.pop().and_then(|opt| {
            opt.map(|id| self.ref_set.upgrade(id))
                .transpose()
                .map(Option::flatten)
        })
    }
}
```

Updates to the queue are made via commands and transfer tokens provided by
`QueueCommands` implementations.

```rust
/// Returns commands for operations on the queue that should be applied
/// atomically with other external commands.
pub trait QueueCommands {
    type Item: Send;
    type Context;

    /// Mark an item as complete, returning the transfer token for that item
    fn complete(
        &self,
        ref_tokens: Vec<RefToken<Self::Item>>,
    ) -> TransferToken<Self::Item, Self::Context, Released>;

    /// Push a item onto the queue, via a transfer token.
    ///
    /// Returns a `QueueCommand` that may be executed as part of an atomic group
    /// of commands.
    fn push(
        &self,
        transfer_token: TransferToken<Self::Item, Self::Context, Released>,
    ) -> Box<dyn QueueCommand<Context = Self::Context> + '_>;
}

/// A queue command executed within a context.
pub trait QueueCommand {
    type Context;

    /// Execute this command with the provided context.
    fn execute(&self, ctx: &Self::Context) -> Result<(), InternalError>;
}
```

### Example

This sequence diagram shows the how this queue design would interact within a
sawtooth-style publishing context.

<div class="mermaid">
sequenceDiagram
    participant C as Coordinator
    participant P as Publisher
    participant Q as Queue
    participant QC as QueueCommands
    participant V as BatchVerifier
    participant R as RefSet
    C ->> P: Start Publishing
    rect rgb(192, 192, 256)
    note right of P: While constructing artifact
    loop Adding batches to artifact
        P ->>+ Q: try_next()
        Q -->>- P: Some(RefId)
        P ->> V: RefId
        V ->>+ R: RefId
        R -->>- V: Lease&lt;Batch&gt;
        V ->>P: BatchResult
    end
    end
    C ->> P: Publish
    rect rgb(192, 192, 256)
    note right of P: Marking queue items as verified
    P ->>+ QC: complete(ref_ids)
    QC-->>- P: TransferToken&lt;Released&gt;
    end
</div>

## Drawbacks
[drawbacks]: #drawbacks

One drawback in this design is the use of Commands creates a potential
difficulty in debugging when a change is specified versus when it is actually
committed.  The benefits to having atomic cross-component updates to the
database (without leaking details between components) greatly outweigh this
drawback.

## Rationale and alternatives
[alternatives]: #alternatives

One alternative is adapting the existing `PendingBatchQueue` to be durable.
Unfortunately, the API doesn't provide a way for this to be handled in an atomic
way, with respect to other components, such as the Publisher.

## Prior art
[prior-art]: #prior-art

The existing pending queue provides some input into this design, in that similar
needs must be met.  It differs in that the abstract queue is not directly
responsible for back-pressure.

## Unresolved questions
[unresolved]: #unresolved-questions

None.
