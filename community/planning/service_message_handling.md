# Service Message Handling

## Summary

Service message handling in Splinter requires a module where the number of
threads is much lower than the number of services.  This allows a single
splinter node the room to scale to a large number of active services.

## Motivation

The current state of scaling Splinter services requires that each service has
not one, but multiple threads (not counting any threads the service itself might
create).  This sets the limit on the number of services a node may service to
some number lower than the number of threads the OS would provide.

## Guide-level Explanation

At its core, service messages are handled by a `MessageHandler` implementation.
This basic trait provides a single method for handling an inbound message, where
the message type itself is definable by the implementer.

As each message is handled with the fully-qualified service ID for both sender
and recipient, messages should be handled in a stateless way.  That is, any
state that the handler needs should be derived from the provided service IDs. In
practice, this means that a message handler should load the state for a given
service ID from a database.

The primary benefit of this stateless method is that an individual service does
not need to be responsible for its own threads of execution.  As each
implementation can load state based on a service ID, the actual message handling
can be handled by a configurable amount of threads.

The `ServiceDispatcher` component manages dispatching messages to the
appropriate `MessageHandler` and executes `handle_message` on its configured
thread model. Resolving the correct service type is left to a
`ServiceTypeResolver` trait implementation. The thread model is configured by
providing different implementations of a `MessageHandlerTaskRunner` trait.

![]({% link community/images/service_dispatcher.svg %} "Service
Dispatcher"){:.centered}

## Reference-level Explanation

### Message Handlers

At its core, service messages are handled by a `MessageHandler` implementation.
This basic trait provides a single method for handling an inbound message, where
the message type is defined by the implementer:

```rust
pub trait MessageHandler {
    type Message;

    fn handle_message(
        &mut self,
        sender: &dyn MessageSender<Self::Message>,
        to_service: FullyQualifiedServiceId,
        from_service: FullyQualifiedServiceId,
        message: Self::Message,
    ) -> Result<(), InternalError>;
}
```

The `Message` type roots the handler messages specific to the service
implementation. These message types can be defined as any sized type: unit
values (strings, integer types, etc), plain structs, or enums.

Wire protocols are handled via the implementation of a `MessageConverter` trait
for the service. (See ["Trait Adapter Pattern"]({% link
community/planning/trait_adapter_pattern.md %}) doc for more details on this
topic).

### Service Dispatch

Service messages are dispatched via a `ServiceDispatcher`, which may be used
from within a splinter network dispatch handler.  This dispatcher will make use
of `MessageHandlerFactory` instances:

```rust
pub trait MessageHandlerFactory: Routable + Send {
    type MessageHandler: MessageHandler;

    fn new_handler(&self) -> Self::MessageHandler;
}
```
(Omitted here are the analogous trait adapter methods to apply wire protocols.)

The `Routable` trait provides details to the `ServiceDispatcher` to link a
service instance to the type of handler to execute:

```rust
pub trait Routable {
    fn service_types(&self) -> &[ServiceType]
}
```

Given a fully-qualified service ID, the `ServiceDispatcher` will resolve the
service type via the following trait:

```rust
pub trait ServiceTypeResolver {
    fn resolve_type(
        &self,
        service_id: &FullyQualifiedServiceId,
    ) -> Result<Option<ServiceType>, InternalError>;
}
```
If the type cannot be resolved, the dispatcher will return an error.

Once the type is resolved, the `ServiceDispatcher` will dispatch a
`MessageHandlerFactory`, if available, to a `MessageHandlerTaskRunner`. This
task runner has the following trait:

```rust
pub trait MessageHandlerTaskRunner {
    fn execute(
        &self,
        message_handler_factory: &dyn MessageHandlerFactory<
            MessageHandler = Box<dyn MessageHandler<Message = Vec<u8>>>,
        >,
        sender_factory: &dyn MessageSenderFactory<Vec<u8>>,
        to_service: FullyQualifiedServiceId,
        from_service: FullyQualifiedServiceId,
        message: Vec<u8>,
    ) -> Result<(), InternalError>;
}
```

In order to support multi-threaded implementations, the task runner trait takes
a `MessageHandlerFactory` instance.  In this way, the `ServiceDispatcher` never
directly executes a `MessageHandler` instance.

Note that the `ServiceDispatcher` operates using handlers that take messages of
type `Vec<u8>`. Via the trait adapter pattern, all `MessageHandlerFactory`
instances should be transformable via the appropriate `Converter`
implementation.

### Integration with Existing Handlers

An instance of the `ServiceDispatcher` will be provided to the existing
`CircuitDirectMessageHandler`. This general dispatch handler, implementing the
trait found in `splinter::network::dispatch`, will determine if a message for a
given circuit may be dispatched to a service that implements the
`MessageHandler` trait, or forwarded on to the old pseudo-peer-style services.

In order to determine if a message can be handled by the `ServiceDispatcher`, it
will provide a method

```rust
impl ServiceDispatcher {
    pub fn is_routable(&self, service_id: &FullyQualifiedServiceId)
        -> Result<bool, InternalError>
    {
       // omitted
    }
}
```

This allows the caller, in this case `CircuitDirectMessageHandler` to know if it
should even attempt to dispatch the message to be handled by a `MessageHandler`
or to forward it.

If the message is routable by the `ServiceDispatcher`, the following method will
be called:

```rust
impl ServiceDispatcher {
    pub fn dispatch(
        &self,
        to_service: FullyQualifiedServiceId,
        from_service: FullyQualifiedServiceId,
        message: Vec<u8>,
    ) -> Result<(), InternalError> {
         // omitted
    }
}
```

## Prior Art

Splinter's original service implementation combined several concepts into a
single trait, including message handling.

## Unresolved Questions

When services are externalized, it is not entirely clear how the service
dispatcher will forward the messages. The most likely solution is that a
`MessageHandler` implementation will act as a remote proxy to the externalized
service message handler, though the exact details of how those will be
externalized has yet to be determined.
