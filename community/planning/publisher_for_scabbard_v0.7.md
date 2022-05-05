---
tags: [Mermaid]
mermaid: true
---
# Publisher for Scabbard v0.7

<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
The publisher component is in charge of executing pending batches and building
the finished result that will be used by some coordinator in consensus
agreement. The published result may be a block, like in
[Hyperledger Sawtooth](https://sawtooth.hyperledger.org/), or the
execution result of one or more batches like in Scabbard.

The following design proposes an implementation for publishing that is flexible
for many use cases while keeping in mind reducing the required number of threads
that are actively running at one time. Thread reduction is important for high
availability requirements for 0.7 Scabbard.

## Guide-level explanation

The publisher is in charge of returning the next item to publish to the
coordinator and consensus. It will return the `PublishedResult` containing
transaction receipts and the bytes to agree upon, for example a block id or a
state root hash. The publisher needs to be able to continue to publish until it
is told to stop. The work may be canceled if the building `PublishedResult` will
no longer be valid, for example if the current chain head has changed.  

The following design is done with the goal of defining Rust structs that would
take a set of traits. These traits would allow the same publisher structs to be
used in any situation (e.i. Scabbard or Sawtooth).

The coordinator will use a PublishFactory that will be used to start the
execution. Once started, a PublishHandle is returned that is used to finish or
cancel the publishing.

### PublishFactory.start(..)

The coordinator will tell the publisher to start building a new
`PublishedResult`. This is done prior to consensus actually being ready to
publish to avoid having to wait for the completion of transaction processing
before receiving the result.

The publisher will get batches from an iterator passed on start. The publisher
will pass the batch/batches to the `BatchVerifier`, which will return batch
execution results. Results will not be returned until `finish()` is called. If
the implementation allows for multiple batches, this allows for batches to
continue to be added and scheduled if they are available.  

### PublishHandle.finish()

When the coordinator is ready to publish a new `PublishedResult`, it will call
`finish()` on the `PublishHandle`. At this time, implementations should abort
any scheduled and current batch validation. The completed batch execution
results will be converted to the expected `PublishedResult` and returned to the
coordinator.

### PublishHandle.cancel()
It is possible that work that is in progress will never be published, for
example if the state root hash has changed. Therefore, the coordinator tells the
`PublishHandle` to `cancel()` the current work, aborting all execution and
throwing away any completed batch execution results.

## Reference-level explanation

> **Note** : All errors currently use InternalError for simplicity.

### Traits used by Publisher

The following traits will be used by either being `Boxed` and passed to the
structs or used to enforce specifics on the generics. The traits will live in
the [Hyperledger Sawtooth library](https://github.com/hyperledger/sawtooth-lib).

#### PublishedResult

The return type after publishing is complete. Defines one of the generics for
the publisher. It will live in sawtooth-lib.

```rust
pub trait PublishedResult: Send {}
```

#### PublishedContext

The context that contains specific information for the building `PublishResult`.
This trait will live in sawtooth-lib and is used to define one of the generics
for the publisher.

```rust
/// This trait would go in sawtooth-lib
pub trait PublisherContext<B: Batch<T>, T: Transaction>: Send {
    fn add_batch_results(&mut self, batch_results: Vec<BatchExecutionResult<B, T>>);

    fn compute_state_id(
        &mut self,
        txn_receipts: &[TransactionReceipt],
    ) -> Result<String, InternalError>;
}
```

#### Batch and Transaction

The trait for a batch that will be used by the publisher. The transactions in a
batch must also be defined by a trait. These trait will live in sawtooth-lib and
is used to define one of the generics for the publisher.

```rust
// This trait would go in sawtooth-lib
pub trait Batch<T: Transaction>: Send {
    fn id(&self) -> &str;

    fn transactions(&self) -> &[T];
}

pub trait Transaction: Send {
    fn id(&self) -> &str;

    fn payload(&self) -> &[u8];

    fn header(&self) -> &[u8];
}
```

#### PublishedResultCreator

This trait will be Boxed and used to generate the resulting `PublishedResult`
from the resulting execution results.

```rust

pub trait PublishedResultCreatorFactory<
    B: Batch<T>,
    C: PublisherContext<B, T>,
    R: PublishedResult,
    T: Transaction,
>
{
    fn new_creator(&self) -> Result<Box<dyn PublishedResultCreator<B, C, R, T>>, InternalError>;
}

```

The publisher will receive a factory for creating this creator, as one is
required per call to `start()`.

```rust
pub trait PublishedResultCreator<
    B: Batch<T>,
    C: PublisherContext<B, T>,
    R: PublishedResult,
    T: Transaction,
>: Send
{
    fn create(
        &self,
        context: C,
        batch_results: Vec<BatchExecutionResult<B, T>>,
        resulting_state_root: String,
    ) -> Result<R, InternalError>;
}
}
```

#### PendingBatches
This trait will be used to get the pending batches, from the `PendingQueue` for
example. This is similar to an `Iterator` but needs to be `Send`. A Boxed
version will be passed on start.

```rust
pub trait PendingBatches<B: Batch<T>, T: Transaction>: Send {
    fn next(&mut self) -> Result<Option<B>, InternalError>;
}
```

#### BatchVerifier
This trait will be used to execute the transactions inside of the batches and
return a list of `BatchExecutionResults`. This trait is meant to mimic the
[Scheduler](https://docs.rs/transact/0.4.3/transact/scheduler/trait.Scheduler.html)
trait in Hyperledger Transact, however it is currently simplified to take out
any assumptions about the threading model in the `Executor` and `Scheduler`.

```rust
pub trait BatchVerifier<B: Batch<T>, C: PublisherContext<B, T>, T: Transaction>: Send {
    fn add_batch(&mut self, batch: B) -> Result<(), InternalError>;

    fn finalize(&mut self) -> Result<Vec<BatchExecutionResult<B, T>>, InternalError>;

    fn cancel(&mut self) -> Result<(), InternalError>;
}
```

When looking at the current uses of `Scheduler.result_callback()`, all examples
either directly send the new batch result over a channel or convert it into a
`SchedulerEvent(Result, Complete, Error)` which is required to know when all
batches have been completed. This finalize method would not be useful for the
use case where all batches submitted must be completed, but does work for the
publisher where execution must be able to be halted at any point.

A new batch verifier will be created when new publishing begins. As such, the
publisher will have a `BatchVerifierFactory`.

```rust
pub trait BatchVerifierFactory<B: Batch<T>, C: PublisherContext<B, T>, T: Transaction> {
    fn start(&mut self, context: C) -> Result<Box<dyn BatchVerifier<B, C, T>>, InternalError>;
}
```

### Publisher Structs

The following structs are meant to only be implemented once and should be
flexible enough to be used for all future use cases. This is possible by using
both generics and Boxed trait implementations. The publisher will be made up
of two main structs called the `PublishFactory` and `PublishHandle`.

#### Small Structs

The following structs will be used by the publisher.

```rust
/// This struct is in sawtooth-lib
#[derive(Clone, Debug)]
pub struct InternalError{..};

/// This struct is in sawtooth-lib
#[derive(Debug, Clone)]
pub struct TransactionReceipt{..};

/// Result of executing a batch.
#[derive(Debug, Clone)]
pub struct BatchExecutionResult<B: Batch<T>, T: Transaction> {
    /// The `BatchPair` which was executed.
    pub batch: B,

    /// The receipts for each transaction in the batch.
    pub receipts: Vec<TransactionReceipt>,

    _transaction: PhantomData<T>,
}
```

#### PublishFactory

The `PublishFactory` will be owned by a coordinator and will be used to start
the publishing for a `PublishedResult`. The coordinator will pass a
`PublishContext` and `Box<PendingBatches>` to the `start()` function. The
`PublishFactory` will spin up a thread for the context.

```rust
enum PublishMessage {
    Cancel,
    Finish,
    Dropped,
}

struct PublishFactory<
    B: 'static + Batch<T>,
    C: 'static + PublisherContext<B, T>,
    R: 'static + PublishedResult,
    T: 'static + Transaction,
> {
    result_creator_factory: Box<dyn PublishedResultCreatorFactory<B, C, R, T>>,
    batch_verifier_factory: Box<dyn BatchVerifierFactory<B, C, T>>,
    _transaction: PhantomData<T>,
}

impl<
        B: 'static + Batch<T>,
        C: 'static + PublisherContext<B, T>,
        R: 'static + PublishedResult,
        T: Transaction,
    > PublishFactory<B, C, R, T>
{
    pub fn new(
        result_creator_factory: Box<dyn PublishedResultCreatorFactory<B, C, R, T>>,
        batch_verifier_factory: Box<dyn BatchVerifierFactory<B, C, T>>,
    ) -> Self {
        Self {
            result_creator_factory,
            batch_verifier_factory,
            _transaction: PhantomData,
        }
    }
}

impl<
        B: Batch<T> + Clone,
        C: PublisherContext<B, T> + Clone,
        R: PublishedResult,
        T: Transaction + Clone,
    > PublishFactory<B, C, R, T>
{
    /// Start building the next publishable unit, referred to as a block going forward
    /// The publisher will start pulling batches off of a pending queue for the provided service
    /// and
    ///
    /// # Arguments
    ///
    /// * `context` - Implementation specific context for the publisher
    /// * `batches` - An interator the returns the next batch to execute
    ///
    /// Returns a PublishHandle that can be used to finish or cancel the executing batch
    ///
    fn start(
        &mut self,
        mut context: C,
        mut batches: Box<dyn PendingBatches<B, T>>,
    ) -> Result<PublishHandle<B, C, R, T>, InternalError> {
        let (sender, rc) = channel();
        let mut verifier = self.batch_verifier_factory.start(context.clone())?;
        let result_creator = self.result_creator_factory.new_creator()?;
        let join_handle = thread::spawn(move || loop {    
            if let Some(batch) = batches.next()? {
                verifier.add_batch(batch)?;
            }

            // Check to see if the batch result should be finished/canceled
            match rc.try_recv() {
                Ok(PublishMessage::Cancel) => {
                    verifier.cancel()?;
                    return Ok(None);
                }
                Ok(PublishMessage::Finish) => {
                    let results = verifier.finalize()?;

                    let mut txn_receipts = Vec::new();
                    for batch_result in results.iter() {
                        let id = batch_result.batch.id();
                        context.add_batch_result(id, batch_result.receipts.to_vec());

                        txn_receipts.append(&mut batch_result.receipts.to_vec())
                    }

                    let state_root = context.compute_state_id(&txn_receipts)?;

                    return Ok(Some(
                      result_creator.create(context, results, state_root)?
                    ));
                }
                Ok(PublishMessage::Dropped) => {
                    return Ok(None);
                }
                Err(TryRecvError::Empty) => (),
                Err(_) => {
                    return Err(InternalError{..});
                }
            };
        });

        Ok(PublishHandle::new(sender, join_handle))
    }
}
```


#### PublishHandler

Once the thread is created a `PublishHandler` will be returned that can be used
by the coordinator to cancel or finish the execution, and receive the finished
`PublishedResults`.

If the `PublishHandle` is dropped without calling either function, the thread
will also be shutdown without issue.

```rust
struct PublishHandle<B: Batch<T>, C: PublisherContext<B, T>, R: PublishedResult, T: Transaction> {
    sender: Option<Sender<PublishMessage>>,
    join_handle: Option<thread::JoinHandle<Result<Option<R>, InternalError>>>,
    _context: PhantomData<C>,
    _batch: PhantomData<B>,
    _transaction: PhantomData<T>,
}

impl<B: Batch<T>, C: PublisherContext<B, T>, R: PublishedResult, T: Transaction>
    PublishHandle<B, C, R, T>
{
    pub fn new(
        sender: Sender<PublishMessage>,
        join_handle: thread::JoinHandle<Result<Option<R>, InternalError>>,
    ) -> Self {
        Self {
            sender: Some(sender),
            join_handle: Some(join_handle),
            _context: PhantomData,
            _batch: PhantomData,
            _transaction: PhantomData,
        }
    }

    /// Finish constructing the block, returning a result that contains the bytes that consensus
    /// must agree upon and a list of TransactionReceipts. Any batches that are not finished
    /// processing, will be returned to the pending state.
    fn finish(mut self) -> Result<R, InternalError> {
        if let Some(sender) = self.sender.take() {
            sender
                .send(PublishMessage::Finish)
                .map_err(|_| InternalError)?;
            match self
                .join_handle
                .take()
                .ok_or(InternalError)?
                .join()
                .map_err(|_| InternalError)?
            {
                Ok(Some(result)) => Ok(result),
                // no result returned
                Ok(None) => Err(InternalError{..}),
                Err(_) => Err(InternalError{..}),
            }
        } else {
            // already called finish or cancel
            Err(InternalError{..})
        }
    }

    /// Cancel the currently building block, putting all batches back into a pending state
    fn cancel(mut self) -> Result<(), InternalError> {
        if let Some(sender) = self.sender.take() {
            sender
                .send(PublishMessage::Cancel)
                .map_err(|_| InternalError)?;
            match self
                .join_handle
                .take()
                .ok_or(InternalError)?
                .join()
                .map_err(|_| InternalError)?
            {
                // Did not expect any results
                Ok(Some(_)) => Err(InternalError{..}),
                Ok(None) => Ok(()),
                Err(_) => Err(InternalError{..}),
            }
        } else {
            // already called finish or cancel
            Err(InternalError{..})
        }
    }
}

impl<B: Batch<T>, C: PublisherContext<B, T>, R: PublishedResult, T: Transaction> Drop
    for PublishHandle<B, C, R, T>
{
    fn drop(&mut self) {
        if let Some(sender) = self.sender.take() {
            match sender.send(PublishMessage::Dropped) {
                Ok(_) => (),
                Err(_) => {
                    println!("Unable to shutdown Publisher thread")
                }
            }
        }
    }
}

```

### Example
An example of using the above API is as follows:

```rust
use one_batch::{
        BatchContext, BatchIter, OneBatch, OneBatchVerifierFactory, OneTransaction,
        PublishBatchResult, PublishBatchResultCreatorFactory,
    };

    let result_creator_factory = Box::new(PublishBatchResultCreatorFactory::new());
    let batch_verifier_factory = Box::new(OneBatchVerifierFactory::new());
    let mut publisher_starter: PublishFactory<
        OneBatch,
        BatchContext,
        PublishBatchResult,
        OneTransaction,
    > = PublishFactory::new(result_creator_factory, batch_verifier_factory);

let pending_batches = Box::new(BatchIter::new());

let context = BatchContext::new(
    "test_circuit".to_string(),
    "test_service".to_string(),
    "abcd".to_string(),
);

println!("Starting Publish");
let publisher_finisher = publisher_starter.start(context, pending_batches)?;

let result = publisher_finisher.finish()?;
println!("Results {:?}", result);
```

## Drawbacks
The current publishing thread contains a very tight loop. One solution would be
to move the checking for a pending batch into a separate thread and send it to
the main thread over a sender. This requires adding a new `PublishMessage`
variant for `PublishMessage::NewBatch`. This would also require that the
`PendingBatches` implementation would block if no batches are currently
available, only returning `None` if no more batches will be provided. It is
important to note that this requires yet another thread for each active service
which may not be desirable.

Another option would be to add a timeout to the `PendingBatches.next()`
function that would cause the pending batch to block for some specified
duration. If a new batch is available it would be returned right away, if not,
after the duration None would be returned. At this point the `PublishMessage`
receiver would be checked to see if any finish/cancel messages have been
received. This would cause some amount of delay between when the
`PublishMessage` will be received and handled. On the plus side this would not
require another thread.

## Rationale and alternatives

Another option investigated was to define the Publisher as a set of traits that
would require every use case to create their own implementation. An example of
these traits can be found here.

While this would allow for more flexibility, it would require more work by
developers when working on a new use case. We do not currently have any use case
that differs from the above process.

## Prior art

This design is inspired by the existing Publisher in [Hyperledger
Sawtooth](https://sawtooth.hyperledger.org/) Core
and the Sawtooth library. As well as the publishing process that is used in
Scabbard and the transaction execution process in [Hyperledger
Transact](https://docs.rs/transact/0.4.3/transact/index.html).

## Unresolved questions

Should the `PublisherFactory` enforce the number of threads allowed with a
thread pool? Or should the caller control how many publishing threads should
exist, as publisher threads correlated to the number of `PublishHandles`?

The current Hyperledger Transact implementation requires several threads running
for the transaction execution. How this API may be improved to reduce the
number of threads required is yet to be determined.

## Sequence Diagrams

### Finalize Artifact

<div class="mermaid">
sequenceDiagram
    participant Coordinator
    participant PublisherFactory
    Participant PublishHandle
    participant PendingBatches
    participant BatchVerifier
    participant BatchVerifierFactory
    participant ArtifactCreator
    participant ArtifactCreatorFactory
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Setup publishing for an Artifact
    Coordinator ->>+ PublisherFactory: Start publishing
    PublisherFactory ->> BatchVerifierFactory: Create Batch Verifier
    BatchVerifierFactory -->> PublisherFactory: Return BatchVerifier
    activate BatchVerifier
    PublisherFactory ->> ArtifactCreatorFactory: Create ArtifactCreator
    ArtifactCreatorFactory -->> PublisherFactory: Return ArtifactCreator
    PublisherFactory ->> PublishHandle: PublishHandle::new()
    PublishHandle -->> PublisherFactory: Return PublishHandle
    %% update for functions calls
    PublisherFactory -->>-  Coordinator: Return PublishHandle
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Processing batches
    loop When a new batch is available
        Coordinator ->> PublishHandle: A Batch is available
        loop Drain pending batches
            PublishHandle ->> PendingBatches:  Request a pending Batch
            PendingBatches -->> PublishHandle: Some(Batch)
            PublishHandle ->> BatchVerifier: Add Batch to BatchVerifier
        end
    end
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,BatchVerifier: Publish a new Artifact
    Coordinator ->> PublishHandle: Notify of RequestForStart
    PublishHandle ->> BatchVerifier: Finalize publishing
    BatchVerifier -->> PublishHandle: Vec&lt;BatchExecutionResult&gt;
    deactivate BatchVerifier
    PublishHandle ->> +ArtifactCreator: Create Artifact
    ArtifactCreator -->>- PublishHandle: Return Artifact
    PublishHandle -->> Coordinator: Publish Artifact
    end
</div>

### Cancel Artifact

<div class="mermaid">
sequenceDiagram
    participant Coordinator
    participant PublisherFactory
    Participant PublishHandle
    participant PendingBatches
    participant BatchVerifier
    participant BatchVerifierFactory
    participant ArtifactCreator
    participant ArtifactCreatorFactory
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Setup publishing for an Artifact
    Coordinator ->>+ PublisherFactory: Start publishing
    PublisherFactory ->> BatchVerifierFactory: Create Batch Verifier
    BatchVerifierFactory -->> PublisherFactory: Return BatchVerifier
    activate BatchVerifier
    PublisherFactory ->> ArtifactCreatorFactory: Create ArtifactCreator
    ArtifactCreatorFactory -->> PublisherFactory: Return ArtifactCreator
    PublisherFactory ->> PublishHandle: PublishHandle::new()
    PublishHandle -->> PublisherFactory: Return PublishHandle
    %% update for functions calls
    PublisherFactory -->>-  Coordinator: Return PublishHandle
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Processing batches
    loop When a new batch is available
        Coordinator ->> PublishHandle: A Batch is available
        loop Drain pending batches
            PublishHandle ->> PendingBatches:  Request a pending Batch
            PendingBatches -->> PublishHandle: Some(Batch)
            PublishHandle ->> BatchVerifier: Add Batch to BatchVerifier
        end
    end
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Cancel building current Artifact
    Coordinator ->> PublishHandle: Notify of Cancel
    PublishHandle ->> BatchVerifier: Cancel publishing
    BatchVerifier -->> PublishHandle: Return
    deactivate BatchVerifier
    PublishHandle -->> Coordinator: Return (consume self)
    end
</div>

### BatchVerifier

<div class="mermaid">
sequenceDiagram
    participant Publisher
    participant BatchVerifierFactory
    participant BatchVerifier
    participant Executor
    participant Scheduler
    rect rgb(192, 192, 192)
    Note over BatchVerifier,Executor: Create and start BatchVerifier
    Publisher ->> BatchVerifierFactory: start(context)
    BatchVerifierFactory ->> BatchVerifier: start(scope, state)
    BatchVerifier ->> Executor:  new(txn_handlers, context_manager)
    Executor -->> BatchVerifier: Result Executor, Err
    BatchVerifier ->>+ Executor: start()
    Executor -->> BatchVerifier: Result (), Err
    BatchVerifier ->> Scheduler: new(context_manager, current_state_root)
    Scheduler -->> BatchVerifier: Result Scheduler, Err
    %% add callback/channel
    BatchVerifier ->> Scheduler: set_result_callback(callback)
    Scheduler -->> BatchVerifier: Result (), Err
    BatchVerifier ->> Executor: execute(Scheduler.take_task_iterator, Scheduler.new_notifier)
    activate Scheduler
    Executor -->> BatchVerifier: Result (), Err
    BatchVerifier -->> BatchVerifierFactory: Result Self, Err
    BatchVerifierFactory ->> Publisher: Result BatchVerifier, Err
    end

    rect rgb(192, 192, 192)
    Note over BatchVerifier,Executor: Add batches for execution
    loop When Publisher adds a Batch
        Publisher ->> BatchVerifier: add_batch(Batch)
        BatchVerifier ->> Scheduler: add_batch(Batch)
        Scheduler -->> BatchVerifier: Result (), Err
        BatchVerifier -->> Publisher: Result (), Err
    end
    end

    rect rgb(192, 192, 192)
    Note over BatchVerifier,Executor: Execute batch and send results over callback
    %% add collect results
    %% adds execution loop
    loop When results are returned from the callback
        Scheduler ->> Executor: Execute batch from Scheduler
        Executor -->> BatchVerifier: BatchResult through callback
    end
    end

    %% split the two below into alternatives
    rect rgb(192, 192, 192)
    Note over BatchVerifierFactory,Executor: Stop execution and gets results
    alt Finalize execution
    Publisher ->> BatchVerifier: finalize()
    BatchVerifier ->> Scheduler: finalize()
    Scheduler -->> BatchVerifier: Result (), Err
    BatchVerifier ->> Scheduler: cancel() // abort all batches that have not completed
    Scheduler -->> BatchVerifier: Result (), Err
    BatchVerifier -->> Publisher: Result Vec&lt;BatchExecutionResult&gt;, Err
    else Cancel execution
    Publisher ->> BatchVerifier: cancel()
    BatchVerifier ->> Scheduler: cancel()
    Scheduler -->> BatchVerifier: Result (), Err
    BatchVerifier -->> Publisher: Result (), Err
    end
    deactivate Scheduler
    deactivate Executor
    end
</div>
