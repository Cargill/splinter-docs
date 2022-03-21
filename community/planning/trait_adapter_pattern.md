# Trait Adapter Pattern

## Summary

A pattern for using a trait with a domain-specific generic parameter such as
`Trait<Item = A>` in code which instead operates on a different type such as
`Trait<Item = B>` by constructing `Trait<Item = B>` as an adapter to
`Trait<Item = A>`.

## Motivation

This pattern is useful for implementing a plugin system when you want the
plugins to operate on domain-specific types instead of a common generic type
which is known by the framework running the plugin.

For example, when implementing a framework which receives messages and routes
them to various pluggable handlers, within the framework the messages may be
serialized as bytes. The associated handlers being routed to will then
naturally operate on bytes, something like:

```rust
trait Handler {
    fn handle(message: Vec<u8>) -> Result<(), InternalError>;
}
```

However, when we implement one of the various handlers, we know the specific
type of the message and do not wish to operate on bytes. If our implementation
used our example Handler trait, the very first step in the handler would be to
deserialize and validate the message:

```rust
impl Handler for MyHandler {
    fn handle(message: Vec<u8>) -> Result<(), InternalError> {
        let deserialized_message = deserialize_and_validate_message(message)?;
        ...
    }
}
```

Thus, this Handler trait requires any implementer to expect the input to be
possibly poorly-formed, with the requirement to manually handle the
deserialization and validation within the beginning of the function. There is
a large potential for runtime errors to be produced at that stage because the
possible input to the function (bytes) is a large superset of possibly
deserialized and valid messages.

A more desirable pattern, such as the one described below, separates the
deserialization and validation of the message from the logic of the `handle()`
function, thus allowing the `handle()` function to operate only on well-formed
data. The resulting separate pieces are substantially less complex because each
has better focus.

## Guide-level explanation

### Handler Example

Continuing with our Handler example, we can make the handler generic over the
message type, resulting in the following trait:

```rust
trait Handler {
    type Message;


    fn handle(message: Self::Message) -> Result<(), InternalError>;
}
```

The message type in our example will differ depending on context; from the
framework perspective, we still want bytes, so the type will be
`Handler<Message = Vec<u8>>`. But when implementing the `Handler` itself, we
want a specific message type such as `Handler<Item Message = MyMessage>`.

Let's assume we have an implementation of a handler that uses a corresponding
message type:

```rust
struct MyMessage {
    item1: String,
    item2: u64,
}

struct MyHandler { .... }

impl Handler for MyHandler {
    type Message = MyMessage;


    fn handle(&mut self, message: Self::Message) -> Result<(), InternalError> {
        ...
    }
}
```

This is ideal for implementing the handler as the message is already
deserialized. Additionally, it would be easy for us to define `MyMessage` in
a manner which was always structurally correct and valid, though for the sake
of brevity we will keep the simple struct for our example. With that assumption
though, we can say that the handler does not need to worry at all about
deserialization or validation of the message.

For our example, let's assume the framework code is responsible for routing
messages to the handlers, but only understands messages as `Vec<u8>`. The
framework code is unable to deal with specific message types and is restricted
to handlers of `Handler<Message = Vec<u8>>`. Because of this restriction, the
framework can collect handlers into a `Vec<Handler<Message = Vec<u8>>` or any
other collection type it desires, which enables the framework to route to the
handlers. (The exact mechanism of how messages are routed to the correct
handler is not covered here, as it isn't important for this pattern.)

There is therefore a need to adapt `Handler<Message = MyMessage>` to
`Handler<Message = Vec<u8>>`, so that after creation of the handler, it can be
provided to the framework. We can do this by allowing a `Handler` to be adapted
to any other type if a converter for Message is provided. Using the code will
look something like this:

```rust
let my_handler = MyHandler::new(); // type MyHandler<Message = MyMessage>
let bytes_handler: Hander<Message = Vec<u8>> = my_handler.into_handler(converter);
```

The converter will look something like:

```rust
struct MyConverter { ... }

impl Converter<MyMessage, Vec<u8>> for MyConverter {
    fn to_left(&self, right: Vec<u8>) -> Result<MyMessage, InternalError> { ... }
    fn to_right(&self, left: MyMessage) -> Result<Vec<u8>, InternalError> { ... }
}
```

One last detail. So far, we could have done everything with a single-direction
converter (from `Vec<u8>` to `MyMessage`. However, if our `Handler` trait was
more sophisticated, then implementing `into_handler()` would require
bi-directional conversion. For example, if we provide the handler function
a trait which allows sending messages, then we will need to convert from
`MyMessage` to `Vec<u8>` so we can adapt that interface as well.

### General Pattern

More generally, we have a trait with two different types, `Trait<Item = A>` and
`Trait<Item = B>`, and adapt from one to the other by providing `Converter<A,
B>`, a bi-directional converter between `A` and `B`.

## Reference-level explanation

There are two traits in this pattern: a conversion trait and an adaptable
trait.

### Converter Trait

The conversion trait handles serialization and deserialization; but more
generally, it handles converting between any two types `L` and `R`:

```rust
pub trait Converter<L, R> {
        /// Convert from generic type parameter `R` to type `L`.
        fn to_left(&self, right: R) -> Result<L, InternalError>;

        /// Convert from generic type parameter `L` to type `R`.
        fn to_right(&self, left: L) -> Result<R, InternalError>;
}
```

### An adaptable Trait

The handler trait defines a method for handling the message but also a method
for converting a handler into a handler with a different message type.

```rust
pub trait Trait {
    type Item;
    ...

    fn into_adapter<C, R>(self, converter: C) -> Adapter<Self, C, Self::Message, R>
}
```

Adapter is an struct which wraps the handler and implements `Handler` for the
type being converted to:

```rust
struct Adapter<...., R> { ... }

impl Trait on Adapter<..., R> {
    type Item = R;

    ....
}
```

For concrete examples of handler traits, see:

* MessageHandler
* TimerHandler

## Prior art

Splinter v0.6's approach to service message handling influenced the motivation
of the pattern described; that version of Splinter accepts `Vec<u8>` messages
directly.

Sawtooth's transaction processors and Transact's transaction handlers also
process bytes directly instead of using a native struct. This pattern will
likely be used in Transact's `SmartContract` trait which is in development,
solving various complexities in using the current `TransactionHandler` API.
