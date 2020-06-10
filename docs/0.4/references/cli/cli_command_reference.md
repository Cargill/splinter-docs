# CLI Command Reference

## splinter CLI
The `splinter` command-line interface (CLI) provides a set of commands to
interact with Splinter components.

[`splinter`](splinter.1.md)
Command-line interface for Splinter

### Certificate Management
[`splinter cert`](splinter-cert.1.md)
Provides certificate management subcommands

[`splinter cert generate`](splinter-cert-generate.1.md)
Generates test certificates and keys for running splinterd with TLS (in insecure
mode)

### Circuit Management
[`splinter circuit`](splinter-circuit.1.md)
Provides circuit management functionality.

[`splinter circuit list`](splinter-circuit-list.1.md)
Displays the existing circuits for this Splinter node.

[`splinter circuit proposals`](splinter-circuit-proposals.1.md)
Lists the current circuit proposals.

[`splinter circuit propose`](splinter-circuit-propose.1.md)
Propose that a new circuit is created

[`splinter circuit show`](splinter-circuit-show.1.md)
Displays information about a circuit

[`splinter circuit template`](splinter-circuit-template.1.md)
 Manage circuit templates

[`splinter circuit template
arguments`](splinter-circuit-template-arguments.1.md)
Displays the arguments defined in a circuit template

[`splinter circuit template show`](splinter-circuit-template-show.1.md)
Displays the details of a circuit template

[`splinter circuit template list`](splinter-circuit-template-list.1.md)
Displays all available circuit templates

[`splinter circuit vote`](splinter-circuit-vote.1.md)
Submits a vote to accept or reject a circuit proposal

### Database Management Functions for Biome
[`splinter database`](splinter-database.1.md)
Provides database management functions for Biome

[`splinter database migrate`](splinter-database-migrate.1.md)
Updates the Biome database for a new Splinter release

### Display information about node and network health
[`splinter health`](splinter-health.1.md)
Displays information about node and network health

[`splinter health status`](splinter-health-status.1.md)
Displays information about a Splinter node

### Generates user and daemon keys for Splinter
[`splinter keygen`](splinter-keygen.1.md)
Generates user and daemon keys for Splinter

## splinterd CLI

The `splinterd` command-line interface (CLI) provides the command for running
the Splinter daemon.

[`splinterd`](splinterd.1.md)
Starts the Splinter daemon

## scabbard CLI
The `scabbard` command-line interface (CLI) provides a set of commands to
interact with scabbard services.

[`scabbard`](scabbard.1.md)
Command-line interface for scabbard

### Smart Contract Management

[`scabbard contract`](scabbard-contract.1.md)
Provides contract management functionality

[`scabbard contract list`](scabbard-contract-list.1.md)
Displays a scabbard service's smart contracts

[`scabbard contract show`](scabbard-contract-show.1.md)
Displays the details of a scabbard smart contract

[`scabbard contract upload`](scabbard-contract-upload.1.md)
Uploads a smart contract to scabbard

### Contract Registry Management

[`scabbard cr`](scabbard-cr.1.md)
Provides management of the Sabre contract registry

[`scabbard cr create`](scabbard-cr-create.1.md)
Creates a Sabre contract registry

[`scabbard cr delete`](scabbard-cr-delete.1.md)
Deletes a Sabre contract registry

[`scabbard cr update`](scabbard-cr-update.1.md)
Updates the owners of a Sabre contract registry

### Smart Contract Execution

[`scabbard exec`](scabbard-exec.1.md)
Executes a Sabre smart contract

### Namespace Management

[`scabbard ns`](scabbard-ns.1.md)
Provides management of Sabre namespaces

[`scabbard ns create`](scabbard-ns-create.1.md)
Creates a Sabre namespace

[`scabbard ns delete`](scabbard-ns-delete.1.md)
Deletes a Sabre namespace

[`scabbard ns update`](scabbard-ns-update.1.md)
Updates the owners of a Sabre namespace

### Namespace Permissions Management

[`scabbard perm`](scabbard-perm.1.md)
Sets or deletes a Sabre namespace permission
