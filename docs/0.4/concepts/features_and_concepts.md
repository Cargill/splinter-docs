# Features and Concepts

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Splinter allows the same network to do two-party private communication,
multi-party private communication, and network-wide multi-party shared state,
all managed with consensus. A Splinter network enables multi-party or two-party
private conversations between nodes using circuits and services.

  - A _**node**_ is the foundational runtime that allows an organization to
  participate in the network.

  - A _**circuit**_ is a virtual network within the broader Splinter network
  that safely and securely enforces prvacy scope boundaries.

  - A _**service**_ is an endpoint within a circuit that sends and receives
  private messages.

A Splinter application provides a set of distributed services that can
communicate with each other across a Splinter circuit.

![]({% link docs/0.4/images/diagram-splinter-circuits+3companies.svg %}
"Splinter private circuits with shared state")

## Designed for privacy

The key concepts of Splinter are fundamentally anchored to privacy.

   - _**Circuits**_ define scope and visibility domains.

   - _**Shared state**_, a database updated by smart contracts, is visible only
     to the services within a circuit.

## Distributed and flexible

Splinter works across a network.

   - _**State agreement**_ is achieved via the Merkle-radix tree in
     [Hyperledger Transact](https://github.com/hyperledger/transact/),
     allowing multiple services to prove they have the same data down to the
     last bit, cryptographically.

   - _**Consensus**_ is provided for creating real distributed applications.
     Splinter currently includes **two-phase commit** for 2- or 3-party
     conversations.

   - _**Connections**_ are dynamically constructed between nodes as circuits are
     created.


![]({% link docs/0.4/images/diagram-splinter-smartcontractdeployment.svg %}
"Splinter smart contract deployment at runtime")

## Agile with smart contracts

   - Smart contracts _**capture business logic**_ for processing transactions.

   - _**Runtime deployment**_ of smart contracts means no need to upgrade the
     Splinter software stack to add business logic.

   - _**Sandboxed WebAssembly smart contracts**_ keep the network safe and
     ensure determinism.

   - _**Scabbard**_, an out-of-the-box Splinter service that runs
     [Sawtooth Sabre](https://github.com/hyperledger/sawtooth-sabre)
     smart contracts across nodes, coordinated with consensus.

## Designed for applications

   - _**State delta export**_ allows an application to materialize the
     Merkle-radix tree database to another database such as PostgreSQL.
     Applications can read from the materialized database (just like any other
     web application).

   - _**Admin services**_ provide applications with a REST API to dynamically
     create new circuits, based on business need.

   - _**Authorization**_ for circuit management can be delegated to application
     code and defined by business policies.

![]({% link docs/0.4/images/diagram-splinter-twopartycircuit.svg %}
"Two-party Splinter circuit")
