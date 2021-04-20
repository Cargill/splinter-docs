# Gameroom

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Gameroom is an example Splinter application that allows you to set up private,
multi-party circuits (called "gamerooms") and play tic tac toe with shared
state, as managed by two-phase commit consensus between the participants. This
example application, as configured, sets up Splinter nodes for two imaginary
organizations: Acme Corporation and Bubba Bakery.

To learn about the Splinter functionality that powers this deceptively simple
application, see the [Gameroom Technical
Walkthrough]({% link docs/0.4/examples/gameroom/walkthrough/index.md %}).

## Running the Gameroom Demo with Docker

**Note:** For the Kubernetes instructions, see [Running the Gameroom demo in
Kubernetes](https://github.com/Cargill/splinter/blob/master/docker/kubernetes/README.md).

This demo uses the Sabre smart contract engine provided in
[Sawtooth Sabre](https://github.com/hyperledger/sawtooth-sabre) and the XO smart
contract provided in the [Hyperledger Sawtooth Rust
SDK](https://github.com/hyperledger/sawtooth-sdk-rust/tree/master/examples/xo_rust).

**Prerequisites**:
This demo requires [Docker Engine](https://docs.docker.com/engine)
and [Docker Compose](https://docs.docker.com/compose).

**Note:** To run the demo with [prebuilt images from Docker
Hub](https://hub.docker.com/u/splintercommunity), replace
`docker-compose.yaml` with `docker-compose-dockerhub.yaml` in all commands
below.

1. Clone the [splinter repository](https://github.com/Cargill/splinter).

1. To start Gameroom, run the following command from the Splinter root
   directory:

   ``` console
   $ docker-compose --env-file=.env -f examples/gameroom/docker-compose.yaml up --build
   ```

    **Note:** To run Gameroom with experimental features enabled, set an
    environment variable in your shell before running the command above. For
    example: `export 'CARGO_ARGS=-- --features experimental'`. To go back to
    building with default features, unset the environment variable:
    `unset CARGO_ARGS`

1. To extract private keys to use in the web application, run bash using the
   `generate-registry` image and read the private key.  For example, to get
   Alice's private key:

   ``` console
   $ docker-compose -f examples/gameroom/docker-compose.yaml run generate-registry bash
   root@<container-id>:/# cat /registry/alice.priv
   <the private key value>
   root@<container-id>:/#
   ```

    The keys available are `alice` and `bob`.

1. In a browser, navigate to the web application UI for each organization:

    - Acme UI: <http://localhost:8080>

    - Bubba Bakery UI: <http://localhost:8081>

1. When you are finished, shut down the demo with the following command:

   ``` console
   $ docker-compose -f examples/gameroom/docker-compose.yaml down
   ```
