# Circuit Disband
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document presents the design to disband a circuit which enables the
circuit to be deleted. The ability to delete a circuit affords greater
flexibility in production and testing environments. Disbanding a circuit is
dependent on the circuit’s `circuit_status`, which may be `Active`,
`Disbanded`, or `Abandoned`. Only `Active` circuits are able to be disbanded.
Once a circuit is created, it has created a network amongst its members and is
considered `Active`. In order to delete a circuit this networking capability
must first be removed. As such, disbanding a circuit involves a multi-step
process to ensure the circuit is removed safely for each node. This feature
also validates the admin service protocol version and circuit version being
used, meaning circuits created by nodes running a stable or older Splinter
release will not be able to use the disband functionality.

Circuit members may take the first step towards removing a circuit entirely
from state by choosing to disband. A single node may also choose to abandon a
circuit, which does not take the same considerations as disbanding, but will
also remove the circuit’s networking capability.

Abandoning a circuit is an alternative route to disbanding a circuit. A node
may choose to abandon a circuit to disable the circuit's networking from their
node's perspective. Other circuit members will then be unable to send the
abandoning node any messages over the abandoned circuit. Disbanding, when
compared to abandoning, is a safe operation as it requires all members to agree
before a circuit is completely removed from the network. Once a circuit has
been disbanded, it is only available locally. This means it has had it’s
networking capability removed, but the circuit and any service data remains in
state.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

### Disbanding a circuit

Disbanding a circuit entails removing a circuit’s networking capabilities.
Before a circuit is disbanded, however, all members of the circuit must agree
to disband, following a similar procedure to creating a circuit. A node’s
administrator may request to disband the circuit, which will create a proposal
with the new state of the circuit. This newly created proposal then goes
through validation to ensure the operation is able to be performed. Validating
the disband request includes the following:

  - The specified circuit in the request is present within the admin store and
    has a `circuit_status` of `Active`
  - The protocol version used by the admin services connected to the specified
    circuit is above 1
  - The specified circuit in the request has a `circuit_version` of at least 2
  - The requester’s public key has the correct permission to propose on the
    associated node
  - The specified circuit does not already have an associated proposal

Once the disband request has been validated, the proposal is available to all
circuit members. Then all members are either able to accept or reject the
proposal. If the proposal is rejected, the proposal is removed and the circuit
remains active. If the proposal is accepted, the circuit state for all member
nodes is changed to match the content of the proposal and the networking
capability of the circuit is switched off. The following section explains this
procedure in greater detail.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### `CircuitDisbandRequest`

For a node’s administrator to request that a circuit is disbanded, a
`CircuitDisbandRequest` must be first sent to the node’s admin service. The
`CircuitDisbandRequest` is defined as follows:

```
message CircuitDisbandRequest {
    // The unique circuit name
    string circuit_id = 1;
}
```

This request is then wrapped in a `CircuitManagementPayload` before being
submitted to the admin service. `CircuitManagementPayload`s are used for
various actions pertaining to creating and now deleting a circuit. The
`CircuitManagementPayload` for a disband request would appear as follows:

```
message CircuitManagementPayload {
    header =
        Header {
            action = CIRCUIT_DISBAND_REQUEST;
            requester = <Bytes of the requester’s public key>;
            payload_sha512 = <Bytes of the hash of the payload’s action>;
            requester_node_id = <Node ID of the requester submitting the payload>;
        }
    signature = <Signature of the header included in the request>;
    circuit_disband_request = <`CircuitDisbandRequest` with the circuit ID of the circuit to be disbanded>;
}
```

### Handling the `CircuitDisbandRequest`

Once this request has been submitted to the admin service, the admin service
validates the payload based on the guidelines explained previously. If the
payload is successfully validated, the admin service creates a
`CircuitProposal` to represent the disbanded state of the circuit and makes
this proposal available to other nodes. This proposal is the same type of
proposal used when creating a circuit, except the `ProposalType` is `Disband`.
The circuit (being disbanded) defined within the proposal also has the same
information as the existing active circuit, except with a `circuit_status` of
`Disbanded`.

#### Voting on the disband proposal

Voting on this proposal follows the same procedure as when voting to create a
circuit. That is, all members must first vote to accept the proposal to disband
the circuit before the circuit state is updated. If any circuit members vote to
reject the proposal, the proposal will be removed from the admin store and the
circuit will remain active. If the proposal to disband is accepted, however,
the circuit state will be updated for each of the circuit members to reflect
the `disbanded` state. This also means the circuit’s networking is turned off.

#### Result of disbanding

Specifically, the ability of the nodes to communicate over the circuit will no
longer be available. On disband, each node will remove the references to the
peers from the circuit and remove the circuit from the admin service’s
`RoutingTable`. This will disable messages from being able to be sent over the
disbanded circuit. Disbanding a circuit also includes stopping the services
that were running on the circuit. The admin service for each node uses the
`ServiceOrchestrator` to stop the circuit’s associated services. This operation
will only stop internal services, and does not have any effect on services
running externally. These services must be stopped externally. Any operations
attempted on the disbanded circuit via a Splinter service will ultimately fail
as all services have been stopped once the circuit is disbanded.

## Drawbacks
[drawbacks]: #drawbacks

Removing a circuit from its networking capabilities may cause concern for node
administrators. As such, the disband feature allows time for each system
administrator to come to a decision externally before agreeing to disband a
circuit. This also gives administrators the option to reject the disbanding, to
ensure each administrator has full control over the state of their Splinter
network. Disbanding a circuit is a relatively safe operation.

## Prior art
[prior-art]: #prior-art

Prior to this feature, circuit deletion has not been implemented. The process
of the disband feature does follow the design used to create a circuit, using
the `CircuitCreate` message.

## Unresolved questions
[unresolved]: #unresolved
