---
tags: [Mermaid]
mermaid: true
---
# Publisher for Scabbard v3

<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
The publisher component is in charge of executing pending batches and building
the finished result that will be used by some supervisor in consensus
agreement. The published result may be a block, like in
[Hyperledger Sawtooth](https://sawtooth.hyperledger.org/), or the
execution result of one or more batches like in Scabbard.

The following design proposes an implementation for publishing that is flexible
for many use cases while keeping in mind reducing the required number of threads
that are actively running at one time. Thread reduction is important for high
availability requirements for v3 Scabbard.

## Guide-level explanation

The publisher is in charge of returning the next item to publish to the
supervisor and consensus. It will return the `Artifact` to agree upon, for 
example a block or a batch execution result. The publisher needs to be able to 
continue to publish until it is told to stop. The work may be canceled if the 
building `Artifact` will no longer be valid, for example if the current chain
 head has changed.  

The following design is done with the goal of defining Rust structs that would
take a set of traits. These traits would allow the same publisher structs to be
used in any situation (e.i. Scabbard or Sawtooth).

The supervisor will use a `PublishFactory` that will be used to start the
execution. Once started, a `PublishHandle` is returned that is used to finish or
cancel the publishing.

### PublishFactory.start(..)

The supervisor will tell the publisher to start building a new
`Artifact`. This is done prior to consensus actually being ready to
publish to avoid having to wait for the completion of transaction processing
before receiving the result.

The publisher will get batches from an iterator passed on start. The publisher
will pass the batch/batches to the `BatchVerifier`, which will return batch
execution results. Results will not be returned until `finish()` is called. If
the implementation allows for multiple batches, this allows for batches to
continue to be added and scheduled if they are available.  

### PublishHandle.finish()

When the supervisor is ready to publish a new `Artifact`, it will call
`finish()` on the `PublishHandle`. At this time, implementations should abort
any scheduled and current batch validation. The completed batch execution
results will be converted to the expected `Artifact` and returned to the
supervisor.

### PublishHandle.cancel()
It is possible that work that is in progress will never be published, for
example if the state root hash has changed. Therefore, the supervisor tells the
`PublishHandle` to `cancel()` the current work, aborting all execution and
throwing away any completed batch execution results.

## Reference-level explanation

### Traits used by Publisher

The following traits will be used by either being Boxed and passed to the
structs, as generics or as associated types. The traits will live in
the [Hyperledger Sawtooth library](https://github.com/hyperledger/sawtooth-lib).

#### Artifact

The return type after publishing is complete. Defines one of the generics for
the publisher. It will live in sawtooth-lib.

```rust
/// An artifact.
///
/// An artifact is an identifiable product of the publishing process and the 
/// core value to be validated by a system based on Sawtooth.
pub trait Artifact: Clone + Send {
    /// The type of the identifier.
    type Identifier: ?Sized;

    /// Returns a reference to this artifact's identifier.
    fn artifact_id(&self) -> &Self::Identifier;
}
```

#### PublishingContext

The context that contains specific information for the building `Artifact`.
This trait will live in sawtooth-lib and is used to define one of the generics
for the publisher.

```rust
/// The context used by the publisher
pub trait PublishingContext: Send {}
```

#### Batch

The trait for a batch that will be used by the publisher. This trait will live 
in sawtooth-lib and is used to define one of the generics for the publisher.

```rust
pub trait Batch: Send {}
```

#### ArtifactCreator

This trait will be Boxed and used to generate the resulting `Artifact`
from the resulting execution results.

```rust
/// An artifact creator.
///
/// Used to create new instances of `Artifact`.
pub trait ArtifactCreator: Send {
    /// The context that contains extraneous information required to create the
    /// `Artifact`.
    type Context;
    /// The type of input for the specific `Artifact`
    type Input;
    /// The `Artifact` type
    type Artifact;

    /// Creates a new `Artifact`
    ///
    /// Returns a an `Artifact` created from the context and input
    fn create(
        &self,
        context: &mut Self::Context,
        input: Self::Input,
    ) -> Result<Self::Artifact, InternalError>;
}
```

The publisher will receive a factory for creating this creator, as one is
required per call to `start()`.

```rust
/// An artifact creator factory.
///
/// Used to create new instances of `ArtifactCreator`.
pub trait ArtifactCreatorFactory {
    /// The `ArtifactCreator` type
    type ArtifactCreator;

    /// Returns a new `ArtifactCreator`
    fn new_creator(&self) -> Result<Self::ArtifactCreator, InternalError>;
}
```

#### PendingBatches
This trait will be used to get the pending batches, from the `PendingQueue` for
example. This is similar to an `Iterator` but needs to be `Send`. A Boxed
version will be passed on start.

```rust
/// Return the next `Batch` that should be executed
pub trait PendingBatches<B: Batch>: Send {
    fn next(&mut self) -> Result<Option<B>, InternalError>;
}
```

#### BatchVerifier
This trait will be used to execute the transactions inside of the batches and
return a list of `BatchExecutionResults`. This trait is meant to mimic the
[Scheduler](https://docs.rs/transact/0.4.5/transact/scheduler/trait.Scheduler.html)
trait in Hyperledger Transact, however it is currently simplified to take out
any assumptions about the threading model in the `Executor` and `Scheduler`.

```rust
/// Result of executing a batch.
pub trait BatchExecutionResult: Send {}

/// Verify the contents of a `Batch` and its transactions
pub trait BatchVerifier: Send {
    type Batch: Batch;
    type Context: PublishingContext;
    type ExecutionResult: BatchExecutionResult;

    /// Add a new batch to the verifier
    fn add_batch(&mut self, batch: Self::Batch) -> Result<(), InternalError>;

    /// Finalize the verification of the batches, returning the execution results of batches
    /// that have completed execution.
    fn finalize(&mut self) -> Result<Vec<Self::ExecutionResult>, InternalError>;

    /// Cancel exeuction of batches, discarding all excution results
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
/// A Factory to create `BatchVerifier` instances
pub trait BatchVerifierFactory {
    type Batch: Batch;
    type Context: PublishingContext;
    type ExecutionResult: BatchExecutionResult;

    // allow type complexity here because of the use of associated types
    #[allow(clippy::type_complexity)]
    /// Start execution of batches in relation to a specific context by
    /// returning a `BatchVerifier`
    fn start(
        &mut self,
        context: Self::Context,
    ) -> Result<
        Box<
            dyn BatchVerifier<
                Batch = Self::Batch,
                Context = Self::Context,
                ExecutionResult = Self::ExecutionResult,
            >,
        >,
        InternalError,
    >;
}
```

### Publisher Structs

The following structs are meant to only be implemented once and should be
flexible enough to be used for all future use cases. This is possible by using
both generics and Boxed trait implementations. The publisher will be made up
of two main structs called the `PublishFactory` and `PublishHandle`.

#### PublishFactory

The `PublishFactory` will be owned by a supervisor and will be used to start
the publishing for a `Artifact`. The supervisor will pass a
`PublishingContext` and `Box<PendingBatches>` to the `start()` function. The
`PublishFactory` will spin up a thread for the context.

```rust
pub enum PublishMessage {
    Cancel,
    Finish,
    Next,
    Dropped,
}

pub struct PublishFactory<B, C, R, I>
where
    B: 'static + Batch + Clone,
    C: 'static + PublishingContext + Clone,
    R: 'static + Artifact,
    I: 'static + BatchExecutionResult,
{
    artifact_creator_factory: Box<
        dyn ArtifactCreatorFactory<
            ArtifactCreator = Box<dyn ArtifactCreator<Context = C, Input = Vec<I>, Artifact = R>>,
        >,
    >,
    batch_verifier_factory:
        Box<dyn BatchVerifierFactory<Batch = B, Context = C, ExecutionResult = I>>,
}

impl<B, C, R, I> PublishFactory<B, C, R, I>
where
    B: 'static + Batch + Clone,
    C: 'static + PublishingContext + Clone,
    R: 'static + Artifact,
    I: 'static + BatchExecutionResult,
{
    pub fn new(
        artifact_creator_factory: Box<
            dyn ArtifactCreatorFactory<
                ArtifactCreator = Box<
                    dyn ArtifactCreator<Context = C, Input = Vec<I>, Artifact = R>,
                >,
            >,
        >,
        batch_verifier_factory: Box<
            dyn BatchVerifierFactory<Batch = B, Context = C, ExecutionResult = I>,
        >,
    ) -> Self {
        Self {
            artifact_creator_factory,
            batch_verifier_factory,
        }
    }
}

impl<B, C, R, I> PublishFactory<B, C, R, I>
where
    B: 'static + Batch + Clone,
    C: 'static + PublishingContext + Clone,
    R: 'static + Artifact,
    I: 'static + BatchExecutionResult,
{
    pub fn new(
        artifact_creator_factory: Box<
            dyn ArtifactCreatorFactory<
                ArtifactCreator = Box<
                    dyn ArtifactCreator<Context = C, Input = Vec<I>, Artifact = R>,
                >,
            >,
        >,
        batch_verifier_factory: Box<
            dyn BatchVerifierFactory<Batch = B, Context = C, ExecutionResult = I>,
        >,
    ) -> Self {
        Self {
            artifact_creator_factory,
            batch_verifier_factory,
        }
    }
}

impl<B, C, R, I> PublishFactory<B, C, R, I>
where
    B: 'static + Batch + Clone,
    C: 'static + PublishingContext + Clone,
    R: 'static + Artifact,
    I: 'static + BatchExecutionResult,
{
    /// Start building the next `Artifact`
    ///
    /// # Arguments
    ///
    /// * `context` - Implementation specific context for the publisher
    /// * `batches` - An interator the returns the next batch to execute
    ///
    /// Returns a PublishHandle that can be used to finish or cancel the executing batch
    pub fn start(
        &mut self,
        mut context: C,
        mut batches: Box<dyn PendingBatches<B>>,
    ) -> Result<PublishHandle<R>, InternalError> {
        let (sender, rc) = channel();
        let mut verifier = self.batch_verifier_factory.start(context.clone())?;
        let artifact_creator = self.artifact_creator_factory.new_creator()?;
        let join_handle = thread::spawn(move || loop {
            // drain the queue
            while let Some(batch) = batches.next().map_err(|err| err.reduce_to_string())? {
                verifier
                    .add_batch(batch)
                    .map_err(|err| err.reduce_to_string())?;
            }

            // Check to see if the batch result should be finished/canceled
            match rc.recv() {
                Ok(PublishMessage::Cancel) => {
                    verifier.cancel().map_err(|err| err.reduce_to_string())?;
                    return Ok(None);
                }
                Ok(PublishMessage::Finish) => {
                    let results = verifier.finalize().map_err(|err| err.reduce_to_string())?;

                    return Ok(Some(
                        artifact_creator
                            .create(&mut context, results)
                            .map_err(|err| err.reduce_to_string())?,
                    ));
                }
                Ok(PublishMessage::Dropped) => {
                    return Ok(None);
                }
                Ok(PublishMessage::Next) => {
                    while let Some(batch) = batches.next().map_err(|err| err.reduce_to_string())? {
                        verifier
                            .add_batch(batch)
                            .map_err(|err| err.reduce_to_string())?;
                    }
                }
                Err(err) => {
                    return Err(InternalError::from_source(Box::new(err)).reduce_to_string());
                }
            };
        });

        Ok(PublishHandle::new(sender, join_handle))
    }
}

```

#### PublishHandler

Once the thread is created a `PublishHandler` will be returned that can be used
by the supervisor to cancel or finish the execution, and receive the finished
`Artifacts`.

If the `PublishHandle` is dropped without calling either function, the thread
will also be shutdown without issue.

```rust
/// Handler for interating with a publishing thread
pub struct PublishHandle<R>
where
    R: Artifact,
{
    sender: Option<Sender<PublishMessage>>,
    join_handle: Option<thread::JoinHandle<Result<Option<R>, String>>>,
}

impl<R> PublishHandle<R>
where
    R: Artifact,
{
    /// Create a new `PublishHandle`
    ///
    /// Arguments
    ///
    /// * `sender` - The `Sender` for seting updates to the publishing thread
    /// * `join_handle` - The `JoinHandle` to the publishing thread, used to get the published
    ///    `Artifact`
    pub fn new(
        sender: Sender<PublishMessage>,
        join_handle: thread::JoinHandle<Result<Option<R>, String>>,
    ) -> Self {
        Self {
            sender: Some(sender),
            join_handle: Some(join_handle),
        }
    }

    /// Finish constructing the block, returning a result that contains the bytes that consensus
    /// must agree upon and a list of TransactionReceipts. Any batches that are not finished
    /// processing, will be returned to the pending state.
    pub fn finish(mut self) -> Result<R, InternalError> {
        if let Some(sender) = self.sender.take() {
            sender
                .send(PublishMessage::Finish)
                .map_err(|err| InternalError::from_source(Box::new(err)))?;
            match self
                .join_handle
                .take()
                .ok_or_else(|| InternalError::with_message("Missing join handle".into()))?
                .join()
                .map_err(|err| {
                    InternalError::with_message(format!(
                        "Unable to call join on join handle: {:?}",
                        err
                    ))
                })? {
                Ok(Some(result)) => Ok(result),
                // no result returned
                Ok(None) => Err(InternalError::with_message(
                    "Publishing was finalized, should have received results".into(),
                )),
                Err(err) => Err(InternalError::with_message(err)),
            }
        } else {
            // already called finish or cancel
            Err(InternalError::with_message(
                "Publishing has already been finished or canceled".into(),
            ))
        }
    }

    /// Cancel the currently building block, putting all batches back into a pending state
    pub fn cancel(mut self) -> Result<(), InternalError> {
        if let Some(sender) = self.sender.take() {
            sender
                .send(PublishMessage::Cancel)
                .map_err(|err| InternalError::from_source(Box::new(err)))?;
            match self
                .join_handle
                .take()
                .ok_or_else(|| InternalError::with_message("Missing join handle".into()))?
                .join()
                .map_err(|err| {
                    InternalError::with_message(format!(
                        "Unable to call join on join handle: {:?}",
                        err
                    ))
                })? {
                // Did not expect any results
                Ok(Some(_)) => Err(InternalError::with_message(
                    "Publishing was cancel, should not have got results".into(),
                )),
                Ok(None) => Ok(()),
                Err(err) => Err(InternalError::with_message(err)),
            }
        } else {
            // already called finish or cancel
            Err(InternalError::with_message(
                "Publishing has already been finished or canceled".into(),
            ))
        }
    }

    /// Notify that there is a batch added to the pending queue
    pub fn next_batch(&self) -> Result<(), InternalError> {
        if let Some(sender) = &self.sender {
            sender
                .send(PublishMessage::Next)
                .map_err(|err| InternalError::from_source(Box::new(err)))
        } else {
            Ok(())
        }
    }
}

impl<R> Drop for PublishHandle<R>
where
    R: Artifact,
{
    fn drop(&mut self) {
        if let Some(sender) = self.sender.take() {
            match sender.send(PublishMessage::Dropped) {
                Ok(_) => (),
                Err(_) => {
                    error!("Unable to shutdown Publisher thread")
                }
            }
        }
    }
}

```

### Example
An example of using the above API is as follows:

```rust
let artifact_creator_factory = Box::new(TestArtifactCreatorFactory {});
let batch_verifier_factory = Box::new(TestBatchVerifierFactory {});

let mut publish_factory: PublishFactory<
    TestBatch,
    Arc<Mutex<TestContext>>,
    TestArtifact,
    TestBatchExecutionResult,
> = PublishFactory::new(artifact_creator_factory, batch_verifier_factory);

let pending_batches = Box::new(BatchIter {
    batches: vec![TestBatch {
        value: "value_1".to_string(),
    }],
});

let context = Arc::new(Mutex::new(TestContext {
    current_block_height: 0,
    current_state_value: "genesis".to_string(),
}));

// Start publishing for first batch
let publish_handle = publish_factory
    .start(context.clone(), pending_batches)
    .expect("Unable to start publishing thread");

publish_handle
    .next_batch()
    .expect("Unable to notify publisher thread of new batch");
// Finish the publishing of the artifact
let artifact = publish_handle
    .finish()
    .expect("Unable to finalize publishing thread");

assert_eq!(artifact.block_height, 1);
assert_eq!(artifact.current_value, "value_1".to_string());
```

## Rationale and alternatives

Another option investigated was to define the Publisher as a set of traits that
would require every use case to create their own implementation.

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
    participant Supervisor
    participant PublisherFactory
    Participant PublishHandle
    participant PendingBatches
    participant BatchVerifier
    participant BatchVerifierFactory
    participant ArtifactCreator
    participant ArtifactCreatorFactory
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Setup publishing for an Artifact
    Supervisor ->>+ PublisherFactory: Start publishing
    PublisherFactory ->> BatchVerifierFactory: Create Batch Verifier
    BatchVerifierFactory -->> PublisherFactory: Return BatchVerifier
    activate BatchVerifier
    PublisherFactory ->> ArtifactCreatorFactory: Create ArtifactCreator
    ArtifactCreatorFactory -->> PublisherFactory: Return ArtifactCreator
    PublisherFactory ->> PublishHandle: PublishHandle::new()
    PublishHandle -->> PublisherFactory: Return PublishHandle
    %% update for functions calls
    PublisherFactory -->>-  Supervisor: Return PublishHandle
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Processing batches
    loop When a new batch is available
        Supervisor ->> PublishHandle: A Batch is available
        loop Drain pending batches
            PublishHandle ->> PendingBatches:  Request a pending Batch
            PendingBatches -->> PublishHandle: Some(Batch)
            PublishHandle ->> BatchVerifier: Add Batch to BatchVerifier
        end
    end
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,BatchVerifier: Publish a new Artifact
    Supervisor ->> PublishHandle: Notify of RequestForStart
    PublishHandle ->> BatchVerifier: Finalize publishing
    BatchVerifier -->> PublishHandle: Vec&lt;BatchExecutionResult&gt;
    deactivate BatchVerifier
    PublishHandle ->> +ArtifactCreator: Create Artifact
    ArtifactCreator -->>- PublishHandle: Return Artifact
    PublishHandle -->> Supervisor: Publish Artifact
    end
</div>

### Cancel Artifact

<div class="mermaid">
sequenceDiagram
    participant Supervisor
    participant PublisherFactory
    Participant PublishHandle
    participant PendingBatches
    participant BatchVerifier
    participant BatchVerifierFactory
    participant ArtifactCreator
    participant ArtifactCreatorFactory
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Setup publishing for an Artifact
    Supervisor ->>+ PublisherFactory: Start publishing
    PublisherFactory ->> BatchVerifierFactory: Create Batch Verifier
    BatchVerifierFactory -->> PublisherFactory: Return BatchVerifier
    activate BatchVerifier
    PublisherFactory ->> ArtifactCreatorFactory: Create ArtifactCreator
    ArtifactCreatorFactory -->> PublisherFactory: Return ArtifactCreator
    PublisherFactory ->> PublishHandle: PublishHandle::new()
    PublishHandle -->> PublisherFactory: Return PublishHandle
    %% update for functions calls
    PublisherFactory -->>-  Supervisor: Return PublishHandle
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Processing batches
    loop When a new batch is available
        Supervisor ->> PublishHandle: A Batch is available
        loop Drain pending batches
            PublishHandle ->> PendingBatches:  Request a pending Batch
            PendingBatches -->> PublishHandle: Some(Batch)
            PublishHandle ->> BatchVerifier: Add Batch to BatchVerifier
        end
    end
    end
    rect rgb(192, 192, 192)
    Note over PublisherFactory,PendingBatches: Cancel building current Artifact
    Supervisor ->> PublishHandle: Notify of Cancel
    PublishHandle ->> BatchVerifier: Cancel publishing
    BatchVerifier -->> PublishHandle: Return
    deactivate BatchVerifier
    PublishHandle -->> Supervisor: Return (consume self)
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
