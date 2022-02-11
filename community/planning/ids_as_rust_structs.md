# Circuit and Service Identifiers as Rust structs

<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

In Splinter's Rust code (libsplinter, splinterd, etc.), use structs instead of
strings to represent circuit and service identifiers.

## Motivation

Throughout Splinter, circuit and service identifiers are passed as `String` or
`&str`, offering no compiler-enforced guarantees as to whether the passed in
`String` or `&str` is a well-formed identifier.

Since the set of valid identifiers is substantially smaller than the set of
valid strings, the functions which accept strings should be validating the
passed-in arguments for correctness and throwing an `InvalidArgumentError` if
the argument is not well-formed. In part because of the extent to which the
identifiers are passed around, the current function implementations do not
consistently do this check. Instead, the functions often assume that the caller
will only pass in valid strings. As a result, the contract between caller and
the functions has implied rules which could easily be violated at runtime, and
without explicit checks for invalid arguments, the behavior of the functions
when invalid strings are provided is potentially undefined (in that it is not
supported by the functions explicitly). By using structs instead of using
strings, the compiler can enforce the function arguments as correct and the
opportunity for these types of runtime errors is removed completely.

A secondary issue with passing strings instead of structs occurs when the
strings must be parsed, potentially resulting in parsing errors. In functions
which parse the strings, a side-effect is the partial validation of the string
which potentially results in an error (though currently the return of
`InvalidArgumentError` is not consistent, because this error was introduced
after much of the code was written). The parsing is often ad hoc. By using
structs, the opportunity for these runtime errors is removed from all code
except for code which calls the struct's constructors. By creating the structs
early and using them throughout the rest of the code, the opportunity for
runtime parsing errors in low-level functions is removed. Parsing the string
multiple times is also avoided.

## Guide-level Explanation

### Circuit Identifiers

A valid circuit identifier is a string of length 11 with the following
structure:

* characters 0-4 are alphanumeric
* character 5 is a `-`
* characters 6-10 are alphanumeric

A circuit identifier string may be converted to an integer by removing the `-`
character and then using base62 conversion. Likewise, the reverse operation can
be performed to convert an integer to a circuit identifier string.

The circuit identifier `00000-00000` is reserved for use as the management
(admin) circuit.

To represent a circuit identifier, we add a struct called `CircuitId`.

### Service Identifiers

A service id consists of a string, with one of the following formats:

- 4 character alphanumeric string (non-management circuits)
- a public key hex string (management circuit only)
- a node identifier (management circuit only)

Service ids can be converted to an integer and back using base62 encoding.

To represent a service identifier, we add a struct called `ServiceId`.

### Fully Qualified Service Identifiers

It is common to combine circuit and service identifiers into a single string,
of the format `<circuit_id>::<service_id>`. This is called a fully-qualified
service identifier and is supported with the struct `FullyQualifiedServiceId`.

`FullyQualifiedServiceId` enforces valid combinations only; for example,
allowing public key hex string service identifiers on the management circuit,
but not non-management circuits.

### Examples

The following are example valid circuit ids:

* `00000-00000`
* `ABCDE-01234`
* `foA8k-03kAM`

The following are examples of valid service ids on non-management circuits:

* `00aa`
* `45R3`
* `Amrk`

The following are examples of valid service ids on the management circuit:

* `node1`
* `02342b593af807a10e202c878253f69101c5d8e51ef6304acd741c54c3fa6011a3`
* `03f8288acfa95e6f35c58ca9b7dc133e095157d8c99703c0c0355a968f2ace1a42`

The following are examples of valid fully-qualified service ids:

* `ABCDE-01234::00aa`
* `foA8k-03kAM::45R3`
* `00000-00000::node1`
* `00000-00000::02342b593af807a10e202c878253f69101c5d8e51ef6304acd741c54c3fa6011a3`
* `00000-00000::03f8288acfa95e6f35c58ca9b7dc133e095157d8c99703c0c0355a968f2ace1a42`

## Reference-level Explanation

The following structs become part of libsplinter's public API:

* `splinter::service::CircuitId`
* `splinter::service::ServiceId`
* `splinter::service::FullyQualfiedServiceId`

When accepting a string, `Into<String>` will be used to support a wide array of
arguments without requiring explicit string conversion by the caller.
Explicitly, it is desirable to support construction directly from the following
types:

* `&str`
* `Box<str>`
* `String`

Any invalid string provided to a constructor will result in an
`InvalidArgumentError`.

All structs derive the following traits: `Clone`, `Debug`, `Hash`, `PartialEq`,
`Eq`.

### CircuitId

The `CircuitId` struct will contain the following public functions in its
implementation:

```rust
impl CircuitId {
    pub fn new<T: Into<String>>(circuit_id: T) -> Result<Self, InvalidArgumentError> { ... }
    pub fn new_random() -> Self { ... }
    pub fn as_str&self) -> &str { ... }
    pub fn deconstruct(self) -> Box<str> { ... }
}
```

The following additional traits will be implemented for CircuitId:

```rust
impl TryFrom<String> for CircuitId { ... }
impl TryFrom<Box<str>> for CircuitId { ... }
impl TryFrom<&str> for CircuitId { ... }
impl std::fmt::Display for CircuitId { ... }
```

The combination of `deconstruct()` and `TryFrom<Box<str>>` provides a method of
deconstruction and reconstruction without incurring any additional allocation.

### ServiceId

The `ServiceId` struct will contain the following public functions in its
implementation:

```rust
impl ServiceId {
    pub fn new<T: Into<String>>(service_id: T) -> Result<Self, InvalidArgumentError> { ... }
    pub fn new_random() -> Self { ... }
    pub fn identity(&self) -> &ServiceIdentity { ... }
    pub fn as_str&self) -> &str { ... }
    pub fn deconstruct(self) -> (Box<str>, ServiceIdentity) { ... }
}
```

The following additional traits will be implemented for `ServiceId`:

```rust
impl TryFrom<String> for ServiceId { ... }
impl TryFrom<Box<str>> for ServiceId { ... }
impl TryFrom<(Box<str>, ServiceIdentity)> for ServiceId { ... }
impl TryFrom<&str> for ServiceId { ... }
impl std::fmt::Display for ServiceId { ... }
```

The combination of `deconstruct()` and `TryFrom<(Box<str>, ServiceIdentity)>`
provides a method of deconstruction and reconstruction without incurring any
additional allocation.

In order to support returning the identity information packed within a service
id, the following enum is defined:

```rust
pub enum ServiceIdentity {
    Normal(String),
    NodeId(String),
    PublicKey(PublicKey),
}
```

The `PublicKey` struct used is `cylinder::PublicKey` and is created using
`PublicKey::new_from_hex(...)`.

### FullyQualifiedServiceId

The `FullyQualifiedServiceId` struct will contain the following public functions
in its implementation:

```rust
impl FullyQualifiedServiceId {
    pub fn new(circuit_id: CircuitId, service_id: ServiceId) -> Self { ... }
    pub fn new_from_string<T: AsRef<str>>(fully_qualified_service_id: T) -> Result<Self, InvalidArgumentError> { ... }
    pub fn new_random() -> Self { ... }
    pub fn circuit_id(&self) -> &CircuitId { ... }
    pub fn service_id(&self) -> &ServiceId { ... }
    pub fn deconstruct(self) -> (CircuitId, ServiceId) { ... }
}
```

The `new_random()` function will create a normal non-management identifier.

## Drawbacks

Integrating this concept into the existing codebase is a complex undertaking
due to the extent of code which passes circuit and service identifiers around.

A node identifier is currently any valid UTF-8 string; this design proposes
restricting it to a base 62 string. The namespace for a public key hex string
and a node identifier overlap and a collision is possible, though it could be
considered a configuration error. Further restrictions on node identifier could
possibly resolve this issue.

The management circuit is currently designated by the string `admin`, not by
the string `00000-00000`. Thus, conversion between the two will be a necessity
for backward compatibility.

The service identifiers used on the management circuit today are not 1:1 with
the ones defined in this design. Today, fully-qualified service identifiers can
have the format:

* `admin::<node_id>`
* `admin::public_key::<remote_public_key>::public_key::<local_public_key>`

The first is the same (with admin replaced with `00000-00000` as noted above),
but the second one has two public keys. This form of service identifier
captures both local and remote public keys, which is used when determining the
correct peer connection; in this design, however, only the one public key
needed to refer to the service is present. A requirement exists to be able to
determine the proper `PeerTokenPair` in order to find the proper peer
connection. While today that can be derived from a single service id, with this
new format, it will require both the sender and destination service identifiers
in order to find the correct `PeerTokenPair`. Additional design work will be
necessary to figure out the best way to handle the implementation of this
change.

The API for `ServiceIdentity` uses `cylinder::PublicKey`, which is an external
crate.

## Rationale and Alternatives

The `ServiceIdentifier` struct exposes admin service design/functionality outside
of the admin service itself. This is an intentional decision to consider the
definition of both circuit identifiers and service identifiers in their
entirety. The primary motivator, however, is that it moves the creation of the
`PublicKey` to the ServiceId's constructor, thus forcing runtime errors in hex
conversion to happen earlier in the process and requiring less error handling
overall.
