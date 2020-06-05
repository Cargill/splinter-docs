# Upgrading to Splinter v0.3.13 from Splinter v0.3.12

Breaking changes and significant changes in this release:

* Upgrade required: [Socket-based transports now require a version
  handshake](#socket-based-transports-now-require-a-version-handshake)
* [`TlsConnection::new` has been
  deprecated](#tlsconnectionnew-has-been-deprecated)
* [`RestApiServerError` has an additional variant,
  `BindError`](#restapiservererror-has-an-additional-variant-binderror)

## Socket-based transports now require a version handshake

Socket-based transport connections now require a version handshake in order to
connect successfully. (This includes the TCP and TLS transports.) The
connections use this handshake to agree on the header format that describes the
data being sent over the socket.

All members of a Splinter network must upgrade, because only the Splinter
daemons for Splinter 0.3.13 and above can successfully connect.

### Version handshake in detail

In Splinter 0.3.12 and earlier, data was sent over these connections with a
frame that looked like this (where `data-length` describes the length of the
data that follows):

```
[data-length:u32][data...]
```

Splinter 0.3.13 adds a header that specifies a version, so that future changes
will be backward compatible. With the new headers, the connections exchange a
version handshake to establish the header version that can be understood by both
sides.

First, the outgoing connection sends the versions it supports:

```
[min-version:u16][max-version:u16]
```

The receiving connection replies with either a version in that range or `0` if
none is supported.

Once the version has been established, data will be transmitted with the
appropriate header for the version.  For version 1, the header has the following
format:

```
[version:u16][data-length:u32][header-checksum:u8][data...]
```

In this format, `data-length` describes the length of the data that follows and
`header-checksum` specifies a checksum.

## `TlsConnection::new` has been deprecated

The constructor for `TlsConnection` has been deprecated in favor of creating
connections via `TlsTransport`.  The transport now manages the negotiation
of the data header version, as described in the previous section.  The
current constructor sets the connection's header version to version 1.

See [this
commit](https://github.com/Cargill/splinter/commit/1f3f2594f05d8170905eb49ce9520864b6ee8b68)
for an example of how to migrate from constructor to the transport
implementation.

## `RestApiServerError` has an additional variant, `BindError`

A new error variant has been added to the `RestApiServerError` to indicate
errors when binding to an address.  This is useful for notifying the caller of
`RestApi::run` that the REST API server could not be bound to the given address.

When starting the server and reacting to specific events, a new match arm is
required:

``` rust
let rest_api = RestApiBuilder::new()
    .add_resources(my_resource_provider.resources())
    .with_bind("localhost:8080")
    .build()
    .unwrap();

match rest_api.run() {
    // ...
    RestApiServerError::BindError => error!("Unable to bind to localhost:8080"),
}
```
