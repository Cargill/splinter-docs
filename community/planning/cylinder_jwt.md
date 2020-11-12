# Cylinder JWT
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This proposal adds a JSON Web Token (JWT) module to the Cylinder library.

## Motivation
[motivation]: #motivation

Implementing a JWT feature in Cylinder allows for the use of its own signer
implementations to provide signed tokens. This provides Cylinder users to make
use of the same keys as an identity for use in both HTTP authentication tokens
(via JWT) as well as the current comment use case of transaction signers.

Existing JWT libraries do not allow for the flexibility to use custom signers.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

Cylinder JWT provides a set of API's to both generate a JWT-like token and
cryptographically validate its contents.

The header will follow the standard minimally consist of a type (`"typ"`) of
`"cylinder+jwt"`, and an algorithm (`"alg"`) value that depends on the Signer
implementation.

The use of the term JWT-like is necessary as the algorithms currently provided
by Cylinder are not part of the standard set.  The resulting token will still
follow the format of

 ```rust
 "[Base-64-encoded bytes of the UTF-8 string of the header JSON].\
  [Base-64-encoded bytes of the UTF-8 string of the claims JSON].\
  [Base-64-encoded signature]"
 ```
(line breaks are for clarity)

While this format will still be parseable by other JWT libraries, most likely
the signing algorithm specified in the header will not be understood.

The initial implementation will only provide the ability to create flat JSON
objects, both for the header and for the claims.  Complex, nested JSON objects
are beyond the scope of this initial design.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### JWT API
[jwt-api]: #jwt-api

This module will be guarded by the feature "jwt".

```rust
mod cylinder::jwt;
```

The module will provide a struct for building the JWT string value.  This
builder will optionally accept a set of header values and set of claims.  At
build time, it will sign the token.  Note, in the following API, implementations
have been omitted.

```rust
/// Builder for constructing the JWT string that would be included in request
/// headers
struct JsonWebTokenBuilder {
    ...
}

impl JsonWebTokenBuilder {
    /// Constructs a new instance of the builder.
    pub fn new() -> Self {
        ...
    }

    /// Sets the header of the token.
    ///
    /// The standard header keys of `alg` and `typ` will be added to the resulting JSON object. If
    /// these keys are included in the given map, they will be overridden at build time.
    pub fn with_header(mut self, header: HashMap<String, String>) -> Self {
        ...
    }

    /// Sets the claims of the token.
    ///
    /// The standard header of `iss` (issuer) will be added to the resulting JSON object. This will
    /// be set to the public key value of the signer used at build time. If the key is included in
    /// the given map, it will be overridden.
    pub fn with_claims(mut self, claims: HashMap<String, String>) -> Self {
        ...
    }

    /// Serializes and signs the JsonWebToken.
    ///
    /// The resulting string is
    ///
    ///  ```ignore
    ///  "[Base-64-encoded bytes of the UTF-8 string of the header JSON].\
    ///   [Base-64-encoded bytes of the UTF-8 string of the claims JSON].\
    ///   [Base-64-encoded signature]"
    ///  ```
    /// (line breaks are for clarity)
    pub fn build(self, signer: &dyn Signer)
        -> Result<String, JsonWebTokenBuildError>
    {
        ...
    }
}
```

When a process, such as a REST API, has received a token, the
`JsonWebTokenParser` struct is used to parse and verify the token string.

```rust
/// Parses a `JsonWebToken` from an encoded token.
struct JsonWebTokenParser<'a> {
    verifier: &'a dyn Verifier
}

impl<'a> JsonWebTokenParser<'a> {
    /// Constructs a new instance of the builder.
    pub fn new(verifier: &'a dyn Verifier) -> Self {
    }

    /// Parse the token string provided and verify the included signature
    /// with the given Verifier instance.
    pub parse(jwt_str: &str)
        -> Result<JsonWebToken, JsonWebTokenParseError> {
        ...
    }
}

The resulting JsonWebToken struct contains the parsed claims and header, as well
as the issuer (i.e. the public key of the signer).

/// Native representation of a JSON web token used for validation.
struct JsonWebToken {
    ...
}

impl JsonWebToken {
    /// Returns the public key of the issuer of this JWT
    pub fn issuer(&self) -> &PublicKey {
        ...
    }

    /// Returns the set of claims in this token.
    pub fn claims(&self) -> &HashMap<String, String> {
        ...
    }

    /// Returns the header of this token.
    pub fn header(&self) -> &HashMap<String, String> {
        ...
    }
}
```

### Additions to the base Cylinder API
[base-api-addiions]: #base-api-additions

As the algorithm used to sign the token is included in the JWT header, an
algorithm name needs to be added to the `Signer`

```rust
trait Signer {
    fn algorithm_name(&self) -> &str;
}
```

Additionally, at verification time, this algorithm value should be compared to
the provided `Verifier`

```rust
trait Verifier {
    fn algoritmn_name(&self) -> &str;
}
```

For completeness:

```rust
trait Context {
    fn algorithm_name(&self) -> &str;
}
```

### Algorithm header value
[algorithm-header-value]: #algorithm-header-value

Based on the [JWT best practices
RFC](https://www.rfc-editor.org/rfc/rfc8725.html#name-use-explicit-typing), the
cylinder aspect should be encoded in the type header field (this type field is
considered equivalent to content type prefixed with `"application/"`):

```json
{
  "typ": "cylinder+jwt",
  "alg": "secp256k1",
}
```

The algorithm value is dependent on the signer.  In the above example, the
Secp256k1 implementation was used.

## Drawbacks
[drawbacks]: #drawbacks

The main drawback is the use of non-standard signing algorithms.  This means
that alternative JWT implementations cannot be used in the place of this
library.

## Rationale and alternatives
[rationale-and-alternatives]: #rationale-and-alternatives

The alternative would be to use existing implementations for JSON Web Token
handling.  The Rust library
[JsonWebToken](https://crates.io/crates/jsonwebtoken) provides a complete
solution, though it does not allow for any customization or deviation from the
JWT standard.  This would require users of cylinder to choose alternative
signing schemes, as well as keep track of an additional set of keys to connect a
signature to an identity.

## Prior art
[prior-art]: #prior-art

* JsonWebToken:
  [https://crates.io/crates/jsonwebtoken](https://crates.io/crates/jsonwebtoken)
* RFC 7519 JSON Web Token:
  [https://tools.ietf.org/html/rfc7519](https://tools.ietf.org/html/rfc7519)
* RFC 8725 JSON Web Token Current Best Practices:
  [https://tools.ietf.org/html/rfc8725](https://tools.ietf.org/html/rfc8725)

## Unresolved Questions
[unresolved]: #unresolved

None
