# Splinter Glossary

## Canopy

Application interface for Splinter that can provide apps dynamically.
Canopy is a distributed-application UI framework that dynamically loads saplings
(application UI components) based on circuit configuration, user permissions,
and enterprise requirements.

## circuit

Virtual network within the broader Splinter network that safely and securely
enforces privacy scope boundaries. A circuit defines the scope and visibility
domains for two or more connected organizations.

## consensus

Mechanism for ensuring agreement between Splinter services and nodes. Splinter
currently supports two-phase-commit consensus, a basic consensus algorithm that
requires all participating parties to agree. (Other algorithms are planned for
the future.)

## node

Foundational runtime software that allows an organization to participate
in the network.

## sapling

Plug-in app for Canopy that can customize the UI, access Splinter or external
functionality, or communicate with back-end platforms and software.
Splinter includes a growing set of reusable saplings for common functionality
and interfaces with related products.

## Sawtooth Sabre

Smart contract engine: A distributed application that implements on-chain smart
contracts that can be executed in a WebAssembly virtual machine.

## scabbard

Splinter service that runs Sawtooth Sabre smart contracts across nodes,
coordinated with consensus.

## service

Endpoint within a circuit that sends and receives private messages.

## shared state

Distributed database that is visible only to the services within a circuit.
Shared state is updated by smart contracts.

## smart contract

Business logic that processes transactions. Runtime deployment of smart
contracts by the scabbard service means no need to upgrade the Splinter software
stack to add business logic. Sandboxed WebAssembly smart contracts keep the
network safe and ensure determinism.

## splinterd

Splinter daemon that handles internal functionality such as circuit creation and
management, consensus, and service coordination.

## state delta export

Mechanism that provides changes to shared state as "state deltas" (state-change
updates from Splinter as a result of processed transactions).
Applications can subscribe to these changes to get current information that can
be stored in a local database.

