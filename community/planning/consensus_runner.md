# Consensus Runner
<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

The consensus runner component performs two important operations for a given
service: fetching the outstanding ConsensusActions to be executed, followed by
fetching the next available event to be processed via the appropriate consensus
algorithm.

## Motivation

As the consensus algorithms do not require threads, processing actions and
events should also not require any threads.  The consensus runner provides a
general solution for this problem.

## Guide-level Explanation

A ConsensusRunner struct will operate on a given fully-qualified service ID
(FQSI).  As part of a timer execution, it will fetch the outstanding actions and
execute them.  Next, it will fetch the next unprocessed event and run that
through the appropriate algorithm.  This will repeat on the next timer execution
for the FQSI.

### Actions

Actions are the direct result of processing an event via an Augrim consensus
algorithm. However, all actions from an event must be processed before
proceeding to the next event. The `ConsensusRunner` will load the next set of
unprocessed actions and execute them via an `ActionRunner`. See the
`ActionRunner` design for more details.

The unprocessed actions will be provided by the
`ScabbardStore::list_consensus_actions` function.

Actions should be run both before and after the events are processed.  This
ensures that any actions are processed before the next event is executed, in the
case of a restart.  Actions should be processed after the event to complete the
processing of the event and its resulting action(s).

### Events

Augrim consensus algorithms rely on events to produce actions.  The consensus
runner provides the glue to load those events from the database and process them
and store their results in the database.

The `ScabbardStore::list_consensus_events` should return any unprocessed events
available in its underlying storage. The consensus runner should execute the
first of these unprocessed events, if one is available.

The consensus runner will support systems that leave the choice of consensus up
to a run-time configuration parameter.  This is accomplished via the augrim
`Algorithm` trait, a system for converting events (similar to the Trait Adapter
Pattern in the splinter service API), and a new trait to provide an algorithm
route that can be added to the event.

The consensus runner will then load the context for the given FQSI and execute
the event using the identified algorithm.

## Reference-level Explanation

### Main Execution

The consensus runner will have the following items:

```rust
struct ConsensusRunner<E: StoreCommandExecutor> {
    pooled_scabbard_store_factory: Arc<dyn PooledScabbardStoreFactory>,
    action_runner: ConsensusActionRunner<<E as StoreCommandExecutor>::Context>,
    algorithms: HashMap<
        String,
        Box<
            dyn Algorithm<
                Event = ConsensusEvent,
                Action = ConsensusAction,
                Context = ConsensusContext,
            >,
        >,
    >,
    consensus_store_command_factory:
        ConsensusStoreCommandFactory<<E as StoreCommandExecutor>::Context>,
    store_command_executor: Arc<E>,
}
```

The `ConsensusRunner` effective runs the following loop:

```rust
fn run(&self, service_id: &FullyQualifiedServiceId)
    -> Result<(), InternalError>
{
    let store = self.pooled_scabbard_store_factory.new_store();

    let unprocessed_actions = store.list_consensus_actions(service_id)?;

    if !unprocessed_actions.is_empty() {
        // run each action and execute the commands before running the next action
        for action in unprocessed_actions {
            let commands = self.action_runner.run_actions(vec![action], service_id)?;
            self.store_command_executor.execute(commands)?;
        }
    }

    let unprocessed_event = store
        .list_consensus_events(service_id)?
        .get(0)
        .cloned();

    let event = match unprocessed_event {
        Some(event) => event,
        None => {
            // No events
            return Ok(());
        }
    };

    let (event_id, event) = event.deconstruct();

    let context = store
        .get_current_consensus_context(service_id)?
        .ok_or_else(|| {
            InternalError::with_message(format!(
                "No scabbard context for service {}",
                service_id
            ))
        })?;

    let epoch = context.epoch();

    let algorithm = self.algorithms.get(event.algorithm_name()).ok_or_else(|| {
        InternalError::with_message(format!("{} is not configured", event.algorithm_name()))
    })?;
    let actions = algorithm
        .event(event, context)
        .map_err(|e| InternalError::from_source(Box::new(e)))?;

    let commands = vec![
        self.consensus_store_command_factory
            .new_save_actions_command(service_id, actions, event_id),
        self.consensus_store_command_factory
            .new_mark_event_complete_command(service_id, event_id, epoch),
    ];
    self.store_command_executor.execute(commands)?;

    // run the resulting actions
    let unprocessed_actions = store.list_consensus_actions(service_id)?;

    if !unprocessed_actions.is_empty() {
        // run each action and execute the commands before running the next action
        for action in unprocessed_actions {
            let commands = self.action_runner.run_actions(vec![action], service_id)?;
            self.store_command_executor.execute(commands)?;
        }
    }

    Ok(())
}
```

This run function references several methods on the `ScabbardStore` trait:
`list_consensus_actions`, `list_consensus_events`, and
`get_current_consensus_context`.

The `ConsensusEvent` will include the following method

```rust
impl ConsensusEvent {
    /// Returns the associated algorithm name for this item.
    fn algorithm_name(&self) -> &str {
        // ...
    }
}
```

This provides a means to route the event to the appropriate algorithm for
processing.

The `ConsensusStoreCommandFactory` struct provides the following methods:

```rust
pub struct ConsensusStoreCommandFactory<C> {
    fn new_save_actions_command(
        &self,
        service_id: &FullyQualifiedServiceId,
        actions: Vec<ScabbardAction>,
    ) -> Box<dyn StoreCommand<Context = C>> {
        // ...
    }

    fn new_mark_event_complete_command(
        &self,
        service_id: &FullyQualifiedServiceId,
        event_id: i64,
    ) -> Box<dyn StoreCommand<Context = C>> {
        // ...
    }
}
```

### Algorithm Trait Adapter Pattern

In order to easily facilitate the run-time selection of `Algorithm` we will need
a function that may transform an algorithm such that it may accept inputs and
produce outputs for the general system.  This could be used to handle things
like run-time switching, serialization, or the like.

On the `Algorithm` trait (or an `AlgorithmExt` trait in scabbard), a method can
be added:

```rust
trait Algorithm {
    ...
    fn into_algorithm<E, A, C>(self) -> IntoAlgorithm<Self, E, A, C>
    where
        Self: Sized,
        Self::Event: TryFrom<E, Error = InternalError>,
        A: TryFrom<Self::Action, Error = InternalError>,
        Self::Context: TryFrom<C, Error = InternalError>,
    {
        ...
    }
}
```

`Event` and `Context` use `TryFrom` implementations from their input versions.
The output `Action` expects a `TryFrom` implementation from the internal one.

where `IntoAlgorithm<T, E, A, C>` is defined as

```rust
struct IntoAlgorithm<T, E, A, C>
where
    P: Process,
    T: Algorithm<P>,
    <T as Algorithm<P>>::Event: TryFrom<E, Error = InternalError>,
    A: TryFrom<<T as Algorithm<P>>::Action, Error = InternalError>,
    <T as Algorithm<P>>::Context: TryFrom<C, Error = InternalError>,
{
    ...
}
```

In scabbard, each of the event, action, and context for the supported algorithms
will be wrapped in an enum.  For example, the event would be:

```rust
use augrim::algorithm::two_phase_commit::TwoPhaseCommitEvent;
use augrim::algorithm::three_phase_commit::ThreePhaseCommitEvent;

enum ConsensusEvent {
    TwoPhaseCommit(TwoPhaseCommitEvent),
    ThreePhaseCommit(ThreePhaseCommitEvent),
    ...
}
```

A similar enum would exist for `ConsensusAction` and `ConsensusContext`.

And each algorithm specified by the enum would have a `TryFrom` implementation
for the scabbard algorithm.  For example, two-phase commit event would have:

```rust
use augrim::algorithm::two_phase_commit::TwoPhaseCommitEvent;

impl TryFrom<ConsensusEvent> for TwoPhaseCommitEvent {
    type Error = InternalError;

    fn try_from(evt: ConsensusEvent) -> Result<Self, Self::Error> {
        ...
    }
}
```
