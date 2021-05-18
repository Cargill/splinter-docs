# Proposal Removal
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

A circuit proposal holds all of the relevant information to create or disband a
circuit. Previously, this proposal was only removed if a proposal member voted
to reject the proposal. This document presents the design for removing circuit
proposals by any of the proposal member nodes, at any point before the proposal
has been upgraded to a circuit. Allowing proposal members the ability to remove
a circuit proposal enables Splinter users to clean up incorrect and out of date
circuit proposals. The request to remove a circuit proposal only affects a
single node. Allowing a single proposal member to remove a circuit proposal
ensures no users get caught in situations where the proposal may not otherwise
be removed.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

### Removing a Circuit Proposal

A proposal may be removed at any point before the proposal is committed to
state as a circuit. The request can be sent by any of the proposal member
nodes’ administrators, including the node that submitted the proposal. Once the
request is submitted to the node’s admin service, it will be validate using the
following criteria:

  * The circuit proposal exists
  * The associated circuit within the proposal has a `circuit_version` of at
    least 2
  * The requester has the correct permissions for the node the request
    pertains to

If the request is valid, the requesting node’s admin service will send a
message to the other proposal members. This message notifies the other nodes
that a proposal member has removed the circuit proposal, meaning no other
action can be taken on that proposal. This does not affect the other nodes’
records of this circuit proposal and may be removed from their nodes as well.
The node that has removed the circuit proposal will also remove any peer
connections established for the circuit proposal before removing the circuit
proposal from state.

Since a member has removed the circuit proposal, any further actions on the
circuit proposal will result in errors as a member will not have a record of
the specified proposal. Therefore, this node will return an error as it is not
able to access the proposal state. If the proposal was to create a circuit, the
circuit is not able to be created. If the proposal was to disband a circuit,
the circuit to be disbanded would remain active.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### `ProposalRemoveRequest`

The `ProposalRemoveRequest` determines the payload submitted to a node’s admin
service to request that a circuit proposal is removed. The payload holds the
`circuit_id` for the circuit proposal to be removed. The protobuf message
representing this payload is defined as follows:

```
message ProposalRemoveRequest {
	// The unique circuit name
	string circuit_id = 1;
}
```

A `CircuitManagementPayload` contains the request payload and the action being
requested. The `CircuitManagementPayload` submitted to request a proposal with
the circuit ID of `01234-ABCDE` is removed would appear similar to the example
below:

```
message CircuitManagementPayload {
  header =
    Header {
      action = PROPOSAL_REMOVE_REQUEST;
      requester = <bytes of the requester’s public key>;
      payload_sha512 = <bytes of the hash of the payload’s action>;
      requester_node_id = <node ID of the requester submitting the payload>;
    }
  signature = <signature of the header included in the request>;
  proposal_remove_request =
  	ProposalRemoveRequest {
  		circuit_id = 01234-ABCDE;
  	}
}
```

This request may be submitted via the Splinter CLI. For more information on the
`splinter-circuit-remove-proposal` command, see the [man page entry]({%
link docs/0.5/references/cli/splinter-circuit-remove-proposal.1.md %}).

### Notifying other proposal members

When a `CircuitManagementPayload` is submitted the admin service will extract
the necessary information from the payload and begin validating the request. If
the `ProposalRemoveRequest` is validated successfully, the admin service will
send a `RemovedProposal` message to the other proposal members’ admin services.
This message appears as follows:

```
message RemovedProposal {
	// the proposal being removed
	string circuit_id = 1;
}
```

This message is sent as an `AdminMessage`. An `AdminMessage` containing a
`RemovedProposal` message with a circuit ID of `01234-ABCDE` would appear as
follows:

```
message AdminMessage {
  message_type = REMOVED_PROPOSAL;
  removed_proposal =
  	RemovedProposal {
  		circuit_id = 01234-ABCDE;
  	}
  }
}
```

When this message is received by the other proposal members’ admin services,
the message is logged to notify the system administrator that another proposal
member has removed the specified proposal. These nodes will not see any changes
in their own records of the specified proposal.

At this point, if another proposal member has removed the circuit proposal, the
other proposal members are not able to affect circuit state. Though other
actions on the proposal would result in errors, the other proposal members may
also remove the circuit proposal through the same process.

### Removing a circuit proposal

Once the requesting node’s admin service has notified the other proposal
members, the proposal is removed. Then, the peer connections established for
the removed circuit proposal are removed. This concludes the process of
removing a circuit proposal.

## Drawbacks
[drawbacks]: #drawbacks

A drawback of this design is that one proposal member removing the circuit
proposal disables all other proposal members from upgrading the proposal to a
circuit. This means the other proposal members will see errors if they attempt
to perform any more actions on the removed proposal. If the ability to update
circuit proposals were implemented, perhaps the proposal could be salvaged. Or,
perhaps the cost of creating a circuit proposal is low enough that this isn’t a
concern.

## Prior art
[prior-art]: #prior-art

This feature is influenced by the `splinter-circuit-abandon` command, used to
delete a Splinter circuit. The process to remove a circuit proposal does follow
a similar pattern to the abandon command, as each is performed by a single node
and doesn't cause any state changes for the other circuit and circuit proposal
members. Abandoning a circuit does not completely remove the circuit from the
node’s state, but requesting to remove a circuit proposal will.
