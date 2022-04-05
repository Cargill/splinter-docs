# Service Timer

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->
## Summary

A timer-based model for waking up specific services and executing code. Both
APIs for writing service implementations as well as runtime components to run
services are covered.

## Motivation

Service implementations execute code via two primary handler types:
MessageHandler and TimerHandler. A MessageHandler is run in response to
receiving a message and is covered in a separate design document. A TimerHandler
is run in response to a Timer waking up periodically and detecting that the
service has work to perform.

Examples of timer-based activities include:

- Consensus-based timeout capabilities such as those in 3PC and PBFT
- Initiating sending messages on a schedule, such as in the Echo service
- Restarting processing which was interrupted

In Splinter v0.6 and earlier, services were implemented in a manner in which
each service instance (a specific service ID) was run in a thread. The design
here replaces that approach with an approach which does not require a
per-service ID thread. Instead, the number of threads is constant, completely
removing the additional resource consumption which occurred as more circuits
(with services running inside them) were defined at runtime.

The design is also motivated by durability and high-availability concerns, which
mandate that a greater amount of information be stored in the database with the
ability to re-start should the process be restarted or an internal error occurs.

## Guide-level Explanation

### Implementing service components

Two traits must be implemented by service: `TimerHandler` and `TimerFilter`.

A `TimerHandler` is run when there is work to be performed and together with
`MessageHandler`, will contain most of the logic of the service. When run, a
`TimerHandler` is provided a sender and a service ID. For example:

```rust
pub struct MyTimerHandler { ... }

impl TimerHandler for MyTimerHandler {
    type Message = MyMessage;

    fn handle_timer(
        &mut self,
        sender: &dyn MessageSender<Self::Message>,
        service: FullyQualifiedServiceId,
    ) -> Result<(), InternalError> {
        // determine what to do (possibly from the database) and execute logic here, which can
        // include sending messages to services on the same circuit
    }
}
```

A `TimerFilter` is run to determine which services have work to perform.

```rust
pub struct MyTimerFilter { ... }

impl TimerFilter for MyTimerFilter {
    fn filter(&self) -> Result<Vec<FullyQualifiedServiceId>, InternalError> {
         // query the database and return a list of service ids which should be woken up
    }
}
```

### Runtime execution and integration within Splinter

A `Timer` handles execution of both `TimerFilter`s and `TimerHander`s. The
`Timer` wakes up periodically and runs a `TimerFilter` for each service type
supported (example service types: echo, scabbardv2). Each filter returns a list
of service IDs and for each service ID returned, the `Timer` executes a
`TimerHandler` of the corresponding type.

## Reference-level Explanation

### TimerFilter Trait

The `TimerFilter` is used to determine the list of `FullyQualifiedServiceId`
that needs to be handled. Each service type will need their own `TimerFilter`.

```rust
pub trait TimerFilter: Routable{
    fn filter(&self) -> Result<Vec<FullyQualifiedServiceId>, InternalError>;
}
```

The `TimerFilter` must be `Routable` meaning it has an associated service types.

```rust
pub trait Routable {
    fn service_types(&self) -> &[ServiceType];
}
```

For example, the `EchoService` will return the list of all services that have a
peer and are in the `Finalized` state. See the
[EchoService]({% link community/planning/echo_service_design.md%}) for more
information.

### TimerHandler Trait

The `TimeHandler` is in charge of executing any work that should be done on some
interval.

```rust
pub trait TimerHandler {
    type Message;

    fn handle_timer(
        &mut self,
        sender: &dyn MessageSender<Self::Message>,
        service: FullyQualifiedServiceId,
    ) -> Result<(), InternalError>;

    fn into_handler<C, R>(
        self,
        converter: C
    ) -> IntoTimerHandler<Self, C, Self::Message, R>
    where
        Self: Sized,
        C: MessageConverter<Self::Message, R>,
    {
        IntoTimerHandler::new(self, converter)
    }
}
```

The use of  `into_handler` is described in [Trait Adapter
Pattern]({% link community/planning/trait_adapter_pattern.md%}) document.

### TimerHandlerFactory Trait

`TimerHandlerFactory` will be used to create new handlers in the `Timer` so they
can be passed to a threadpool for execution. The handle must be Send and be
cloneable through the use of `clone_box`

```rust
pub trait TimerHandlerFactory: Send {
    type Message;

    fn new_handler(
        &self
    ) -> Result<Box<dyn TimerHandler<Message = Self::Message>>, InternalError>;

    fn clone_box(&self) -> Box<dyn TimerHandlerFactory<Message = Self::Message>>;
}
```

## Timer Struct

The `Timer` is in charge of checking the configured `TimerFilters` for pending
work.

![Timer Struct Diagram]({% link images/timer_struct.svg %}
"Timer"){:.centered}

```rust
impl Timer {
    pub fn new(
        filters: Vec<(
            Box<dyn TimerFilter + Send>,
            Box<dyn TimerHandlerFactory<Message = Vec<u8>>>,
        )>,
        wake_up_interval: Duration,
        message_sender_factory: Box<dyn MessageSenderFactory<Vec<u8>>>,
    ) -> Result<Timer, InternalError> {
        // omitted for brevity
        }
}
```

On start up the Timer takes a list of `TimerFilters` and their associated
`TimerHandlerFactory`. The factories must return a handler that can handle
messages of type `Vec<u8>`. This can always be achieved by implementing a
`MessageConverter` for the normal message type used by the handle and using the
`into_handler` method. See [Trait Adapter
Pattern]({% link community/planning/trait_adapter_pattern.md%}) for more
information.

On wake up, the Timer will check each `TimerFilter` for pending work.  For each
`FullyQualifiedServiceId` returned from the filter, the associated
`TimerHandlerFactory` will be used to get a new `TimerHandler` that will run in
a threadpool.

The `Timer` is woken up in two ways, the `Pacemaker` or a `TimerAlarm`.

The `Pacemaker` is an existing component in Splinter that fires off a message
over a channel at some configured interval. For example, it is used to send
heartbeat messages across connections to keep them active. For the `Timer`, it
sends a `TimerMessage::WakeUpAll` message.

```rust
#[derive(Clone, Debug)]
pub enum TimerMessage {
    WakeUpAll,
    WakeUp {
        service_type: String,
        service_id: Option<FullyQualifiedServiceId>,
    },
    Shutdown,
}
```

The `Timer` also provides a `TimerAlarm` that can be used to send a wake up
message prematurely. The alarm can cause all filters to be checked by calling
`wake_up_all`. The alarm can also wake up a specific service type, executing all
pending work for that service type. A specific service ID can also be provided.
If a service ID is provided, only the `TimerHandler` for that ID will be run.
The service ID must be returned from the `TimerFilter` to show there is pending
work. If the service ID is not returned, no handlers will be run.

```rust
pub trait TimerAlarm {
    /// Notify the `Timer` to check all `TimerFilters` for pending work
    fn wake_up_all(&self) -> Result<(), InternalError>;

    /// Notify the `Timer` to check a specific `TimerFilter` for pending work
    ///
    /// # Arguments
    ///
    /// * `service_type` - The service type of the the filter that will be checked
    /// * `service_id` - An optional service ID
    fn wake_up(
        &self,
        service_type: String,
        service_id: Option<FullyQualifiedServiceId>,
    ) -> Result<(), InternalError>;
}
```

The current implementation sends a `TimerMessage` over  a channel to the
`Timer`'s main thread. A trait is used instead of a struct so that in the future
an implementation can be provided that will work between different processes.
This will be required for future high availability work.

## Rationale and Alternatives

0.6 internal Services are run with each instance in its own thread. This design
is not compatible with HA and heavily limits the number of circuits and services
that are able to run on a network.
