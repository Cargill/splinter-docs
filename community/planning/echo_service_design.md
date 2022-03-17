# Echo Service Design
<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document presents the design for the echo service. This service is a simple
service that can be used for testing a circuit between nodes. An echo service
sends messages to its peers at a set frequency.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

When a splinter circuit is created with an echo service the echo service will
send messages to its peer services at the set frequency as well as simulate
errors at a set rate. When an echo service receives a new message from a peer it
will send a response back. Echo services send simple messages that contain a
string and an ID unique to the message.

### Echo Arguments

Echo service takes four arguments that determine how the service will act.

* `peers` - This is a list of the services that echo service will attempt to
   send messages to
* `frequency` - This is the amount of time, given in seconds, that an echo
   service will wait between sending messages
* `jitter` - This is an amount of time, given in seconds, that is used to
   generate a random number in the range [-jitter, jitter]. A new value is
   generated each time a message is sent and added to the frequency value to
   ensure that the amount of time between each message varies.
* `error_rate` - This is the number of errors per second, given as a float,
   that should be emulated by the echo service.

These arguments are set using the splinter CLI when creating a circuit.

### Service API

Echo service implements the new service API in splinter. The principle traits
included in the new service API and implemented in echo service are:
`Lifecycle`, `MessageHandler`, `TimerFilter`, `TimerHandler`. Other required
traits include the converters, `MessageConverter` and `ArgumentsConverter`, and
the factories, `MessageHandlerFactory` and `TimerHandlerFactory`.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### EchoTimerFilter

The `EchoTimerFilter` contains an echo store factory and implements the
`TimerFilter` trait. The `filter` method returns the list of service IDs of
services that need to be handled. A service needs to be handled if it has at
least one peer service and is in the `EchoServiceStatus::Finalized` state.

```rust
pub struct EchoTimerFilter {
    store_factory: Box<dyn PooledEchoStoreFactory>,
}

impl EchoTimerFilter {
    pub fn new(store_factory: Box<dyn PooledEchoStoreFactory>) -> Self {
        Self { store_factory }
    }
}

impl TimerFilter for EchoTimerFilter {
    fn filter(&self) -> Result<Vec<FullyQualifiedServiceId>, InternalError> {
        …
    }
}
```

### EchoArguments

The `EchoArguments` struct contains the information to be used by the
`EchoTimerHandler` to send `EchoMessage`s. The `peers` field is a list of
`ServiceId`s that the echo service will attempt to send messages to. `frequency`
is the amount of time that an echo service should wait between sending messages.
`jitter` is used as a range [-jitter, jitter] to generate a random number which
will be added to the frequency to create variation in the wait time between
messages. `error_rate`, given as a float, is the number of errors per second
that should be emulated by the echo service.

```rust
pub struct EchoArguments {
    peers: Vec<ServiceId>,
    frequency: Duration,
    jitter: Duration,
    error_rate: f32,
}
```

### EchoMessage

The `EchoMessage` enum represents the messages sent between echo services. The
enum has two variants `Request` and `Response`. A `Request` is the initial type
of message sent by an echo service and a `Response` is what is sent back to the
sender when a `Request` is received.

```rust
pub enum EchoMessage {
    Request {
        message: String,
        correlation_id: u64,
    },
    Response {
        message: String,
        correlation_id: u64,
    },
}
```

### EchoTimerHandler

The `EchoTimerHandler` struct contains an `EchoStore` and a time stamp used to
determine when to simulate an error. `EchoTimerHandler` implements the
`TimerHandler` trait. The `handle_timer` function in the implementation sends
messages to a service's peers at a given rate, emulating errors periodically,
based on the `EchoArguments` set for that service.

```rust
pub struct EchoTimerHandler {
    store: Box<dyn EchoStore>,
    stamp: Instant,
}

impl EchoTimerHandler {
    pub fn new(store: Box<dyn EchoStore>, stamp: Instant) -> Self {
        EchoTimerHandler { store, stamp }
    }
}

impl TimerHandler for EchoTimerHandler {
    type Message = EchoMessage;

    fn handle_timer(
        &mut self,
        sender: &dyn MessageSender<Self::Message>,
        service: FullyQualifiedServiceId,
    ) -> Result<(), InternalError> {
        …
    }
}
```

### EchoMessageHandler

The `EchoMessageHandler` struct contains an `EchoStore` and implements the
`MessageHandler` trait. The `handle_message` function takes a sender, the
service ID of the sending service, the service ID of the receiving service and a
message, as arguments. Depending on the type of `EchoMessage`, either a response
message will be sent to the sender service or the database will be updated to
reflect that a response was received.

```rust
pub struct EchoMessageHandler {
    store: Box<dyn EchoStore>,
}

impl EchoMessageHandler {
    pub fn new(store: Box<dyn EchoStore>) -> Self {
        EchoMessageHandler { store }
    }
}

impl MessageHandler for EchoMessageHandler {
    type Message = EchoMessage;

    fn handle_message(
        &mut self,
        sender: &dyn MessageSender<Self::Message>,
        to_service: FullyQualifiedServiceId,
        from_service: FullyQualifiedServiceId,
        message: Self::Message,
    ) -> Result<(), InternalError> {
        …
    }
}
```

### EchoLifecycle

The `EchoLifecycle` struct contains an `EchoStoreFactory` and implements the
`Lifecycle` trait. Each of the methods in the `Lifecycle` implementation
returns a
[`StoreCommand`]({% link community/planning/store_command_for_scabbard_v0.7.md %})
which when executed, will make the appropriate updates to the underlying
database via the `EchoStore`.

```rust
pub struct EchoLifecycle<K> {
    store_factory: Arc<dyn EchoStoreFactory<K>>,
}

impl<K> EchoLifecycle<K> {
    pub fn new(store_factory: Arc<dyn EchoStoreFactory<K>>) -> Self {
        EchoLifecycle { store_factory }
    }
}

impl<K> Lifecycle<K> for EchoLifecycle<K>
where
    K: 'static,
{
    type Arguments = EchoArguments;

    fn command_to_prepare(
        &self,
        service: FullyQualifiedServiceId,
        arguments: Self::Arguments,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError> {
        …
    }

    fn command_to_finalize(
        &self,
        service: FullyQualifiedServiceId,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError> {
        …
    }

    fn command_to_retire(
        &self,
        service: FullyQualifiedServiceId,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError> {
        …
    }

    fn command_to_purge(
        &self,
        service: FullyQualifiedServiceId,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError> {
        …
    }
}
```

### EchoMessageByteConverter

The `EchoMessageByteConverter` implements the `MessageConverter` trait. The
`to_left` method converts bytes to an `EchoMessage` and the `to_right` method
does the inverse.

```rust
#[derive(Clone)]
pub struct EchoMessageByteConverter {}

impl MessageConverter<EchoMessage, Vec<u8>> for EchoMessageByteConverter {
    fn to_left(&self, right: Vec<u8>) -> Result<EchoMessage, InternalError> {
        …
    }

    fn to_right(&self, left: EchoMessage) -> Result<Vec<u8>, InternalError> {
        …
    }
}
```

### EchoArgumentsVecConverter

The `EchoArgumentsVecConverter` implements the `ArgumentsConverter` trait. The
`to_left` method converts a list of tuples to `EchoArguments` and the `to_right`
method does the inverse.

```rust
pub struct EchoArgumentsVecConverter {}

impl ArgumentsConverter<EchoArguments, Vec<(String, String)>> for EchoArgumentsVecConverter {
    fn to_right(&self, left: EchoArguments) -> Result<Vec<(String, String)>, InternalError> {
        …
    }

    fn to_left(&self, right: Vec<(String, String)>) -> Result<EchoArguments, InternalError> {
        …
    }
}
```

## Prior art
[prior-art]: #prior-art

This service implements the new service API design for splinter.
