# Challenge Authorization
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

When Splinter nodes connect, they must go through a "handshake" to verify the
identity of the other node. In Splinter v0.4 Trust Authorization is the only
authorization algorithm implemented. Trust Authorization takes the identity
provided from the node without further verification.

An authorization type that provides a better guarantee the nodes are actually
who they say they are is Challenge Authorization. Challenge Authorization
requires a node's ID to be tied to a public key/private key pair and a node must
prove they have access to that key by signing a random nonce, providing the
resulting signature and their public key.

Adding Challenge Authorization to the Splinter node requires a reworking of the
current Authorization messages, including a new implementation of Trust
authorization. This support will be added next to the existing implementation
to remain backward compatible with v0.4.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

The procedure supports implementing different authorization types that require
the requester to prove their identity. If a requester deviates from the
procedure in any way, the requester will be rejected and the connection will be
closed.

Authorization starts when the connection is created. The following description
is from the perspective of a local node talking to a remote node but in reality
both nodes are acting as local and remote nodes and both conversations are
happening in parallel.

The following state diagram shows the progression regardless of which
authorization type is being used.

![]({% link community/images/simplified_auth_state_diagram.svg %}
  "Simplified Authorization State Diagram")

The process starts with protocol version agreement and the remote node returns
what authorization types it supports.

The local node will choose an authorization algorithm to proceed with based on
the intersection of the remote node's and local node's supported authorization
types. The state diagrams for each authorization type are provided below.

After the authorization procedure is complete, the local node will send an
`AuthComplete` message to the remote node. The connection is not quite ready yet
at this point. The connection is only ready after the local node also receives
an `AuthComplete` message from the remote node, as it goes through authorization
in parallel.  Due to the parallel authorizations, the second `AuthComplete`
message could be received at any time.

At this point, the connection is considered fully authorized and is ready for
use.

In v1 authorization there will be two supported types, Trust and Challenge
authorization. The following diagram shows the state diagram for the
"Authorization Type Procedure" in the first diagram.

![]({% link community/images/auth_type_state_diagram.svg %}
  "Authorization Type State Diagram")

Trust is a simple authorization procedure where the local node will accept the
identity  provided by the Remote without any further verification. This is not
secure and only suitable for development.

Challenge requires the remote node to prove their identity by signing a random
nonce the local nodes provided and return the signature and the public key. The
signature will then be validated against the nonce and public key provided.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Circuit and Proposal
To properly support Challenge Authorization, circuit and proposal state will
need to be extended to support setting multiple authorization types and adding a
public key to circuit members.

The changes are shown in YAML for easy documentation.

The member definition needs to include the public keys that must be used and
verified in Challenge Authorization. The public keys are optional, and can be
left unset if the node only participates in circuits that require Trust
Authorization.

Authorization type stored in a circuit will be updated to support providing
`Challenge`.

```yaml
circuits:
    WBKLF-AAAAA:
        id: WBKLF-AAAAA
    +   authorization: "Challenge"
    +   members:
            node_1:
                id: node_1
                public_key: PUBLIC_KEY
            node_2:
                id: node_2
                public_key: PUBLIC_KEY
```

The AdminServiceStore will need to be updated to store this new information. The
REST API routes also need to be updated to return the new state.

### PeerManager and ConnectionManager
The `PeerManager` and `ConnectionManager` were designed for only  supporting one
Authorization type. Their API must be updated to handle passing the required
Authorization type down the stack.

When using the `PeerManagerConnector` to get a new peer reference the peer's
authorization types need to be passed along with the endpoints.

```rust
enum PeerAuthorizationType {
    Trust,
    Challenge {
        public_key: PUBLIC_KEY
    }
}
```

```rust
pub fn add_peer_ref(
    &self,
    peer_id: String,
    endpoints: Vec<String>,
+   authorization: PeerAuthorizationType,
) -> Result<PeerRef, PeerRefAddError>
```

Then when a connection is requested from the connection manager `Connector` the
possible `PeerAuthorizationType` from the circuit is passed with the endpoint.
A Connection to the same endpoint that used a different authorization type must
be treated as a different connection.

```rust
pub fn request_connection(
    &self,
    endpoint: &str,
    connection_id: &str,
+   authorization: PeerAuthorizationType,
) -> Result<(), ConnectionManagerError>
```

```rust
pub enum ConnectionManagerNotification {
    Connected {
        endpoint: String,
        connection_id: String,
        identity: String,
+       authorized_with: Vec<PeerAuthorizationType>,
    },
```

The AuthorizationResult and Connected notification will need to be expanded to
include the `PeerAuthorizationType` as well. This is a list because a splinter
daemon will support multiple signing keys and will not always know which public
key is the expected public key. To solve this problem the daemon will respond
with a list of all of its public keys and signatures.

```rust
pub enum AuthorizationResult {
    Authorized {
        connection_id: String,
        identity: String,
        connection: Box<dyn Connection>,
    +   authorized_with: Vec<PeerAuthorizationType>,
    },
    Unauthorized {
        connection_id: String,
        connection: Box<dyn Connection>,
    },
}
```

### Authorization Messages
The following messages will be added to the existing authorization messages to
support agreeing on authorization protocol number.  If there is a mismatch
between the supported protocol versions the authorization attempt will be
canceled and the connection closed.

```proto
message AuthProtocolRequest {
    int32 auth_protocol_min = 1;
    int32 auth_protocol_max = 2;
}
```

If there can be an agreed upon protocol version, the response will include a
list of supported authorizations types that can be chosen. If the
`PeerAuthorizationType` required by the connection request is not supported,
authorization will be canceled and the connection closed.

```proto
message AuthProtocolResponse {
    enum PeerAuthorizationType {
        UNSET_AUTHORIZATION_TYPE = 0;
        TRUST = 1;
        CHALLENGE = 2;
    }
    int32 auth_protocol = 1;
    repeated PeerAuthorizationType accepted_authorization_type = 2;
}
```

If the first message received is `ConnectRequest` instead of the protocol
request it will be assumed that the v0 Trust authorization type is expected and
will be used instead of the new version. This will allow for backwards
compatibility with 0.4.

New trust authorization messages will be added to differentiate from v0 Trust
Authorization. In v0,  a `TrustRequest` or an `AuthorizedMessage` could appear
in either order causing a race condition. This version will be replaced with the
following messages so that it can be fixed.

```proto
message AuthTrustRequest {
    string identity = 1;
}

message AuthTrustResponse{}
```

The following messages will be added to support challenge authorization.
Challenge authorization starts by requesting a nonce, random bytes, that can be
signed to produce a signature that can be verified against the provided public
key.

```proto
message AuthChallengeNonceRequest{}

message AuthChallengeNonceResponse {
    bytes nonce = 1;
}
```

The node will support multiple public/private key pairs. It may not know which
key is the expected public key for authorization, so it will use each key pair
to sign and create a list of SubmitRequest.

```proto
message AuthChallengeSubmitRequest {
    SubmitRequest {
        bytes public_key = 1;
        bytes signature = 2;
    }

    repeated SubmitRequest submit_requests = 1
}

message AuthChallengeSubmitResponse {}
```

Once authorization is verified an `AuthComplete` message is returned.

```proto
message AuthComplete {}
```

Note a connection is not considered "Ready" until both nodes have sent an
`AuthComplete` message to the node.

If at any time an unexpected message is received out of order or the challenge
signature verification fails an AuthorizationError message will be returned and
the connection will be closed.  

```proto
message AuthorizationError {
    enum AuthorizationErrorType {
        UNSET_AUTHORIZATION_ERROR_TYPE = 0;
        AUTHORIZATION_REJECTED = 1;
    }

    AuthorizationErrorType error_type = 1;
    string error_message = 2;
}

```

## Rationale and alternatives
[rationale-and-alternatives]: #rationale-and-alternatives

This design includes adding a public key to the member definition that will be
used for Challenge Authorization. One alternative would be to link a public key
to a specific endpoint in the node definition.

```yaml
nodes:
    acme-node-000:
        id: acme-node-000
        endpoints:
      endpoint-1:
        challenge_public_key: PUBLIC_KEY
        endpoint: "tcps://splinterd-node-acme:8044"
      endpoint-2:
        challenge_public_key: PUBLIC_KEY
        endpoint: "tcps://splinterd-node-acme-2:8044"

```

Instead of setting one authorization, it could be updated to be a list of
authorization types in preference order. This would allow a circuit to be
updated to support both authorization types at the same time. This, however,
would require two separate updates to the circuit, the first to add the new
authorization type, and another to remove the old authorization type after all
nodes have updated to support the new authorization type. Instead, the
authorization update should only be allowed if the node can support the new
authorization type.

```yaml
circuits:
    WBKLF-AAAAA:
        id: WBKLF-AAAAA
    +   authorization: ["Challenge", "Trust"]
```

Similarly, a member in a circuit could have multiple public keys but instead the
splinter daemon will support multiple signing keys at once but only include one
key in a circuit. This will allow a node to update its key in a circuit, while
still supporting its old key in other circuits.

Instead of submitting multiple submit requests for all of the supported keys,
only one public key and signature could be returned. This however would require
the expected public key to be returned with the nonce and this information may
not always be available to the connecting node.

```proto
message AuthChallengeSubmitRequest {
    bytes public_key = 1;
    bytes signature = 2;
}
```

Finally, the authorization types could be versioned explicitly like below.
However, it was decided that the circuit schema version is enough to enforce
what version of authorization type is expected.

```yaml
circuits:
    WBKLF-AAAAA:
        id: WBKLF-AAAAA
    +   authorization: "Challenge-v1"
```

## Prior art
[prior-art]: #prior-art

This implementation is influenced by the Challenge Authorization in
[Hyperledger Sawtooth](https://sawtooth.hyperledger.org/docs/core/releases/latest/architecture/validator_network.html#authorization-types).

## Unresolved questions
[unresolved]: #unresolved
The changes required to the circuit definitions could cause problems in the
future as there is no easy way to update the public keys stored in the circuit
for the different nodes. How a node can reclaim their identity stored in a
circuit is not designed. This problem will be addressed when we design the
circuit update requests.
