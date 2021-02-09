# Splinter Admin UI
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The [splinter-ui repository](https://github.com/Cargill/splinter-ui) includes
the Admin UI for Splinter administration. This document shows the planned
screens and popups for this application.

<em>
**NOTE:**
</em>
This planning document shows preliminary images for the Admin UI. The actual
interface will change as the UI is developed. For current information, see the
Splinter v0.4 tutorial [Using the Admin
UI](/docs/0.4/tutorials/using_the_admin_ui.html).

## View Circuits and Proposals

The **Circuits** screen shows this node's circuits and circuit proposals.

![]({% link images/adminapp_circuits_list.png %} "Circuits list")

### Circuit details

After selecting a circuit ID on the **Circuits** screen, the circuit details
screen shows information about the selected circuit.

![]({% link images/adminapp_circuit_service_detail.png %} "Circuit service
detail")

## Propose a New Circuit

On the **Circuits** screen, the **Propose New Circuit** button starts the
process of defining a new circuit.

![]({% link images/adminapp_button_propose_new_circuit.png %} "Propose New
Circuit button")

### Add nodes

On the **Propose Circuit > Add nodes** screen, the **Next +** button
displays the **New Node** popup.

![]({% link images/adminapp_button_add_node_to_proposal.png %} "Add Node
button")

![]({% link images/adminapp_propose_popup_new_node.png %} "New Node popup")

After a node has been added, the **Propose Circuit > Add nodes** screen shows
information about the nodes in the proposed circuit.

![]({% link images/adminapp_propose_circuit_two_nodes_selected.png %} "Proposed
circuit with two nodes")

### Add services

![]({% link images/adminapp_propose_circuit_add_services.png %} "Add services to
circuit proposal")

### Add circuit details

![]({% link images/adminapp_propose_circuit_add_circuit_details.png %} "Add
circuit details to circuit proposal")

### Add metadata

![]({% link images/adminapp_propose_circuit_add_metadata.png %} "Add metadata to
circuit proposal")

### Review and submit

![]({% link images/adminapp_propose_circuit_review_and_submit.png %} "Review and
submit circuit proposal")

### Confirmation

Next, the Admin UI displays the circuit detail screen. A notification
appears when the proposal submission has succeeded.

![]({% link images/adminapp_circuit_submitted_successfully.png %} "Circuit
proposal submitted successfully")

## Proposal Status

### Awaiting approval (proposer's view)

Submitting a circuit proposal automatically includes an "Approve" vote for that
node. The **Awaiting Approval** screen shows which other nodes still need to
vote on the proposal.

![]({% link images/adminapp_circuit_awaiting_approval.png %} "Circuit awaiting
approval")

### Awaiting approval (other node's view)

Other nodes in the proposed circuit see a **Vote on proposal** button on the
circuit detail screen.

![]({% link images/adminapp_circuit_vote_on_proposal.png %} "Vote on proposal")

### Vote on proposal

After selecting the **Vote on proposal** button, the **Vote on circuit
proposal** popup displays circuit information, plus buttons to accept or reject
the proposal.

![]({% link images/adminapp_circuits_popup_vote_on_circuit_proposal.png %} "Vote
on proposal popup")
