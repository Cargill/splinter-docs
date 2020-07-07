# Using the Admin UI

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The Splinter Admin UI allows administrators to view circuit status and manage
user profiles, circuit proposals, and circuits on a Splinter network.

This tutorial shows how to use the Splinter Admin UI with an example scenario
that creates a circuit between Alice at Acme Corporation and Bob at Bubba's
Bakery. (See the
[Gameroom Walkthrough]({% link docs/0.5/examples/gameroom/walkthrough/index.md %})
for more information about Alice and Bob.) This example uses Docker containers
that configure and start a node for each organization, `acme-node-000` and
`bubba-node-000`, as well as an external database for each node and a single
external registry for node and key information.

As Alice, you will register as a new user and add user keys to your profile,
then propose a circuit and view the proposal summary. As Bob, you'll register
and add keys, vote on the circuit proposal, then view the new circuit's summary.
Finally, you'll log out for both Alice and Bob.

## Prerequisites

* A clone of the [splinter-ui repository](https://github.com/Cargill/splinter-ui)
* [Docker Engine](https://docs.docker.com/engine/)
* [Docker Compose](https://docs.docker.com/compose/)

## Starting the Admin UI with Docker

1. In a terminal window, navigate to the root of the `splinter-ui` repository.

1. Start the Docker containers with the following command.

    ```
    docker-compose -f docker/docker-compose.yaml up --build
    ```

2. Wait until the build completes and the containers have started. The output
   will end with messages that resemble this example:

    ```
    .
    .
    .
    splinterd-beta              | [2020-06-29 17:38:25.708] T["actix-rt:worker:0"] INFO [actix_web::middleware::logger] 172.19.0.5:36240 "GET /status HTTP/1.1" 200 219 "-" "curl/7.58.0" 0.000129
    splinterd-alpha             | [2020-06-29 17:38:25.745] T["actix-rt:worker:1"] INFO [actix_web::middleware::logger] 172.19.0.5:50672 "GET /status HTTP/1.1" 200 222 "-" "-" 0.000056
    generate-registry_1         | Added node 'alpha-node-000' to '/registry/registry.yaml'
    splinterd-beta              | [2020-06-29 17:38:25.770] T["actix-rt:worker:1"] INFO [actix_web::middleware::logger] 172.19.0.5:36244 "GET /status HTTP/1.1" 200 219 "-" "-" 0.000053
    generate-registry_1         | Added node 'beta-node-000' to '/registry/registry.yaml'
    docker_generate-registry_1 exited with code 0
    ```

Docker starts two versions of the Admin UI, one for each node. The Admin UI for
alpha (`alpha-node-000`) is at `localhost:3030`. The UI for beta
(`beta-node-000`) is at `localhost:3031`.

## Logging In or Registering

1. For Alice, open a browser and go to `localhost:3030`. The Log In dialog
   displays.

    <img src="{% link docs/0.5/images/adminui_log_in.png %}" height="258"
    alt="Admin UI login dialog">

2. To register Alice as a new user, click **Register**, then enter a new
   username (such as `alice` or `alice@acme.com`) and password.

    ![]({% link docs/0.5/images/adminui_register_alice.png %}
    "Admin UI register dialog")

3. Next, the main Admin UI page displays.

    ![]({% link docs/0.5/images/adminui_blank_landing_page.png %}
    "Admin UI: Main page")

> NOTE: To repeat this procedure for Bob, open a new browser window and go to
> `localhost:3031`. Then use the same steps to register Bob as a new user.

## Adding User Keys

After registering a new user, add the user's public and private keys.

1. Get Alice's keys from the Splinter registry, which is available in the
   `generate-registry` container.

    a. In a separate terminal window, navigate to the root directory for
       `splinter-ui`, then open a bash shell in the container:

    ```
    docker-compose -f docker/docker-compose.yaml run generate-registry bash
    ```

    b. Display Alice's public and private keys:

    ```
    root@9739a96d4f2a:/# cat /registry/alice.pub
    03ae67a60aacd6db99c851119204c81914c97bc231c79af9a22a2cb78f25218383
    root@9739a96d4f2a:/#
    
    root@9739a96d4f2a:/# cat /registry/alice.priv
    12f5463fcf7525363cacaad7b7aba4e8f182ec38942f7a74678bdf6fdfab050a
    root@9739a96d4f2a:/#
    ```

2. On the main page, click the profile icon in the left menu. The Profile page
   appears.

    ![]({% link docs/0.5/images/adminui_profile_alice_no_keys.png %}
    "Profile page (no keys yet)")

1. On the Profile page, click the orange **+** icon to display the **Add key**
   dialog.

1. In the Add key dialog, enter a key name (such as `alice`), then copy the key
   values from the `generate-registry` terminal window and paste them here.

   Tip: Do **not** press Enter or Return after pasting a key value.

    ![]({% link docs/0.5/images/adminui_add_key_alice.png %} "Admin UI: Add key values")

1. Click the **Next** button, then enter Alice's password and click **Submit**.

    ![]({% link docs/0.5/images/adminui_add_key_password.png %}
    "Admin UI: Enter password to add a key")

   If the operation was successful, the Profile page displays Alice's public
   key. At this point, it is an inactive key. The Admin UI can store
   multiple key pairs for each user, but one key pair must be marked as active.

1. To make Alice's key active, follow these steps.

   a. Hover over the key, then click **Set active**.

   ![]({% link docs/0.5/images/adminui_profile_alice_set_active_key.png %}
   "Admin UI: Set active key")

   b. Enter Alice's password when prompted.

   c. If the operation was successful, the key is now marked as **Active**.

   ![]({% link docs/0.5/images/adminui_profile_alice_active_key.png %}
   "Admin UI: Profile page with active key")

> NOTE: To repeat this procedure for Bob, use a separate browser window that
> points to `localhost:3031`.
> In the `generate-registry` container, Bob's keys are available in the files
> `/registry/bob.pub` and `/registry/bob.priv`.


## Proposing a Circuit

1. As Alice, click on the Circuits icon in the left menu. The Circuits page
   displays a summary of existing circuits and proposals. In this example,
   nothing exists yet.

    ![]({% link docs/0.5/images/adminui_circuits_page_blank.png %}
    "Admin UI: Circuits summary page")

1. Click **Propose New Circuit**. The **Add nodes** form shows the nodes that
  are available for the circuit, with the local node (`acme-node-000`)
  preselected. Select the checkbox for **Node beta-node-000**, then click
  **Next**.

    ![]({% link docs/0.5/images/adminui_propose_2_add_beta.png %}
    "Propose Circuit: Add beta node")

1. On the **Add services** form, enter the following service information for
   the alpha node.

   | Item | Value |
   |------|-------|
   | Service type | `scabbard` |
   | Service ID | `abcd` |
   | Allowed node | `alpha-node-000` |
   | Service argument | &nbsp; Key: `admin_keys` |
   |                  | &nbsp; Value: `["<Alice's public key>"]` |
   | Service argument | &nbsp; Key: `peer_services` |
   |                  | &nbsp; Value: `["fghi"]` |

   <br>

   Tip: To add a second service argument, click the small **+** icon on the
   right.

   ![]({% link docs/0.5/images/adminui_propose_3_add_services_alpha.png %}
   "Propose Circuit: Add alpha service")

4. Click the green check to submit alpha's service information. If the operation
   was successful, the green check changes to a pencil (edit) icon.

   ![]({% link docs/0.5/images/adminui_propose_4_submit_service_alpha.png %}
   "Propose Circuit: Alpha service confirmed")

   Otherwise, an error displays so you can correct the information and
   resubmit it.

5. Click the pink **+** icon at the bottom of the form to add another service
   form, then enter the service information for the beta node.

   | Item | Value |
   |------|-------|
   | Service type | `scabbard` |
   | Service ID | `fghi` |
   | Allowed node | `beta-node-000` |
   | Service argument | &nbsp; Key: `admin_keys` |
   |                  | &nbsp; Value: `["<Alice's public key>"]` |
   | Service argument | &nbsp; Key: `peer_services` |
   |                  | &nbsp; Value: `["abcd"]` |

   <br>

   Note: You must use the same key (or the same set of multiple keys) for all
   services on a circuit.

   ![]({% link docs/0.5/images/adminui_propose_5_add_services_beta.png %}
   "Propose Circuit: Add beta service")

1. Click the green check to submit beta's service information.

    ![]({% link docs/0.5/images/adminui_propose_6_submit_service_beta.png %}
    "Propose Circuit: Beta service confirmed")

1. Review the service information for both nodes, then click **Next**.

1. On the **Add circuit details** form, enter `gameroom` as the circuit
   management type, and enter an optional comment if you would like. Then
   click **Next**.

    ![]({% link docs/0.5/images/adminui_propose_7_circuit_details.png %}
    "Propose Circuit: Add circuit details")

1. On the **Add application metadata** form, you can specify
   application-specific information (optional), then click **Next**.

   This example specifies a JSON-format alias for the circuit.

    ![]({% link docs/0.5/images/adminui_propose_8_metadata.png %}
    "Propose Circuit: Example metadata")

1. On the **Review and submit** form, carefully check the circuit proposal. If
   necessary, use the **Previous** button to go back and fix incorrect
   information.

    ![]({% link docs/0.5/images/adminui_propose_9_review.png %}
    "Propose Circuit: Review proposal")

1. When you're sure the circuit proposal is correct, click **Submit**.
   If the proposal is valid and is submitted successfully, the Circuits page
   displays a notification and a summary of the proposed circuit (after a few
   seconds).

    ![]({% link docs/0.5/images/adminui_propose_10_submitted_successfully.png %}
    "Circuit proposal submitted successfully")

   Otherwise, the notification displays an error with information about the
   problem. The error is also displayed as a log message in the terminal window
   running `docker-compose`.

    ![]({% link docs/0.5/images/adminui_proposal_error.png %}
    "Circuit proposal submission error")

## Viewing a Circuit Proposal

1. To view the Circuits page (if not already displayed), click the Circuits icon
   in the left menu.

1. The Circuits page shows all circuits and proposals. In this example, Alice
   sees one proposed circuit that is awaiting approval from Bob.

    ![]({% link docs/0.5/images/adminui_circuits_proposal_awaiting_approval.png %}
    "Circuits page: Proposal awaiting approval")

1. To view the proposal details, click on the proposal summary. The circuit
   detail page shows information about each node in the circuit.

    ![]({% link docs/0.5/images/adminui_circuits_proposal_details.png %}
    "Circuit proposal details")

1. To see even more information, click on a node. The page expands to show
   service details for the node.

    ![]({% link
    docs/0.5/images/adminui_circuits_proposal_details_service_info.png %}
    "Circuit proposal details with service information")

## Voting on a Circuit Proposal

As a user on the other node, Bob must vote to accept or reject the proposal.

1. To view Bob's version of the Admin UI, open a browser and go to
   `localhost:3031`.

1. If Bob is not already logged in, register Bob as a new user (see [Logging In
   or Registering](#logging-in-or-registering)), then add Bob's user keys and
   mark them as active (see [Adding User Keys](#adding-user-keys)).

1. To display the Circuits page, click on the Circuit icon. Notice that Bob's
   view includes "Action required" and "Awaiting approval" notifications because
   his vote is needed.

    ![]({% link docs/0.5/images/adminui_proposal_awaiting_approval_bob.png %}
    "Circuit proposal: Action required")

1. Click on the proposal summary to see details of the proposed circuit.
   For Bob, this page displays a **Vote on proposal** button.

    ![]({% link docs/0.5/images/adminui_proposal_circuit_details_bob.png %}
    "Circuit Proposal: Details with Vote button")

1. Click **Vote on proposal** to display the **Vote on circuit proposal**
   dialog. Review the circuit details, then select either **Accept** or
   **Reject** to submit a vote.

   In this example, Bob eagerly accepts the proposal.

    ![]({% link docs/0.5/images/adminui_vote_on_circuit_proposal.png %}
    "Vote on circuit proposal")

1. After Bob's approval, the circuit detail page displays a notification that
   the vote was submitted successfully. (If Bob had rejected the proposal, the
   main Circuits page would display an empty list with no proposals or
   circuits.)

    ![]({% link docs/0.5/images/adminui_circuit_detail_vote_submitted.png %}
    "Circuit detail: Vote submitted successfully")

1. After a short delay, the circuit is created. The circuit detail page no
   longer shows "action required" notifications at the top or in the Status
   column.

    ![]({% link docs/0.5/images/adminui_circuit_detail_new_circuit_bob.png %}
    "Circuit detail: Circuit created")

1. Likewise, the main Circuits page shows the new circuit in place of the
   proposal.

    ![]({% link docs/0.5/images/adminui_circuits_new_circuit_bob.png %}
    "Circuits page: Circuit created (Bob's view)")

1. From Alice's browser window (at `localhost:3030`), the main Circuits page
   also displays the new circuit.

    ![]({% link docs/0.5/images/adminui_circuits_new_circuit_alice.png %}
    "Circuits page: Circuit created (Alice's view)")

## Logging Out

1. Click the profile icon to display the Profile page.

   ![]({% link docs/0.5/images/adminui_profile_alice_active_key.png %}
   "Admin UI: Profile page")

1. Click **Actions** (in the upper right).

    ![]({% link docs/0.5/images/adminui_profile_actions_menu.png %}
    "Actions menu on Profile page")

2. In the drop-down menu, click **Logout**.

    ![]({% link docs/0.5/images/adminui_actions_logout_alice.png %}
    "Actions menu: Logout")

## Stopping the Demo

1. To stop the demo, enter CTRL-C in the terminal window where you ran
   `docker-compose ... up`, and wait for a graceful shutdown.

    ```
    registry-server             | 172.24.0.7 - - [29/Jun/2020:22:59:02 +0000] "GET /registry.yaml HTTP/1.1" 200 458
    splinterd-alpha             | [2020-06-29 22:59:02.326] T["reqwest-internal-sync-runtime"] DEBUG [reqwest::async_impl::client] response '200 OK' for http://registry-server/registry.yaml
    splinterd-alpha             | [2020-06-29 22:59:02.327] T["Remote Registry Automatic Refresh: http://registry-server:80/registry.yaml"] DEBUG [splinter::registry::yaml::remote] Automatic refresh of remote registry 'http://registry-server:80/registry.yaml' successful
    ^CGracefully stopping... (press Ctrl+C again to force)
    Stopping registry-server            ... done
    Stopping splinter-db-beta           ... done
    Stopping splinter-ui-beta           ... done
    Stopping splinterd-beta             ... done
    Stopping splinter-db-alpha          ... done
    Stopping splinter-ui-alpha          ... done
    Stopping sapling-dev-server-beta    ... done
    Stopping splinterd-alpha            ... done
    Stopping sapling-dev-server-alpha   ... done
    ```

1. To remove the Docker containers (including all user and circuit information),
   run the following command:

    ```
    docker-compose -f docker/docker-compose.yaml down --volumes
    ```
