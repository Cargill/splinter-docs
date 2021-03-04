# Circuit Abandon
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document presents the design for abandoning a circuit. A node’s
administrator may choose to abandon a circuit, removing the circuit’s
networking capability from that node’s perspective, without validation from
other circuit members. This retains the circuit state for all nodes as well as
any Splinter service data. It does update the circuit state for the abandoning
node to show the `Abandoned` status of the circuit, however, and removes the
circuit’s networking. Circuits may also have a status of `Active` and
`Disbanded`. Only `Active` circuits are able to be abandoned. If circuit
members attempt to reach the node that abandoned the circuit, via the circuit
that was abandoned, the request will fail as that circuit will no longer be
able to route the message accordingly. The abandon functionality enables
individual circuit members to leave a circuit if they so choose.

The alternative to abandoning a circuit is disbanding. Disbanding a circuit is
considered a safer alternative to abandoning a circuit, as it performs
relatively the same function to remove a circuit’s networking capability, but
the process includes all circuit members. The [Circuit Disband]({%
link community/planning/circuit_disband.md %}) feature document contains more
information on this alternative approach.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

### Abandoning a circuit

Abandoning a circuit will remove a circuit’s networking capabilities for the
requesting node and disables other members from reaching the node via the
circuit that was abandoned. This request is validated by the admin service
using the following criteria:

 - The circuit to be abandoned exists and has a `circuit_status` of `Active`
 - The requester has the correct permissions for the node the circuit is being
   abandoned on
 - The specified circuit in the request has a `circuit_version` of at least 2

If the request to abandon a circuit passes this validation, the node’s admin
service will update the circuit definition and stop any of the node’s services
running on the circuit. In terms of the circuit state update, the circuit
stored by the abandoning node is updated to show the `Abandoned`
`circuit_status`. As this request does not require validation from other
circuit members, this operation’s changes are only local to the requesting node.

All other members of the circuit, if multiple peers remain, are able to
communicate over the circuit. However, no members of the circuit will be able
to communicate, via messages, over the circuit to the abandoning node.

After a circuit has been abandoned it is then able to be purged. This means all
state associated with the abandoned circuit will be removed. Further
information on the purge functionality may be found in the [Circuit Purge](
{% link community/planning/circuit_purge.md %}) feature document.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### `CircuitAbandon`

To abandon a circuit, first a `CircuitAbandon` message must be created. The
definition of this protobuf message follows:

```
message CircuitAbandon {
    // The unique circuit name
    string circuit_id = 1;
}
```
This message is then wrapped in a `CircuitManagementPayload` before being
submitted to the admin service. This payload would appear as follows:

```
message CircuitManagementPayload {
    header =
        Header {
            action = CIRCUIT_ABANDON;
            requester = <Bytes of the requester’s public key>;
            payload_sha512 = <Bytes of the hash of the payload’s action>;
            requester_node_id = <Node ID of the requester submitting the payload>;
        }
    signature = <Signature of the header included in the request>;
    circuit_abandon = <`CircuitAbandon` with the circuit ID of the circuit to be abandoned>;
}
```
This message is then submitted to the admin service where it is validated using
the criteria explained previously. If the abandon request is successfully
validated, the admin service proceeds by disabling the circuit from the
abandoning node’s perspective. This includes updating the circuit state to the
same information stored in the previously active circuit, but with the
`circuit_status` of `Abandoned`. Splinter services used by the abandoning node
will also be stopped using the admin service’s `ServiceOrchestrator`.

Furthermore, the abandoning node’s admin service will remove any peer
references associated with the circuit and will remove the circuit from that
node’s `RoutingTable`. This essentially cuts off any communication via the
circuit from the abandoned node.


## Drawbacks
[drawbacks]: #drawbacks

As the abandon action is only local to the requesting node, this essentially
‘breaks’ the circuits from the other members’ perspectives. Meaning, consensus
cannot be reached on the circuit, as the abandoning node will not receive any
communications via the abandoned circuit. This will require updating how and
when peer connections are created, updated, and destroyed to keep up with the
ability of nodes to remove these connections.

## Prior art
[prior-art]: #prior-art

Circuit deletion has not been implemented in Splinter prior to this design.

## Unresolved questions
[unresolved]: #unresolved


* When a circuit member attempts to reach the member who has abandoned the
  circuit, what component would be able to communicate that the circuit has
  been abandoned?
* Should the admin service attempt to handle circuits that have been abandoned
  by another circuit member? How would this be handled beyond the current
  behavior of simply logging that the circuit has been abandoned?
