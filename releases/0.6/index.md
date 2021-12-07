# Splinter v0.6 Release
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Splinter v0.6 is a major new release.  Here's a summary of the new and
noteworthy features in this release. For detailed changes related to the v0.6
release see the [Splinter release
notes](https://github.com/Cargill/splinter/blob/0-6/RELEASE_NOTES.md).

## New and Noteworthy

### Challenge Authorization

Splinter now includes an additional authorization method between peers called
Challenge Authorization.  This authorization method requires the nodes to
identify themselves using public-private key pairs.

Nodes prove their ownership of the public key by providing cryptographic
signatures using the associated private keys.  This new authorization method
improves upon trust authorization by providing needed proof of identity.

For more detailed information, see the [Challenge Authorization design]({% link
community/planning/challenge_authorization.md %})

### Circuit Removal

Splinter now includes additional controls over the life-cycle of a circuit.  A
circuit can now be disbanded or abandoned, and its data can be purged locally.

#### Circuit Disband

Disbanding a circuit entails removing a circuit’s networking capabilities.
Before a circuit is disbanded, however, all members of the circuit must agree to
disband, following a similar procedure to creating a circuit. A node’s
administrator may request to disband the circuit, which will create a proposal
with the new state of the circuit.

Once the disband request has been validated, the proposal is available to all
circuit members. Then all members are either able to accept or reject the
proposal. If the proposal is rejected, the proposal is removed and the circuit
remains active. If the proposal is accepted, the circuit state for all member
nodes is changed to match the content of the proposal and the networking
capability of the circuit is switched off.

After the circuit is disbanded, any service state is retained by all member
nodes. This state can be purged at a later time (see below).

#### Circuit Abandon

A node’s administrator may choose to abandon a circuit, removing the circuit’s
networking capability from that node’s perspective, without validation from
other circuit members.  If circuit members attempt to reach the node that
abandoned the circuit, via the circuit that was abandoned, the request will fail
as that circuit will no longer be able to route the message accordingly. The
abandon functionality enables individual circuit members to leave a circuit if
they so choose.

After the circuit is abandoned, any service state is retained by all member
nodes. This state can be purged at a later time (see below).

#### Circuit Purge

Circuits that have been disbanded or abandoned can have their state purged from
Splinter's storage. This includes all of the state for the services included in
the circuit.

Purging state is local to a node. It does not affect the member nodes of the
circuit.

#### Details

For more detailed information, see the designs for [Circuit Disband]({% link
community/planning/circuit_disband.md %}), [Circuit Abandon]({% link
community/planning/circuit_abandon.md %}), and [Circuit Purge]({% link
community/planning/circuit_purge.md %}).

### Cloud-Friendly Deployments

#### Database Support: PostgreSQL and SQLite

Splinter now supports storing all of its persistent state in either a PostgreSQL
or SQLite database. This includes all of the state for Splinter: circuit data,
user data, and role-based access control to name a few.

It also includes Scabbard state, as well. Both the transaction receipts and
merkle state for a Scabbard service may also be saved in either PostgreSQL or
SQLite.  LMDB may be used as an optional storage mechanism for saving merkle
state.

With the pre-compiled `splinterd` binary, either PostgreSQL or SQLite may be
chosen based on runtime configuration.

#### Logging

The logging system has been overhauled to support more options to better support
cloud environments. Through the configuration file the logging system is
infinitely user configurable. The system supports logging to any combination of
`stdout`, `stderr`, file, and rolling file targets. Those logs are independently
filterable by their level of severity to tailor logging output to only the logs
needed in each deployment.

### REST API Security

#### Additional Authentication Methods

Splinter now supports two additional authentication methods: OAuth2 and
Cylinder JWT (JSON Web Token).

OAuth2 support allows the Splinter REST API to integrate with existing
enterprise solutions, such as Azure, Google and Github, to provide
authentication services. The identity returned from an OAuth2 provider can then
be used for access control.

Cylinder JWT support allows other daemons and CLI tools to authenticate with the
Splinter REST API by using a signing key to create a JWT. Like challenge
authorization, the token includes a public key and a signature that can be used
to verify the signer.  The public key can be used then be used for access
control.

Biome authentication is still available, though still not recommended for
production deployments.

#### Authorization

Splinter also supports two access control method for authorizing a user's access
to the various REST API endpoints.

Each Splinter node may include a list of public keys in a configuration file.
Keys added to the `allow_keys` file will be allowed access to all REST API
endpoints.  This list is recommended for node administrators only.

Both keys and identities (Biome and OAuth2) may have their access configured
through Splinter's role-based access control system. Access can be granted via
roles which, in turn, have a set of permissions associated with them.

All authorization configuration is limited to a single node, and does not affect
any other members of a given circuit.

For more information, see the [Configuring REST API Authorization]({% link
docs/0.6/howto/configuring_rest_api_authorization.md %}) guide.

### And More

* **Circuit Display Name** ability to add a human readable name to the circuit
  definition
* **Circuit Templates** simplifies constructing common circuits
* **Metrics** basic metrics collection, including Scabbard information
* **Biome profiles** storage for user profiles, including basic information
  retrieved from an OAuth2 provider

#### Documentation

This release includes documentation for Splinter concepts, features, and tasks
(under development), API reference guides, CLI man pages, and a comprehensive
walkthrough for the Gameroom example application.

* [Splinter documentation]({% link docs/0.6/index.md %})

* [splinterd REST API Reference](/docs/0.6/api/)

* [Rust crate:splinter API
  documentation](https://docs.rs/splinter/latest/splinter/)

* [Rust crate:scabbard API
  documentation](https://docs.rs/scabbard/latest/scabbard)

* [Splinter CLI Command
  Reference]({% link docs/0.6/references/cli/index.md %})

## Splinter Software

Splinter is open-source software that is available on GitHub in
[Cargill/splinter](https://github.com/Cargill/splinter). Prebuilt Docker images
are published on
[splintercommunity](https://hub.docker.com/u/splintercommunity).

For information on building and running Splinter, see the [Splinter
README](https://github.com/Cargill/splinter/blob/0-6/README.md).
