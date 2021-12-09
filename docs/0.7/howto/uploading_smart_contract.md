# Uploading a Smart Contract

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

This tutorial covers how to create a circuit on a splinter network between
two nodes and upload a smart contract via the circuit.

## Prerequisites

* A splinter network with at least two nodes running. The tutorial will refer
  to the two nodes as "alpha" and "beta" respectively
* The scabbard command line tool installed with
  [experimental features]({% link docs/0.7/howto/building_splinter.md %})
  enabled
* The splinter command line tool installed with
  [experimental features]({% link docs/0.7/howto/building_splinter.md %})
  enabled
* A compiled smart contract. Check [here](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/application_developer_guide.html#)
for details on how to create and compile a smart contract

## Procedure

1. Create a new circuit.

    a. Propose the circuit on alpha node.

    ``` console
    $ splinter circuit propose \
        --url http://splinterd-alpha:8080 \
        --key <path_to_alpha_private_key> \
        --node alpha-node-000::tcps://splinterd-alpha:8044 \
        --node beta-node-000::tcps://splinterd-beta:8044 \
        --service a000::alpha-node-000 \
        --service b000::beta-node-000 \
        --service-peer-group b000,a000 \
        --service-arg *::admin_keys=<alpha_node_pub_key> \
        --service-arg *::version=2 \
        --service-type *::scabbard \
        --management tutorial
    ```

    The `--service-arg`s supplied are specific to the scabbard service and are
    required in order to use and configure smart contracts. `admin_keys`
    identify who is allowed to add permissions to a contract and `peer_services`
    is for identifying which parties are needed for consensus.

    b. The circuit ID can be obtained by running the `proposals` command. The
    following example sets the CIRCUIT_ID environment variable; this
    environment variable is for the purposes of this procedure and is not
    used directly by the `splinter` CLI commands.

    Set CIRCUIT_ID based on the output of the `proposals` subcommand; for
    example:

    ``` console
    $ splinter circuit proposals --url http://splinterd-beta:8080

    ID           NAME    MANAGEMENT MEMBERS                       COMMENTS
    01234-ABCDE  -       tutorial   alpha-node-000;beta-node-000
    ```

    ``` console
    $ export CIRCUIT_ID=01234-ABCDE
    ```

    c. Vote to accept the circuit on node beta.

    ``` console
    $ splinter circuit vote $CIRCUIT_ID --accept \
        --key <path_to_beta_private_key> \
        --url http://splinterd-beta:8080 \
    ```

    You have now established a circuit between node alpha and node beta based
    on the provided circuit definition.

    d. Verify the circuit has been established.

    ``` console
    $ splinter circuit list --url http://splinterd-alpha:8080

    ID           NAME    MANAGEMENT MEMBERS
    01234-ABCDE  -       tutorial   alpha-node-000;beta-node-000
    ```

2. Package smart contract.

    a. Create manifest.yaml.

    The manifest contains the inputs, outputs, version, and the contract
    name. Below is a sample manifest.

    ``` yaml
    name: my_contract
    version: '1.0'
    inputs:
      - '5b7349'
    outputs:
      - '5b7349'
    ```

    b. Bundle the manifest and the compiled wasm for the smart contract into a
       tarball that has the scar extension.

    ``` console
    $ tar -jcvf my_contract.scar my_contract.wasm manifest.yaml
    ```

3. Create contract registry for smart contract.

    Each contract needs a contract registry to be created that keeps track of
    versions of the smart contract as well as the contract's owners.

    ``` console
    $ scabbard cr create my_contract \
        --owners <alpha_node_public_key> \
        --key <path_to_alpha_node_private_key> \
        --url http://splinterd-alpha:8080 \
        --service-id $CIRCUIT_ID::a000
    ```

4. Upload the smart contract.

   ``` console
   $ scabbard contract upload ./my_contract.scar \
       --key <path_to_alpha_node_private_key> \
       --url http://splinterd-alpha:8080 \
       --service-id $CIRCUIT_ID::a000
   ```

5. Create the namespace registry for the smart contract.

    A namespace will need to be created for each namespace in the contract's
    manifest. The namespace registry stores the namespace, the owners of the
    namespace, and the permissions given to that namespace. A namespace is a
    state address prefix used to identify a portion of state.

    ``` console
    $ scabbard ns create 5b7349 \
       --owners <alpha_node_public_key> \
       --key <path_to_alpha_node_private_key> \
       --url http://splinterd-alpha:8080 \
       --service-id $CIRCUIT_ID::a000
    ```

6. Create contract permissions.

    The `perm` command creates permissions that allow the smart contract to
    access state. The below command gives the smart contract both read and
    write permissions.

   ``` console
   $ scabbard perm 5b7349 my_contract --read --write \
       --key <path_to_alpha_node_private_key> \
       --url http://splinterd-alpha:8080 \
       --service-id $CIRCUIT_ID::a000
   ```

7. List uploaded smart contracts.

    ``` console
    $ scabbard contract list \
        --url 'http://splinterd-beta:8080' \
        --service-id $CIRCUIT_ID::b000

    NAME        VERSIONS OWNERS
    sawtooth_xo  1.0     <owner_public_key>
    ```

8. Display uploaded smart contract.

    ``` console
    $ scabbard contract show my_contract:1.0 \
        --url 'http://splinterd-beta:8080' \
        --service-id $CIRCUIT_ID::b000

    name: my_contract
    version: '1.0'
    inputs:
      - '5b7349'
    outputs:
      - '5b7349'
    ```

## For More Information

 * [Smart Contract Upload in Grid](https://github.com/hyperledger/grid/blob/master/examples/splinter/README.md)
 * [Sabre Transaction Family Spec](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/sabre_transaction_family.html#)
