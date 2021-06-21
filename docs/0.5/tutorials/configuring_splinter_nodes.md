# Configuring Two Splinter Nodes

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

This tutorial shows how to configure and run a Splinter node using Docker
containers and a prebuilt image from
[splintercommunity on Docker Hub](https://hub.docker.com/r/splintercommunity/splinterd).

In this tutorial, you'll be taking on the role of two different admins for two
nodes (on the same system), so that you can configure and test a circuit. As the
first administrator, you will set up a single Splinter node called "alpha".
After that's complete, you'll act as the second administrator to create another
node, called "beta". Next, you'll set up a circuit between the two nodes.
Finally, you will upload an example smart contract.

For planning information, general considerations, and node-management tips, see
[Planning a Splinter Deployment](
{% link docs/0.5/howto/planning_splinter_deployment.md %})
and
[Hosting a Splinter Node](
{% link docs/0.5/howto/hosting_a_splinter_node.md %}).

**NOTE:** The steps in this tutorial were tested with Docker 19.03.8 and Docker
Compose 1.25.5.

## Setting Up the First Node

1. Start by opening a terminal window and creating a Docker Compose file for the
first node, alpha.

    ```bash
    $ vi alpha-node.yaml
    ```

    ```bash
    version: "3.7"

    volumes:
      alpha-var:

    services:

      splinterd-alpha:
        image: splintercommunity/splinterd:latest
        container_name: splinterd-alpha
        hostname: alpha
        volumes:
          - alpha-var:/var/lib/splinter
          - ./config:/config
          - allow_keys_alpha:/etc/splinter/allow_keys
        entrypoint: |
          bash -c "
            splinter cert generate --skip && \
            splinterd -v \
                --node-id alpha \
                --network-endpoints tcps://0.0.0.0:8044 \
                --advertised-endpoints tcps://splinterd-alpha:8044 \
                --rest-api-endpoint 0.0.0.0:8080 \
                --registries file:///config/alpha-registry.yaml \
                --storage yaml \
                --tls-insecure
          "

    ```

    This Compose file sets up a single Splinter node. Notice that the
    `/var/lib/splinter` directory uses a Docker volume for persistence.

    Let's take a quick look at the commands and options you're running.

    **`splinter cert generate`**

    `--skip`: Generates an x.509 certificate authority and insecure certificates
    for development purposes. The `--skip` option will ignore any existing files
    that may have been created already and create anything that's missing.

    **`splinterd`**

    `-v`:  Runs the Splinter daemon with `INFO` logging.

    `--node-id alpha`:  Defines the ID for the node. This must be unique across
    the network (for all Splinter nodes that could participate on the same
    circuit).

    `--network-endpoints tcps://0.0.0.0:8044`: Specifies the listen endpoint for
    daemon-to-daemon communication between Splinter nodes, using the format
    `protocol_prefix://ip:port`

    `--advertised-endpoints tcps://splinterd-alpha:8044`:  Specifies the public
    network endpoint for daemon-to-daemon communication between Splinter nodes,
    if the `network-endpoint` is not public.

    `--rest-api-endpoint 0.0.0.0:8080`:  Specifies the address and the port that
    the `splinterd` REST API will listen on.

    `--registries file:///config/alpha-registry.yaml`:  Defines one or more
    read-only Splinter registry files. This will be covered in more detail
    later. Notice that this is using a Docker bind mount.

    `--storage`:  When set to `yaml`, the splinterd will store the Splinter
    state files in YAML files stored in the Splinter state directory.

    `--tls-insecure`:  Turns off certificate authority validation for TLS
    connections; all peer certificates are accepted. This flag is intended for
    development environments using self-signed certificates.


1. Next, create a directory to store keys for Splinter to use.

    ```bash
    $ mkdir -p config/keys
    ```

1. Run the `splinterd` image with a bind mount for the current directory, so
keys aren't lost when the container stops.

    ```bash
    $ docker run -it -v $(pwd):/splinter-demo/ splintercommunity/splinterd bash
    ```

1. Generate a public/private keypair for the alpha circuit admin. This keypair
will be used to identify the user who can sign circuit proposals and votes.

    ```bash
    root@3d211264422b:/# splinter keygen alpha --key-dir /splinter-demo/config/keys/
    Writing private key file: /splinter-demo/config/keys/alpha.priv
    writing public key file: /splinter-demo/config/keys/alpha.pub
    root@3d211264422b:/# exit
    ```

1. Verify that the keys were created.

    ```bash
    $ ls config/keys/
    alpha.priv alpha.pub
    ```

1. Display the public key value and copy it to a scratch pad so it can be used
in the next steps. This example shows a sample key value; yours will be
different.

    ```bash
    $ cat config/keys/alpha.pub
    022f2e518a8440adef03fd951869c6c0d583bfa3606c733beef4500fbe4example
    ```

1. Now, you'll create a registry file. A Splinter registry (or just "registry")
is a list of nodes that can be browsed (and sometimes directly managed) by an
administrator. Registries can be local, like the yaml file you're creating, or
remotely accessed over HTTP. See the
[Splinter registry documentation](
{% link docs/0.5/concepts/splinter_registry.md %})
for more details.

    ```bash
    $ vi config/alpha-registry.yaml
    ```

    ```bash
      ---
      - identity:
        endpoints:
          -
        display_name:
        keys:
          -
        metadata:
          organization:
    ```

1. Fill in the registry file with information about the `alpha` node. Make sure
to use the actual key value you copied instead of the example value shown below.

    ```bash
      ---
      - identity: alpha
        endpoints:
          - tcps://splinterd-alpha:8044
        display_name: alpha
        keys:
          - 022f2e518a8440adef03fd951869c6c0d583bfa3606c733beef4500fbe4example
        metadata:
          organization: alpha
    ```

1. Create the `allow_keys` file with the public key you copied above. This file
tells Splinter that the public key is permitted to make all REST API requests
(see [Configuring REST API Authorization]{% link
docs/0.5/howto/configuring_rest_api_authorization.md %} for more info). Make
sure to use the actual key value you copied instead of the example value shown
below.

    ```bash
    $ echo "022f2e518a8440adef03fd951869c6c0d583bfa3606c733beef4500fbe4example" > allow_keys_alpha
    ```

1. Start the `alpha` node.

    ```bash
    $ docker-compose -f alpha-node.yaml up
    splinterd-alpha    | Writing file: /etc/splinter/certs/generated_ca.pem
    splinterd-alpha    | Writing file: /etc/splinter/certs/private/generated_ca.key
    splinterd-alpha    | Writing file: /etc/splinter/certs/client.crt
    splinterd-alpha    | Writing file: /etc/splinter/certs/private/client.key
    splinterd-alpha    | Writing file: /etc/splinter/certs/server.crt
    splinterd-alpha    | Writing file: /etc/splinter/certs/private/server.key
    splinterd-alpha    | [2020-05-25 18:35:36.226] T["main"] WARN [splinterd::transport] Starting TlsTransport in insecure mode
    splinterd-alpha    | [2020-05-25 18:35:36.230] T["main"] INFO [splinterd::daemon] Starting SpinterNode with ID alpha
    splinterd-alpha    | [2020-05-25 18:35:36.233] T["Peer Manager"] INFO [splinter::peer] Received peer connection from admin::alpha (remote endpoint: inproc://admin-service)
    splinterd-alpha    | [2020-05-25 18:35:36.233] T["Peer Manager"] INFO [splinter::peer] Received peer connection from orchestator::alpha (remote endpoint: inproc://orchestator)
    splinterd-alpha    | [2020-05-25 18:35:36.276] T["SplinterDRestApi"] INFO [actix_server::builder] Starting 2 workers
    splinterd-alpha    | [2020-05-25 18:35:36.276] T["SplinterDRestApi"] INFO [actix_server::builder] Starting server on 0.0.0.0:8080
    splinterd-alpha    | [2020-05-25 18:35:36.284] T["Service admin::alpha"] INFO [splinter::service::processor] Starting Service: admin::alpha
    ```

Congratulations! You've got a Splinter node up and running.

## Setting Up the Second Node

1. Open a new terminal window and create the beta Compose file.

    ```bash
    $ vi beta-node.yaml
    ```

    ```bash
    version: "3.7"

    volumes:
      beta-var:

    services:

      splinterd-beta:
        image: splintercommunity/splinterd:latest
        container_name: splinterd-beta
        hostname: beta
        volumes:
          - beta-var:/var/lib/splinter
          - ./config:/config
          - allow_keys_beta:/etc/splinter/allow_keys
        entrypoint: |
          bash -c "
            splinter cert generate --skip && \
            splinterd -v \
                --node-id beta \
                --network-endpoints tcps://0.0.0.0:8044 \
                --advertised-endpoints tcps://splinterd-beta:8044 \
                --rest-api-endpoint 0.0.0.0:8080 \
                --registries file:///config/beta-registry.yaml \
                --storage yaml \
                --tls-insecure
          "

    ```

1. Create the circuit admin keys for Beta.

    ```bash
    $ docker run -it -v $(pwd):/splinter-demo/ splintercommunity/splinterd bash

    root@3e307864c916:/# splinter keygen beta --key-dir /splinter-demo/config/keys/
    Writing private key file: /splinter-demo/config/keys/beta.priv
    writing public key file: /splinter-demo/config/keys/beta.pub
    root@3e307864c916:/# exit
    ```

1. Next, create a node registry file for beta. You'll have to ask the alpha
admin for the info about their node so you can include it. You'll send them the
info about our node so they can add it to the alpha node registry.

    _NOTE: You're playing the role of both administrators here, so all the
    information is known already. In a real multi-party deployment, sharing
    node information so it can be added to various registries happens
    out-of-band. Future versions of Splinter will implement challenge
    authorization so manually sharing this information won't be necessary._

    _A remote registry file hosted somewhere accessible to all nodes, such as
    GitHub, solves some of the problems associated with out-of-band information
    sharing._

    ```bash
    $ vi config/beta-registry.yaml
    ```

    ```bash
      ---
      - identity: beta
        endpoints:
          - tcps://splinterd-beta:8044
        display_name: beta
        keys:
          - 02edb9b9e3d652c0ff33408f7e99be0572b665ac34320229f7624b7c292example
        metadata:
          organization: beta

      - identity: alpha
        endpoints:
          - tcps://splinterd-alpha:8044
        display_name: alpha
        keys:
          - 022f2e518a8440adef03fd951869c6c0d583bfa3606c733beef4500fbe4example
        metadata:
          organization: alpha
    ```

1. Create the `allow_keys` file for the beta node with the beta public key.
Again, make sure to use the actual beta key value instead of the example value
shown below.

```bash
$ echo "02edb9b9e3d652c0ff33408f7e99be0572b665ac34320229f7624b7c292example" > allow_keys_beta
```

1. Start the beta node.

    ```bash
    $ docker-compose -f beta-node.yaml up
    ```

## Updating Alpha's Registry with Beta's Information

1. Switch back to being the alpha admin (return to the alpha node's terminal
window).

1. Add the information about the beta node to the registry for alpha.

    ```bash
    $ vi config/alpha-registry.yaml
    ```

    ```bash
        ---
      - identity: alpha
        endpoints:
          - tcps://splinterd-alpha:8044
        display_name: alpha
        keys:
          - 022f2e518a8440adef03fd951869c6c0d583bfa3606c733beef4500fbe4example
        metadata:
          organization: alpha

      - identity: beta
        endpoints:
          - tcps://splinterd-beta:8044
        display_name: beta
        keys:
          - 02edb9b9e3d652c0ff33408f7e99be0572b665ac34320229f7624b7c292example
        metadata:
          organization: beta

    ```

You don't have to restart the alpha Splinter node after this change, because
Splinter automatically checks for changes to the node registry.

## Creating a Circuit

Creating a Splinter circuit has two parts. First, the circuit admin on one node
sends a circuit proposal to one (or more) other nodes. After the proposal is
received, the other nodes involved in the circuit must vote to approve it before
the circuit will be created.

1. Exec into the beta Splinter node to start creating a circuit.

    ```bash
    $ docker exec -it splinterd-beta bash
    root@beta:/#
    ```

1. In a real-life scenario, you would gather the information for the circuit
proposal, such as the node and service IDs, service type, and the REST API URLs.
For this tutorial, the next step provides the values you need for the alpha and
beta nodes.

1. Run the `splinter circuit propose` command on the beta node.

    ```bash
    root@beta:/# splinter circuit propose \
      --key /config/keys/beta.priv \
      --url http://0.0.0.0:8080  \
      --node beta::tcps://splinterd-beta:8044 \
      --node alpha::tcps://splinterd-alpha:8044 \
      --service gsBB::beta \
      --service gsAA::alpha \
      --service-type *::scabbard \
      --management example \
      --service-arg *::admin_keys=$(cat /config/keys/beta.pub) \
      --service-peer-group gsBB,gsAA
    ```

    Let's take a look at the options needed to create a circuit proposal.

    `--key /config/keys/beta.priv`: Private key file to use for signing the
    transaction and authenticating with the Splinter REST API. This can be a
    relative or absolute file path, or it can be the name of a .`priv` file in
    the `$HOME/.splinter/keys` directory. The target file must contain a valid
    secp256k1 private key. This option is required.

    `--url http://splinterd-beta:8080`: URL of the Splinter REST API

    `--node beta::tcps://splinterd-beta:8044`: Node that should be part of the
    circuit, using the format NODE-ID::ENDPOINT1,ENDPOINT2. All endpoints must
    be in the registry entry for the given node ID. The proposer must also
    specify its own node, if it is to be included on the circuit proposal.
    Repeat this option to specify multiple nodes.

    `--node alpha::tcps://splinterd-alpha:8044`: Same as above.

    `--service gsBB::beta`: Service ID and allowed nodes, using the format
    SERVICE-ID::ALLOWED-NODES. Service IDs are comprised of 4 ASCII alphanumeric
    characters. The ALLOWED-NODES specifies the node which the service will run
    on, currently only one node ID is allowed.

    `--service gsAA::alpha`: Same as above.

    `--service-type *::scabbard`: Service type for the specified service (as
    defined by --service), using the format `SERVICE-ID::SERVICE-TYPE`. The glob
    operator, `*`, may be used in place of the SERVICE-ID to match all or
    certain parts of the 4 character SERVICE-ID. For instance,
    `AA*::SERVICE-TYPE` to match all service IDs that begin with AA. Scabbard is
    presently the only service-type implemente for circuit creation.

    `--management example`: Circuit management type. This indicates the
    application authorization handler which handles the circuit’s change
    proposals.

    `--service-arg *::admin_keys=$(cat /config/keys/beta.pub)`: String that
    passes key/value arguments to the specified service. As with
    `--service-type` above, the glob operator, `*`, can be used to match all or
    certain parts of the service ID. The `admin_keys` value specifies the public
    key of the smart contract administrator who's is allowed to upload smart
    contracts to the circuit.

    `--service-peer-group gsBB,gsAA` Service peer group (a list of peer
    services). Peer services are services used by peer nodes within a circuit.
    This is the group of services that must come to consensus amongst the node
    peers.


1. The output of the `propose` command shows that it was submitted to the REST
   API.

    ```bash
    The circuit proposal was submitted successfully
    Circuit: El9jM-6bXjg
        Management Type: example

        beta
            Service (scabbard): gsBB
              admin_keys:
                  02edb9b9e3d652f0df43408f7e99be1172b665ac34320229f7624b7c292e8cf4b0
              peer_services:
                  gsAA

        alpha
            Service (scabbard): gsAA
              admin_keys:
                  02edb9b9e3d652f0df43408f7e99be1172b665ac34320229f7624b7c292e8cf4b0
              peer_services:
                  gsBB
    ```

1. Now, make sure the proposal was committed on both nodes.

    a. Check the logs on alpha.

    ```bash
    splinterd-alpha    | [2020-05-25 18:38:04.406] T["Peer Manager"] INFO [splinter::peer] Received peer connection from beta (remote endpoint: tcps://172.19.0.3:56964)
    splinterd-alpha    | [2020-05-25 18:45:28.616] T["consensus-admin::alpha"] INFO [splinter::admin::service::shared] committed changes for new circuit proposal El9jM-6bXjg
    splinterd-alpha    | [2020-05-25 18:45:28.616] T["consensus-admin::alpha"] INFO [splinter::admin::service::consensus] Committed proposal 36373565346133356336653865376462616137333935333030636363393135316161343134396634313066326636623563393637626262353932386532643137
    ```

    b. Check the logs on beta.

    ```bash
    splinterd-beta    | [2020-05-25 18:38:04.408] T["Peer Manager"] INFO [splinter::peer] Pending peer alpha connected via tcps://splinterd-alpha:8044
    splinterd-beta    | [2020-05-25 18:45:28.720] T["consensus-admin::beta"] INFO [splinter::admin::service::shared] committed changes for new circuit proposal El9jM-6bXjg
    splinterd-beta    | [2020-05-25 18:45:28.720] T["consensus-admin::beta"] INFO [splinter::admin::service::consensus] Committed proposal 36373565346133356336653865376462616137333935333030636363393135316161343134396634313066326636623563393637626262353932386532643137
    ```

    >Tip: Rather than inspecting the logs, you can run the `splinter circuit
    proposals` command on either node to display all committed proposals.

    ```bash
    root@beta:/# splinter circuit proposals --key /config/keys/beta.priv
    ID                  MANAGEMENT MEMBERS    COMMENTS
    El9jM-6bXjg example               beta;alpha
    ```

1. Connect to the alpha Splinter node to finish creating the circuit.

    ```bash
    $ docker exec -it splinterd-alpha bash
    root@alpha:/# splinter circuit proposals --key /config/keys/alpha.priv
    ID                 MANAGEMENT MEMBERS    COMMENTS
    El9jM-6bXjg example             beta;alpha
    ```

1. Then vote to accept the circuit proposal. Make sure to replace the example
   proposal ID with the value from your nodes.

    ```bash
    root@alpha:/# splinter circuit vote \
    --key /config/keys/alpha.priv \
    --url http://0.0.0.0:8080 \
    El9jM-6bXjg \
    --accept
    ```

1. Look at the logs (or run `splinter circuit list`) to verify that the circuit
has been created.

    ```bash
    splinterd-alpha    | [2020-05-25 19:12:08.030] T["actix-rt:worker:1"] INFO [actix_web::middleware::logger] 127.0.0.1:55348 "POST /admin/submit HTTP/1.1" 202 0 "-" "-" 0.002233
    splinterd-alpha    | [2020-05-25 19:12:08.550] T["consensus-admin::alpha"] INFO [splinter::admin::service::consensus] Committed proposal 65313837633937306132623162646138396463623966373232323066656135313734636131306564666237363366306138303335616366636530346238386136
    ```

    ```bash
    root@alpha:/# splinter circuit list --key /config/keys/alpha.priv
    ID          MANAGEMENT MEMBERS
    El9jM-6bXjg example    beta;alpha
    ```

Now that you have two Splinter nodes with a circuit between them, you can use
this circuit to upload smart contracts and share data.

## Uploading a Smart Contract

Splinter uses the
[Sawtooth Sabre](https://github.com/hyperledger/sawtooth-sabre) smart contract
engine with a built-in Splinter service called `scabbard` to update shared state
on a circuit between two or more Splinter nodes. In this procedure, you'll
upload an example smart contract.

_NOTE: This procedure builds on the "Configuring Two Splinter Nodes" procedure,
but any existing circuit will work with minor modifications, assuming you have
network access to the REST API on the Splinter nodes._


You'll need a `scabbard-cli` Docker container to interact with your Splinter
circuits, so you'll add a new section to your Docker Compose file. Scabbard will
need access to the keys used to create the circuit you're deploying a smart
contract to. As in the rest of this tutorial, keys are stored in the
`./config/keys` directory.

1. Add a new service to the `beta-node.yaml` configuration file.

    ```bash
    $ vi beta-node.yaml
    ```

    ```bash
    scabbard-cli-beta:
      image: splintercommunity/scabbard-cli:0.4
      container_name: scabbard-cli-beta
      hostname: scabbard-cli-beta
      volumes:
        - ./config:/config
    ```

1. List the Splinter circuits that your node belongs to, so you know which
circuit ID to use when uploading the smart contract.

    ```bash
    $ docker exec splinterd-beta splinter circuit list --key /config/keys/beta.priv
    ID          MANAGEMENT MEMBERS
    El9jM-6bXjg example    beta;alpha
    ```

1. Start up the `scabbard-cli` container.

    ```bash
    $ docker-compose -f beta-node.yaml run scabbard-cli-beta bash
    root@scabbard-cli-beta:/#
    ```

1. Set an environment variable for the circuit ID. (The environment variable
isn't consumed directly by Splinter or Scabbard; it just makes pasting the
commands easier.) Make sure to use the actual value from the previous `splinter
circuit list` command, not the example value shown below.

    ```bash
    root@scabbard-cli-beta:/# export CIRCUIT_ID="El9jM-6bXjg"
    ```

1. Next, download the smart contract archive file (also called a "scar file")
from `splinter.dev`.

    ```bash
    root@scabbard-cli-beta:/# curl -OLsS https://files.splinter.dev/scar/xo_0.4.2.scar
    ```

1. Before you can upload the smart contract to the circuit, you'll need to
create a contract registry with the `scabbard cr create` command. Each smart
contract has a contract registry to keep track of the contract versions, as well
as the contract’s owners.

    ```bash
    root@scabbard-cli-beta:/# scabbard cr create \
      sawtooth_xo \
      --owners $(cat /config/keys/beta.pub) \
      --key /config/keys/beta.priv \
      --url 'http://splinterd-beta:8080' \
      --service-id $CIRCUIT_ID::gsBB
    ```

    Here's more information about the options for this command.

    `--owners $(cat /config/keys/beta.pub)`: Owner of the contract registry.

    `--key /config/keys/beta.priv`: Private key file to use for signing the
    transaction and authenticating with the Splinter REST API. This can be a
    relative or absolute file path, or it can be the name of a `.priv` file in
    the `$HOME/.splinter/keys` directory. The target file must contain a valid
    secp256k1 private key. This option is required.
    _Note: Only     administrators of a circuit can create contract registries.
    You can run `splinter circuit show $CIRCUIT_ID` to view the admin keys of
    the services on the circuit._

    `--url 'http://splinterd-beta:8080'`: URL to the scabbard REST API. (This is
    built in to Splinter)

    `--service-id $CIRCUIT_ID::gsBB`: Fully-qualified service ID of the scabbard
    service (must be of the form `circuit_id::service_id`). If you've forgotten
    the scabbard service id, you can run `splinter circuit show $CIRCUIT_ID` to
    display detailed information about the circuit.

1. Look at the Splinter logs to make sure the contract registry was created.

    a. Check the logs on alpha.

    ```bash
    splinterd-alpha    | [2020-05-25 20:00:41.257] T["StaticExecutionAdapter"] INFO [sawtooth_sabre::handler] Action: Create Contract Registry ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "000000a87cb5eafdcca6a814e4add97c4b517d3c530c2f44b31d18e3b0c44298fc1c14"] ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "000000a87cb5eafdcca6a814e4add97c4b517d3c530c2f44b31d18e3b0c44298fc1c14"]
    splinterd-alpha    | [2020-05-25 20:00:41.464] T["consensus-gsAA"] INFO [scabbard::service::state] committed 1 change(s) for new state root c8b7311c79d03af3d35ca03b72ca56534b590c0adeca820211e99a42ea9c1878
    splinterd-alpha    | [2020-05-25 20:00:41.466] T["consensus-gsAA"] INFO [scabbard::service::consensus] Committed proposal 63386237333131633739643033616633643335636130336237326361353635333462353930633061646563613832303231316539396134326561396331383738
    splinterd-alpha    | [2020-05-25 20:00:41.466] T["consensus-gsAA"] INFO [splinter::consensus::two_phase] proposal accepted: 63386237333131633739643033616633643335636130336237326361353635333462353930633061646563613832303231316539396134326561396331383738
    ```

    b. The logs on beta should be similar.

    ```bash
    splinterd-beta    | [2020-05-25 20:00:41.019] T["actix-rt:worker:0"] INFO [actix_web::middleware::logger] 172.19.0.4:47404 "POST /scabbard/El9jM-6bXjg/gsBB/batches HTTP/1.1" 202 185 "-" "-" 0.000963
    splinterd-beta    | [2020-05-25 20:00:41.035] T["actix-rt:worker:1"] INFO [actix_web::middleware::logger] 172.19.0.4:47406 "GET /scabbard/El9jM-6bXjg/gsBB/batch_statuses?ids=cdca82ec51e3ec092f91062b75e34d037532ba821f0cfea3a8a1112768dd803004dd510e161f300afdba8c75f9b56f761cff490eb13bc1c8e5ce3d979346e6ce HTTP/1.1" 200 246 "-" "-" 0.000196
    splinterd-beta    | [2020-05-25 20:00:41.048] T["actix-rt:worker:0"] INFO [actix_web::middleware::logger] 172.19.0.4:47408 "GET /scabbard/El9jM-6bXjg/gsBB/batch_statuses?ids=cdca82ec51e3ec092f91062b75e34d037532ba821f0cfea3a8a1112768dd803004dd510e161f300afdba8c75f9b56f761cff490eb13bc1c8e5ce3d979346e6ce HTTP/1.1" 200 246 "-" "-" 0.000739
    splinterd-beta    | [2020-05-25 20:00:41.058] T["StaticExecutionAdapter"] INFO [sawtooth_sabre::handler] Action: Create Contract Registry ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "000000a87cb5eafdcca6a814e4add97c4b517d3c530c2f44b31d18e3b0c44298fc1c14"] ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "000000a87cb5eafdcca6a814e4add97c4b517d3c530c2f44b31d18e3b0c44298fc1c14"]
    ...
    splinterd-beta    | [2020-05-25 20:00:41.461] T["StaticExecutionAdapter"] INFO [sawtooth_sabre::handler] Action: Create Contract Registry ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "000000a87cb5eafdcca6a814e4add97c4b517d3c530c2f44b31d18e3b0c44298fc1c14"] ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "000000a87cb5eafdcca6a814e4add97c4b517d3c530c2f44b31d18e3b0c44298fc1c14"]
    splinterd-beta    | [2020-05-25 20:00:41.474] T["actix-rt:worker:0"] INFO [actix_web::middleware::logger] 172.19.0.4:47476 "GET /scabbard/El9jM-6bXjg/gsBB/batch_statuses?ids=cdca82ec51e3ec092f91062b75e34d037532ba821f0cfea3a8a1112768dd803004dd510e161f300afdba8c75f9b56f761cff490eb13bc1c8e5ce3d979346e6ce HTTP/1.1" 200 406 "-" "-" 0.000081
    splinterd-beta    | [2020-05-25 20:00:41.665] T["consensus-gsBB"] INFO [scabbard::service::state] committed 1 change(s) for new state root c8b7311c79d03af3d35ca03b72ca56534b590c0adeca820211e99a42ea9c1878
    splinterd-beta    | [2020-05-25 20:00:41.666] T["consensus-gsBB"] INFO [scabbard::service::consensus] Committed proposal 63386237333131633739643033616633643335636130336237326361353635333462353930633061646563613832303231316539396134326561396331383738
    splinterd-beta    | [2020-05-25 20:00:41.666] T["consensus-gsBB"] INFO [splinter::consensus::two_phase] proposal accepted: 63386237333131633739643033616633643335636130336237326361353635333462353930633061646563613832303231316539396134326561396331383738
    splinterd-beta    | [2020-05-25 20:00:41.677] T["actix-rt:worker:1"] INFO [actix_web::middleware::logger] 172.19.0.4:47506 "GET /scabbard/El9jM-6bXjg/gsBB/batch_statuses?ids=cdca82ec51e3ec092f91062b75e34d037532ba821f0cfea3a8a1112768dd803004dd510e161f300afdba8c75f9b56f761cff490eb13bc1c8e5ce3d979346e6ce HTTP/1.1" 200 410 "-" "-" 0.000081
    ```

1. Now that the contract registry has been created, you can upload the smart
contract to the circuit.

    ```bash
    root@scabbard-cli-beta:/# scabbard contract upload xo:0.4.2 \
      --path . \
      --key /config/keys/beta.priv \
      --url 'http://splinterd-beta:8080' \
      --service-id $CIRCUIT_ID::gsBB
    ```

    Most of these options are the same as in the command to create the contract
    registry, but the `--path` option is new.

    `--path .`: Specifies the directory path(s) to use when searching for the
    scar file to upload. This option can be specified multiple times to provide
    multiple directories to search. If this option is not provided, the
    `$SCAR_PATH` environment variable will be checked. If the environment
    variable has not been set, the default path `/usr/share/scar` will be used.

1. The `scabbard contract upload` command doesn't indicate success on
completion, but you can see in the logs that the contract was uploaded.

    a. Check the logs on alpha.

    ```bash
    splinterd-alpha    | [2020-05-25 01:44:57.711] T["StaticExecutionAdapter"] INFO [sawtooth_sabre::handler] Action: Create Contract ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "00ec02bab599c6017cf8db12dff00a16703f9125f8f9b80e6abca0766aa2d3926b4f5e"] ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "00ec02bab599c6017cf8db12dff00a16703f9125f8f9b80e6abca0766aa2d3926b4f5e"]
    splinterd-alpha    | [2020-05-25 01:44:58.176] T["consensus-gsAA"] INFO [scabbard::service::state] committed 2 change(s) for new state root 00ca078d351c0c6db20b4497f55ae2d0f6481d2100063399414d7ed286a2421a
    splinterd-alpha    | [2020-05-25 01:44:58.182] T["consensus-gsAA"] INFO [scabbard::service::consensus] Committed proposal 30306361303738643335316330633664623230623434393766353561653264306636343831643231303030363333393934313464376564323836613234323161
    splinterd-alpha    | [2020-05-25 01:44:58.183] T["consensus-gsAA"] INFO [splinter::consensus::two_phase] proposal accepted: 30306361303738643335316330633664623230623434393766353561653264306636343831643231303030363333393934313464376564323836613234323161
    ```

    b. The logs on beta will be similar.

    ```bash
    splinterd-beta    | [2020-05-25 01:44:58.060] T["StaticExecutionAdapter"] INFO [sawtooth_sabre::handler] Action: Create Contract ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "00ec02bab599c6017cf8db12dff00a16703f9125f8f9b80e6abca0766aa2d3926b4f5e"] ["00ec01f1462fc8ddcebbc5e8aab44030f9be73517f3e49b9fb448789cd817a5d3ff5d4", "00ec02bab599c6017cf8db12dff00a16703f9125f8f9b80e6abca0766aa2d3926b4f5e"]
    splinterd-beta    | [2020-05-25 01:44:58.077] T["actix-rt:worker:0"] INFO [actix_web::middleware::logger] 172.19.0.4:47656 "GET /scabbard/El9jM-6bXjg/gsBB/batch_statuses?ids=9687661f2a1caef0c1599f4d0004492a7c494364824d15e9570ab8cfd57d75b7213623645aec6704257854363570773f3cfd791583a1ce92054a4427d3ef7363 HTTP/1.1" 200 406 "-" "-" 0.017115
    ...
    splinterd-beta    | [2020-05-25 01:44:58.296] T["consensus-gsBB"] INFO [scabbard::service::state] committed 2 change(s) for new state root 00ca078d351c0c6db20b4497f55ae2d0f6481d2100063399414d7ed286a2421a
    splinterd-beta    | [2020-05-25 01:44:58.300] T["consensus-gsBB"] INFO [scabbard::service::consensus] Committed proposal 30306361303738643335316330633664623230623434393766353561653264306636343831643231303030363333393934313464376564323836613234323161
    splinterd-beta    | [2020-05-25 01:44:58.301] T["consensus-gsBB"] INFO [splinter::consensus::two_phase] proposal accepted: 30306361303738643335316330633664623230623434393766353561653264306636343831643231303030363333393934313464376564323836613234323161
    ```

1. Run `scabbard contract list` against the REST API on both nodes to see that
the smart contract was successfully uploaded and transmitted across the circuit.

    ```bash
    root@scabbard-cli-beta:/# scabbard contract list \
      --key /config/keys/beta.priv
      --url 'http://splinterd-alpha:8080' \
      --service-id $CIRCUIT_ID::gsAA
    NAME        VERSIONS OWNERS
    sawtooth_xo 1.0      02edb9b9e3d652f0df43408f7e99be1172b665ac34320229f7624b7c292e8cf4b0

    root@scabbard-cli-beta:/# scabbard contract list \
      --key /config/keys/beta.priv
      --url 'http://splinterd-beta:8080' \
      --service-id $CIRCUIT_ID::gsBB
    NAME        VERSIONS OWNERS
    sawtooth_xo 1.0      02edb9b9e3d652f0df43408f7e99be1172b665ac34320229f7624b7c292e8cf4b0
    ```

## Removing a circuit

Removing a circuit is enabled through disbanding or abandoning a circuit. The
circuit may then be purged, as it is only available to each node locally. For
more information on these processes, see the [Removing a Splinter Circuit]({%
link docs/0.5/howto/removing_a_splinter_circuit.md %}) tutorial.
