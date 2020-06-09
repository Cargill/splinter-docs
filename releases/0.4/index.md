<!--
  Copyright 2018-2020 Cargill Incorporated

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
# Splinter v0.4 Release

Splinter v0.4 is a major new release. Here's a summary of the new and noteworthy
features in this release. For detailed changes related to the v0.4 release,
see the [Splinter release
notes](https://github.com/Cargill/splinter/blob/master/RELEASE_NOTES.md).

If you're new to Splinter, see the [Splinter documentation](/docs/0.4/) to learn
about Splinter concepts and features.

## New and Noteworthy

Quick links: <br>
[API stability](#api-stability) <br>
[Robust circuit support](#robust-circuit-support) <br>
[Registry for local and remote node
information](#registry-for-local-and-remote-node-information) <br>
[Biome for user management](#biome-for-user-management) <br>
[Scabbard service for smart contract
execution](#scabbard-service-for-smart-contract-execution) <br>
[Configuration tools for the Splinter
daemon](#configuration-tools-for-the-splinter-daemon) <br>
[Peer management improvements](#peer-management-improvements) <br>
[Gameroom example application](#gameroom-example-application) <br>
[... and more](#and-more) <br>

### API Stability

The Splinter v0.4 release commits to API stability. Changes in future v0.4.x
releases will be backward compatible with release v0.4, so that application
developers can rely on the existing behavior and features of the Splinter APIs.

Splinter API stability includes the REST API, the CLIs (`splinter`, `splinterd`,
and `scabbard`), the application interfaces of the `splinter` library, and
communication between peers.

### Robust Circuit Support

A **circuit** is a virtual network within the broader Splinter network that
safely and securely enforces privacy scope boundaries. The admin service manages
circuits and circuit proposals on each node, using two-phase commit protocol for
consensus.

Splinter now includes robust support for managing circuits directly with CLI
tools and REST API endpoints, as well as the ability to delegate circuit control
to your application.

##### Circuits managed by CLIs and REST API

For command-line interaction,  `splinter circuit` provides the following
subcommands to create and manage circuits, vote on proposed circuits, and
display circuit information. For more information, see the [Splinter CLI Command
Reference](/docs/0.4/references/cli/cli_command_reference.html).

* `list`: Lists all circuits that the node belongs to

* `proposals`: Lists all circuit proposals for the node

* `propose`: Proposes the creation of a new circuit

* `show`: Displays a specific circuit or circuit proposal

* `vote`: Votes to accept or reject a circuit proposal

The REST API provides the following endpoints for circuits and circuit
proposals. For more information, see the [splinterd REST API
Reference](/docs/0.4/api/#tag/Circuits).

* `GET /admin/circuits`: Fetches a list of the circuits that the node belongs to

* `GET /admin/circuits/{circuitID}`: Fetches information about a specific circuit

* `GET /admin/proposals`: Fetches a list of the proposed circuits for the node

* `GET /admin/proposals/{circuitID}`: Fetches information about a specific
  circuit proposal

##### Circuit management can be delegated to applications

For applications that need more control over circuit creation and management,
Splinter supports the ability to delegate circuit control to your application.
For example, an application could control whether (and when) to propose and
authorize new circuits.

### Registry for Local and Remote Node Information

In previous releases, Splinter used a node registry to store node-related
information and a separate key registry to store the public and encrypted
private keys associated with those nodes.

In this release, the unified Splinter registry combines node and key information
from local and remote files. The Splinter daemon constructs the local registry
from a local registry file and multiple (zero or more) remote registry URLs.
For more information, see the [v0.3.17 upgrade
document](/releases/upgrading/splinter-v0.3.17-from-v0.3.16.html#the-key-registry-and-node-registry-have-been-combined)
and the [splinterd(1) man page](/docs/0.4/references/cli/splinterd.1.html).

### Biome for User Management

Biome handles all user-related functionality so that the rest of Splinter
doesn't have to know anything about users and their access credentials. All
other Splinter components are key-based -- for example, keys are used to sign
transactions rather than user IDs and passwords. Biome handles all user-related
information and provides the user keys that the rest of Splinter relies on.

Splinter exposes several `/biome` REST API endpoints for registering users,
accessing user information, updating passwords (or other access credentials) and
more. See [Biome User Management](/docs/0.4/concepts/biome_user_management.html)
and the `/biome` endpoints in the [splinterd REST API
Reference](/docs/0.4/api/#tag/Biome).

### Scabbard Service for Smart Contract Execution

Scabbard is a Splinter service that runs the Sabre smart contract engine using
Hyperledger Transact for state management. Scabbard uses two-phase consensus to
reach agreement on transactions. The Scabbard service loads contracts from smart
contract archive (.scar) files and handles state agreement for those smart
contracts.

Splinter uses the following Hyperledger projects for smart contract support:

* [Sawtooth Sabre](https://github.com/hyperledger/sawtooth-sabre): Implements
  on-chain smart contracts that are executed in a WebAssembly virtual machine
)
* [Transact](https://github.com/hyperledger/transact): Platform-agnostic library
  for executing transactions with smart contracts

The `scabbard` library is packaged as a separate crate available at
[crates.io](https://crates.io/crates/scabbard).

For command-line interaction,  the `scabbard` CLI provides the following
subcommands. For more information, run `scabbard --help` at the command line.

* `contract`: List, show, or upload a Sabre smart contract
* `cr`: Create, update, or delete a Sabre contract registry
* `delete`: Remove a Sabre namespace
* `exec`: Run a Sabre smart contract
* `ns`: Create a Sabre namespace
* `perm`: Set or remove permissions for a Sabre namespace
* `state`: Get scabbard state information

The REST API provides the following endpoints for scabbard. For more
information, see the [splinterd REST API Reference](/docs/0.4/api/).

* `POST /scabbard/{circuit}/{serviceID}/batches`: Submits a list of batched
  transactions to the scabbard service
* `GET /scabbard/{circuit}/{serviceID}/batch_statuses`: Fetches the status for one
  or more batched transactions
*  `GET /scabbard/{circuit}/{serviceID}/state`: Fetches a list of entries from
  scabbard's state
*  `GET /scabbard/{circuit}/{serviceID}/state/{address}`: Fetches a state value at
  the specified address from scabbard's state

### Configuration Tools for the Splinter Daemon

The Splinter daemon, `splinterd`, provides Splinter functionality for a node.
The daemon can be configured with environment variables, configuration files,
and options with `splinterd` command. For more information, run `man splinterd`
at a command-line prompt or see the [Splinter CLI Command
Reference](/docs/0.4/references/cli/splinterd.1.html).

### Peer Management Improvements

Peering is the process of establishing connections from one Splinter node to the
other nodes on a circuit.

* Splinter now uses a dedicated connection manager to provide consistent
  reconnection and heartbeat logic for both network and component connections.

* Peering is now performed at the network layer, rather than by the admin
  service.  A dedicated peer manager handles peer connection more reliably.

* Splinter now supports TCP (HTTP), TCPS (HTTPS), and WebSocket (WS)
  connections.

### Gameroom Example Application

This release includes an example application, Gameroom, that demonstrates how to
use Splinter features such as Biome, scabbard, and others.

For more information, see the [Gameroom
Walkthrough](/docs/0.4/examples/gameroom/) and
[examples/gameroom](https://github.com/Cargill/splinter/tree/master/examples/gameroom)
in the Splinter repository.

### And More

#### CLIs for `splinter`, `splinterd`, and `scabbard`

This release includes the following command-line tools:

* `splinter`: Command-line interface for user and administrator tasks, such as
  generating keys, working with the Splinter registry, and much more. (This
  command was called `splinter-cli` in earlier releases.)

* `splinterd`: Command-line interface for running the Splinter daemon.

* `scabbard`: Command-line interface for the scabbard service, which manages and
  runs smart contracts.

For more information, see the [Splinter CLI Command
Reference](/docs/0.4/references/cli/cli_command_reference.html).
Splinter also provides man pages for these CLI tools; view them by running
`man {command-subcommand}` at a command-line prompt (for example,
`man splinter-circuit-vote`).

#### Documentation

This release includes documentation for Splinter concepts, features, and tasks
(under development), API reference guides, CLI man pages, and a comprehensive
walkthrough for the Gameroom example application.

* [Splinter documentation](/docs/0.4/)

* [splinterd REST API Reference](/docs/0.4/api/)

* [Rust crate:splinter API
  documentation](https://docs.rs/splinter/latest/splinter/)

* [Rust crate:scabbard API
  documentation](https://docs.rs.splinter/latest/scabbard)

* [Splinter CLI Command Reference](/docs/0.4/references/cli/cli_command_reference.html)

* [Gameroom Walkthrough](/docs/0.4/examples/gameroom/):
  Example Splinter application

## Splinter Software

Splinter is open-source software that is available on GitHub in
[Cargill/splinter](https://github.com/Cargill/splinter). Prebuilt Docker images
are published on
[splintercommunity](https://hub.docker.com/u/splintercommunity).

For information on building and running Splinter, see the [Splinter
README](https://github.com/Cargill/splinter/blob/master/README.md).
