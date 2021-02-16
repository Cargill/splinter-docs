# Circuit Purge
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document presents the design to enable purging a circuit from state,
including any Splinter service data related to the circuit. Being able to
delete state related to a circuit enables Splinter users to more easily maintain
and clean up any unused circuit data. The ability to purge a circuit is
validated against the circuit’s `circuit_status`. A circuit may be `Active`,
`Disbanded`, or `Abandoned`. Circuits that have become `Disbanded` or
`Abandoned` may be purged while `Active` circuits cannot. Purging a circuit
includes removing the circuit state as well as Splinter’s service data. Once
the circuit has been purged, it is no longer available from Splinter. This
action is only available for circuits that are no longer active to protect
circuits that are still active, and presumably being used, from having any data
unnecessarily removed. As functionality to deactivate a circuit is implemented,
the ability to purge the data leftover from these inactive circuits is
necessary to allow users the freedom to handle this data as they choose.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

### Purging a circuit

Once a circuit has been disbanded or abandoned, it is only available to each
node locally. Either of these operations essentially deactivates a circuit,
making it available to be purged. In order to remove this state, i.e. remove
the circuit from the admin store as well as remove any storage files related to
the Splinter service, a circuit may be purged. A circuit is purged from each
node individually, upon a node’s administrator's request. This means the state
for each node previously associated with the disbanded circuit will not change
until an administrator of that specific node requests to purge the circuit. A
purge request is verified by the admin service using the following criteria:

  - The requester has the correct permissions for the node the circuit is being
    purged from
  - The circuit is present in the admin store and has a `circuit_status` that
    is not `Active`
  - The specified circuit in the request has a `circuit_version` of at least 2

Once the purge request has been validated by the admin service, the circuit and
service state are removed from storage. This includes removing the circuit’s
entry from the admin store. Splinter service data, specifically Scabbard’s LMDB
files, are also removed by the purge request. The circuit will be removed
from state for the requesting node. All other members of the circuit would
still be able to access and view the circuit or service state. The node that
has purged the circuit, however, will be unable to view the circuit or service
data via Splinter.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### `CircuitPurgeRequest`

A `CircuitPurgeRequest` may be submitted to remove the state of an inactive
circuit. An inactive circuit is a circuit with a `circuit_status` besides
`Active`. This may follow either a `CircuitDisbandRequest` or a
`CircuitAbandonRequest`. The `CircuitDisbandRequest` is further explained in
the [Circuit Disband]({% link community/planning/circuit_disband.md %}) feature
document and ultimately creates a circuit with a `Disbanded` `circuit_status`.
The `CircuitAbandonRequest` enables a circuit to have a `circuit_status` of
`Abandoned`. In both of these cases, the circuit networking will have been
turned off. Once the circuit has been disbanded or abandoned, it is able to be
purged. The [Circuit Abandon]({% link community/planning/circuit_abandon.md %})
feature document has more information on this operation.

The `CircuitPurgeRequest` is defined in the admin protos as follows:

```
message CircuitPurgeRequest {
    // The unique circuit id of the inactive circuit to be purged
    string circuit_id = 1;
}
```
This request is also wrapped in a `CircuitManagementPayload` before being
submitted to the admin service. This payload would appear as follows:

```
message CircuitManagementPayload {
    header =
        Header {
            action = CIRCUIT_PURGE_REQUEST;
            requester = <Bytes of the requester’s public key>;
            payload_sha512 = <Bytes of the hash of the payload’s action>;
            requester_node_id = <Node ID of the requester submitting the payload>;
        }
    signature = <Signature of the header included in the request>;
    circuit_purge_request = <`CircuitPurgeRequest` with the circuit ID of the circuit to be purged>;
}
```

Once this payload is submitted to the admin service, the request is validated.
The steps for validation are described in the previous section. If the purge
request is invalid, the circuit and service state will remain. If the purge
request is successfully validated, the circuit will then be removed from the
admin store. The admin service then uses the `ServiceOrchestrator`’s
`purge_service` method, which uses the service’s defined `purge` method to
delete the service data. In Scabbard, the `purge` method will remove the LMDB
files associated with the `ScabbardState`. Any service data from services
managed externally must be also deleted externally. The purge request will
remove all data pertaining to the circuit from Splinter’s state.

## Drawbacks
[drawbacks]: #drawbacks

Purging a circuit is only available to inactive circuits, i.e. circuits that
have previously been disbanded or abandoned. This feature does not enable a
user to remove the circuit’s networking and delete all state data related to
that circuit in a single command.

## Prior art
[prior-art]: #prior-art

Prior to this feature, circuit deletion has not been implemented. Therefore,
this design does not follow prior art.
