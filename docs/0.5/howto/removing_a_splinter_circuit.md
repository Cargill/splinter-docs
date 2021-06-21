# Removing a Splinter Circuit

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

This guide explains alternative approaches for deleting, disbanding and
abandoning. Both abandoning and disbanding a circuit result in removing a
circuit’s networking capability. These operations do involve different
processes, which this walkthrough will explain below. It is important to note
the differences between disbanding and abandoning a circuit before using
either operation.

## Removing a Splinter Circuit

Splinter administrators have the option to disband or abandon a circuit, the
first part of deleting a circuit. Disbanding a circuit begins with a node’s
administrator proposing to remove a circuit’s networking functionality. Then,
all members are able to vote before the circuit is disbanded. Once the circuit
is disbanded, the circuit will no longer be usable to send messages and the
circuit is only available to each node locally. On the other hand, a node’s
administrator is able to abandon a circuit, breaking the circuit’s networking
ability for all members.

Once the circuit has been disbanded or abandoned, it is able to be purged.
Purging a circuit includes purging the circuit state and internal service data.
If any of this data still needs to be accessed and cannot be deleted, do not
purge the circuit or copy any important information somewhere outside of
Splinter. The following describes each of these commands in more detail.

### Disbanding a circuit

Disbanding a circuit differs from abandoning the circuit in that disbanding is a
circuit-wide operation. Each circuit member is involved when disbanding a
circuit. The disband command creates a situation where  circuit members are
able to gracefully shutdown the circuit. When a circuit is requested to be
disbanded, a new `CircuitProposal` is created with the same information in the
active circuit, but with a `circuit_status` of `Disbanded`. The
`CircuitProposal` has a `ProposalType` of `Disband`. At this point the original
circuit has not been affected and the new `CircuitProposal` with the updated
`circuit_status` is available to be voted on by circuit members. Note that the
associated disband proposal has the same circuit ID as the active circuit; the
only change in the circuit is the `circuit_status` field.

If any members reject the disband proposal, the proposal is removed and is no
longer viewable. If accepted, the circuit is updated for all members to match
the corresponding `CircuitProposal`. If the proposal is accepted, message
routing on the circuit is disabled and the circuit's `circuit_status` becomes
`Disbanded`.

This also removes the peer connections associated with the members of the
circuit for each individual node. If the peers are connected via a separate
circuit, the peers will remain connected via that other circuit. If the
disbanded circuit was the only circuit connecting the peers, the peer
connection must be re-established on a different circuit. Additionally, this
stops any internal Splinter services running on the circuit for each node. At
this point, any attempts to send messages over this circuit or to use the
associated services will fail as the circuit is no longer able to handle
messages and the services have been stopped.

For more information on the `disband` CLI command, see
[`splinter-circuit-disband`](
{% link docs/0.5/references/cli/splinter-circuit-disband.1.md %}).

### Abandoning a circuit

Abandoning a circuit differs from disbanding the circuit in that it is a single
circuit member choosing to leave the circuit without agreement from the other
members. A message is sent to all other circuit members that a circuit has been
abandoned, but no further action is required by the other circuit members.
From the abandoning node's perspective, once that message is sent, the circuit
is deactivated. Specifically, this means the circuit is no longer able to route
messages to other circuit members and the service associated with the abandoning
node running on the abandoned circuit is stopped. The circuit state for the
abandoning node is also updated to reflect the `Abandoned` status.

#### Consequences

Take care to note if a circuit has been abandoned by another node, as this
means the abandoning node is unreachable via the abandoned circuit. This breaks
the functionality of a circuit for other members as Splinter currently uses the
Two-Phase Commit consensus algorithm which requires all nodes to verify their
updated state. As such, any transactions will fail to commit for any of the
other circuit members as the abandoning node is not available to reach
consensus for a transaction.

For more information on the `abandon` CLI command, see
[`splinter-circuit-abandon`](
{% link docs/0.5/references/cli/splinter-circuit-abandon.1.md %}).

For information about configuring a Splinter node, see
[Configuring Splinter Nodes](
{% link docs/0.5/tutorials/configuring_splinter_nodes.md %}). In this guide,
you'll be taking on the role of two different admins for two nodes (on the same
system), so that you can create and test removing a circuit. For the first part
of the guide, you will act as the first "alpha" node administrator to
propose disbanding a circuit. Then, you will act as the second "beta" node
administrator to accept the disband proposal. For the second part of this
guide, you'll act as the first "alpha" node administrator to abandon a
circuit. Next, you'll act as the second "beta" node administrator to view the
"ABANDONED CIRCUIT" message from the "alpha" node. Finally, you will purge the
inactive circuit.

## Prerequisites

* A splinter network with at least two nodes running and at least one circuit
  created. The guide will refer to the two nodes as "alpha" and "beta"
  respectively. The guide will refer to the already created circuit as
  "01234-ABCDE". For more information on configuring a Splinter network, see
  [Configuring Splinter Nodes]({%link
  docs/0.5/tutorials/configuring_splinter_nodes.md %})

* The splinter command line tool installed with
  [experimental features]({% link docs/0.5/howto/building_splinter.md %})
  enabled

* The Splinter REST API URL must be specified for the following CLI commands if
  no default is set. It may be provided using the `SPLINTER_REST_API_URL`
  environment variable. Otherwise, the following commands may use the `-U`,
  `--url` option to specify the REST API URL.

* A private signing key must be provided for the following CLI commands if no
  default is set. The `-k`, `--key` option may be used to either specify a file
  path or the name of a .priv file in $HOME/.splinter/keys.

## Procedure
A circuit may be removed from networking by either disbanding the circuit or
abandoning the circuit. Although this guide follows both processes, disbanding
and abandoning are alternative options. A circuit may be purged regardless of
the operation used to deactivate the circuit. The first part of this procedure
will explain how to disband a circuit. The next part will explain how to
abandon a circuit. Finally, the inactive circuit will be purged.

### Alternate 1: Disbanding a Circuit

The first approach this tutorial will explain is disbanding a circuit to remove
it’s networking capabilities. This is an alternative to abandoning a circuit,
which does not involve all circuit members. A circuit may be abandoned OR
disbanded. The following instructions begin with the alpha node administrator
requesting to disband a circuit.

1. Request to disband a circuit by running the `splinter-circuit-disband`
   command from the alpha node.

    ``` console
    $ splinter circuit disband 01234-ABCDE
    ```

   This command will create a circuit proposal with the circuit ID specified
   in the command. This proposal will have a `ProposalType` of `Disband` to
   differentiate it from proposals used to create a circuit.

1. Connect to the beta Splinter node to finish disbanding the circuit.

    a. View the disband proposal using the `splinter-circuit-proposals`
      command.

    ```console
    root@beta:/# splinter circuit proposals
    ID          NAME MANAGEMENT MEMBERS    COMMENTS PROPOSAL_TYPE
    01234-ABCDE -    example    beta;alpha -        Disband
    ```

    b. Vote to accept the disband proposal using the `splinter-circuit-vote`
       command.

    ```console
    root@beta:/# splinter circuit vote 01234-ABCDE --accept
    ```

    c. View the disbanded circuit, using the `splinter-circuit-show` command.
       Note for this example that the circuit created uses the Scabbard service.

    ```console
    root@beta:/# splinter circuit show 01234-ABCDE
    Circuit: 01234-ABCDE
       Display Name: -
       Circuit Status: Disbanded
       Version: 2
       Management Type: example

       alpha
           Service (scabbard): scAA
             admin_keys:
                 <public_key_of_alpha_node_admin>
             peer_services:
                 scBB

       beta
           Service (scabbard): scBB
             admin_keys:
                 <public_key_of_beta_node_admin>
             peer_services:
                 scAA
    ```

  This verifies that the circuit has been disbanded and is now inactive for
  both alpha and beta nodes. Both nodes may proceed with purging this
  circuit.

### Alternate 2: Abandoning a Circuit

For the next part of this guide, the process of abandoning a node will be
performed by the alpha splinter node admin. Note this operation is not meant to
follow disbanding a circuit, as it is an alternative to disbanding. A circuit
may either be disbanded OR abandoned. The beta splinter node admin will then
view the logs to see that the circuit has been abandoned.

1. Connect to the alpha Splinter node to abandon the active circuit.

    a. View the active circuits using the `splinter-circuit-list` command.

    ```console
    root@alpha:/# splinter circuit list
    ID          NAME  MANAGEMENT MEMBERS
    01234-ABCDE -     example    beta;alpha
    ```

    b. Abandon the circuit using the `splinter circuit abandon` command.

    ```console
    root@alpha:/# splinter circuit abandon 01234-ABCDE
    ```

    c. Check the logs on alpha to ensure the circuit is being abandoned.

    ```bash
    splinterd-alpha      | [2021-02-11 20:39:37.803] T["actix-rt:worker:0"] DEBUG [splinter::admin::service::shared] received abandon request for circuit 01234-ABCDE
    splinterd-alpha      | [2021-02-11 20:39:37.822] T["actix-rt:worker:0"] DEBUG [splinter::admin::service::shared] Stopping service: scAA
    splinterd-alpha      | [2021-02-11 20:39:37.822] T["actix-rt:worker:0"] DEBUG [scabbard::service] Stopping scabbard service with id scAA
    splinterd-alpha      | [2021-02-11 20:39:38.011] T["consensus-scAA"] INFO [splinter::consensus::two_phase] received shutdown
    splinterd-alpha      | [2021-02-11 20:39:38.014] T["NetworkDispatchLoop"] DEBUG [splinter::circuit::handlers::circuit_message] Handle CircuitMessage SERVICE_DISCONNECT_REQUEST from orchestator::alpha [57 bytes]
    splinterd-alpha      | [2021-02-11 20:39:38.014] T["CircuitDispatchLoop"] DEBUG [splinter::circuit::handlers::service_handlers] Handle Service Disconnect Request circuit: "01234-ABCDE" service_id: "scAA" correlation_id: "aefd65df-6d9f-49a5-bc72-fa7b4a6f9a74"
    splinterd-alpha      | [2021-02-11 20:39:38.016] T["Peer Manager"] DEBUG [splinter::peer] Removing peer: beta
    ```

    d. View the abandoned circuits using the `splinter-circuit-list` command,
        used with the `--circuit-status` flag of `abandoned`.

    ```console
    root@alpha:/# splinter circuit list --circuit-status abandoned
    ID          NAME  MANAGEMENT MEMBERS
    01234-ABCDE -     example    beta;alpha
    ```

1. Inspect the logs of the beta Splinter node to verify the circuit has been
   abandoned by the alpha Splinter node.

    a. Check the logs on beta.

    ```bash
    splinterd-beta       | [2021-02-11 20:39:37.908] T["NetworkDispatchLoop"] DEBUG [splinter::circuit::handlers::circuit_message] Handle CircuitMessage ADMIN_DIRECT_MESSAGE from alpha-node-000 [87 bytes]
    splinterd-beta       | [2021-02-11 20:39:37.909] T["CircuitDispatchLoop"] DEBUG [splinter::circuit::handlers::admin_message] Handle Admin Direct Message on admin (admin::alpha-node-000 => admin::beta-node-000) [33 bytes]
    splinterd-beta       | [2021-02-11 20:39:37.910] T["Service admin::beta"] DEBUG [splinter::admin::service] received admin message message_type: ABANDONED_CIRCUIT abandoned_circuit {circuit_id: "01234-ABCDE" member_node_id: "alpha"}
    splinterd-beta       | [2021-02-11 20:39:37.910] T["Service admin::beta"] DEBUG [splinter::admin::service] Member alpha has abandoned circuit 01234-ABCDE
    ```

    b. View the beta node's version of circuit 01234-ABCDE using the
       `splinter-circuit-show` command. As this node has not abandoned the
       circuit yet, circuit 01234-ABCDE is still active.

     ```console
     root@beta:/# splinter circuit list
     ID          NAME  MANAGEMENT MEMBERS
     01234-ABCDE -     example    beta;alpha
     ```


This verifies that the circuit has been abandoned for the alpha node. The alpha
node may proceed with purging the circuit, explained in the next few steps. The
beta node must first abandon the circuit in order to purge the circuit.

### Purging a Circuit

For the last part of this guide, you'll act as the alpha Splinter node
administrator to purge the inactive circuit.

1. Connect to the alpha node to purge the circuit.

    a. As the alpha node administrator, you can view inactive circuits using
       the `splinter-circuit-list` command and specifying the `--circuit-status`
       flag.

    ```console
    root@alpha:/# splinter circuit list --circuit-status abandoned,disbanded
    ID          NAME  MANAGEMENT MEMBERS
    01234-ABCDE -     example    beta;alpha
    ```

    The circuit must first be inactive to be purged. This may be achieved
    through the circuit members voting to disband the circuit or the
    circuit may be abandoned for this node.

    b. Purge the inactive circuit using the `splinter-circuit-purge` command.

    ```console
    root@alpha:/# splinter circuit purge 01234-ABCDE
    ```

    c. Check the logs to verify the circuit has been purged.

    ```bash
    splinterd-alpha | [2021-02-02 21:42:51.302] T["actix-rt:worker:0"] DEBUG [splinter::admin::service::shared] received purge request for circuit 01234-ABCDE
    splinterd-alpha | [2021-02-02 21:42:51.313] T["actix-rt:worker:0"] DEBUG [splinter::admin::service::shared] Purged circuit 01234-ABCDE
    ```

    d. Check the list of inactive circuits again to see the circuit has been
       successfully purged from state using the `splinter-circuit-list` command.

    ```console
    root@alpha:/# splinter circuit list --circuit-status abandoned,disbanded
    ID  NAME  MANAGEMENT  MEMBERS
    ```

    Note, as this circuit used a Scabbard service, the purge request will
    also remove any state files associated with this service. For Scabbard,
    this includes the LMDB files the service uses to store transaction
    receipts and state.


## Troubleshooting

* As the peers are disconnected after disbanding or abandoning, message-sending
  may be hindered as the Splinter nodes are unable to access the peer
  connection removed after disbanding or abandoning a circuit. Therefore, the
  log messages between nodes may be interrupted and some messages may not log.
  You may see log messages from the peers reconnecting instead of expected
  messages.

## For More Information

 * [splinter-circuit-abandon CLI man page](
   {% link docs/0.5/references/cli/splinter-circuit-abandon.1.md %})
 * [splinter-circuit-disband CLI man page](
   {% link docs/0.5/references/cli/splinter-circuit-disband.1.md %})
 * [splinter-circuit-purge CLI man page](
   {% link docs/0.5/references/cli/splinter-circuit-purge.1.md %})
