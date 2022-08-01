
# Running echo service

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

This tutorial covers how to create a circuit on a splinter network with echo
services that can communicate with each other

## Prerequisites

Before starting the echo service on a circuit you will need the following:
-  A splinter network with at least two nodes running. Echo service is behind an
   experimental feature so both nodes should have experimental features enabled.
   The tutorial will refer to the two nodes as "alpha" and "beta" respectively.
- The splinter command line tool
  [installed]({% link docs/0.7/howto/building_splinter.md %})

## Procedure

Create a new circuit. 
Propose the circuit on the alpha node.

The echo service requires four arguments:
* `peers` - This is a list of the other services that an echo service will send
  messages to. In the circuit proposal below the `service-peer-group` argument
  is used to set the peers. Service a000 has peer b000 and vice versa.
* `frequency` - This is the amount of time, given in seconds, that the service
  will wait between sending a message. In the circuit proposal below the
  frequency is set to 5 so the services will attempt to send a message about
  once every five seconds.
* `jitter` - This is an amount of time, given in seconds, that will be used as a
  range [-jitter,jitter] to generate a random amount of time to add to the given
  frequency each time a message is sent. In the circuit proposal below the
  jitter is set to 2 so each time a message is sent, a random number between -2
  and 2 will be generated and added to frequency, the resulting number will be
  the amount of time that the service waits before sending another message.
* `error_rate` - the number of errors per second, given as a float, that an echo
  service will emulate. In the circuit proposal below the error rate is set to
  0.05 so the services will emulate an error once every 20 seconds.

``` console
$ splinter circuit propose \
    --url 'http://splinterd-alpha:8080' \
    --key <path_to_alpha_private_key> \
    --display-name "echo" \
    --node alpha::tcps://splinterd-alpha:8044 \
    --node beta::tcps://splinterd-beta:8044 \
    --service a000::alpha \
    --service b000::beta \
    --service-peer-group a000,b000 \
    --service-type "*::echo" \
    --service-arg "*::frequency=5" \
    --service-arg "*::jitter=2" \
    --service-arg "*::error_rate=0.05" \
    --management tutorial \
    --auth-type trust
```

You should see the following output after submitting the proposal:

```console
Circuit: <circuit_id>
    Display Name: echo
    Circuit Status: Active
    Schema Version: 2
    Management Type: tutorial

    alpha
        Public Key: <alpha_node_public_key>
        Endpoints:
            tcps://splinterd-alpha:8044
        Service (echo): a000
          error_rate:
              0.05
          frequency:
              5
          jitter:
              2
          peer_services:
              beta

    beta
        Public Key: <beta_node_public_key>
        Endpoints:
            tcps://splinterd-beta:8044
        Service (echo): b000
          error_rate:
              0.05
          frequency:
              5
          jitter:
              2
          peer_services:
              alpha
```

To get the circuit ID, copy the string following "Circuit:" in the proposal
output or run the `splinter circuit proposals` command and copy the string in
the ID column of the output:

```console
$ splinter circuit proposals --url http://splinterd-beta:8080

ID          NAME MANAGEMENT MEMBERS     COMMENTS PROPOSAL_TYPE
<circuit_id> echo tutorial alpha;beta -  Create
```

Vote for the circuit on the beta node using the circuit ID

```console
$ splinter circuit vote <circuit_id> \
  --url 'http://splinterd-beta:8080' \
  --key <path_to_beta_private_key> \
  --accept
```

You now have a circuit between node alpha and node beta.

Verify the circuit has been established

```console
$ splinter circuit list --url 'http://splinterd-alpha:8080'

ID          NAME MANAGEMENT MEMBERS
abcde-12345 echo tutorial   alpha;beta
```

The echo services will start running as soon as the circuit is accepted. You
should see the following logs

```console
[2022-03-23 14:46:29.859] T[MessageHandlerTaskPool-1] INFO [splinter_echo::service::message_handler] [service:vJKcc-VAuFt::a000] [from:vJKcc-VAuFt::b000] [id:1] received echo response: "test"
[2022-03-23 14:46:36.589] T[NetworkDispatchLoop] DEBUG [splinter::circuit::handlers::circuit_message] Handle CircuitMessage CIRCUIT_DIRECT_MESSAGE from Peer: Trust ( peer_id: beta ), Local: Trust ( peer_id: alpha ) [76 bytes]
[2022-03-23 14:46:36.590] T[CircuitDispatchLoop] DEBUG [splinter::circuit::handlers::direct_message] Handle Circuit Direct Message on vJKcc-VAuFt (b000 => a000) [49 bytes]
[2022-03-23 14:46:36.591] T[MessageHandlerTaskPool-3] INFO [splinter_echo::service::message_handler] [service:vJKcc-VAuFt::a000] [from:vJKcc-VAuFt::b000] [id:1] received echo request, sending echo response: "test"
[2022-03-23 14:46:36.604] T[NetworkDispatchLoop] DEBUG [splinter::circuit::handlers::circuit_message] Handle CircuitMessage CIRCUIT_DIRECT_MESSAGE from Peer: Trust ( peer_id: beta ), Local: Trust ( peer_id: alpha ) [76 bytes]
[2022-03-23 14:46:36.608] T[CircuitDispatchLoop] DEBUG [splinter::circuit::handlers::direct_message] Handle Circuit Direct Message on vJKcc-VAuFt (b000 => a000) [49 bytes]
[2022-03-23 14:46:36.608] T[MessageHandlerTaskPool-3] INFO [splinter_echo::service::message_handler] [service:vJKcc-VAuFt::a000] [from:vJKcc-VAuFt::b000] [id:1] received echo request, sending echo response: "test"
```

## For More Information

* [Echo Service Design]({% link community/planning/echo_service_design.md %})
