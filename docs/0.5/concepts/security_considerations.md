# Security Considerations

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Splinter's security-related features start with support for cryptographic
signing with public/private keys, then continue with additional levels of
security and customizable permissions. This topic summarizes how Splinter uses
key-based signing, provides Biome to map user credentials to keys, and supports
organization-based smart permissions with the Pike smart contract. It also
describes Splinter's port requirements and security recommendations for REST API
connections.

## Cryptographic Signing with Public/Private Keys

Like [Hyperledger Sawtooth](https://sawtooth.hyperledger.org/) and other
distributed ledgers, Splinter supports [key-based cryptographic
signing](https://en.wikipedia.org/wiki/Public-key_cryptography).

Scabbard, the default distributed ledger service included in Splinter, uses
public/private keys to sign all transactions that affect shared state. Each user
and transaction-submitting entity has a public key and a private key for signing
transactions. This includes smart contract operations (uploads, configuration,
and changes), as well as transaction-related functions performed by the Splinter
daemon and application-specific services.

Splinter also uses public/private keys to sign operations such
as creating a circuit. For example, the admin service checks the signing key for
each circuit payload and verifies that circuit proposals and votes are signed
with the key of a circuit admin, as described in the next section.

## Circuit Administration

Each Splinter node has one or more circuit admins who can propose new circuits
and vote on circuit proposals. Usually, each node in the circuit has at least
one circuit admin. The Splinter registry stores the public key of each node's
circuit admin (or admins) in the node entry.

**NOTE**: The admins must share their registry entries (either out-of-band or in
an external node registry file) before the circuit can be approved and created.
When creating a circuit, the circuit admin signs the proposal with their
private key (using the `--key` option in the `splinter circuit propose`
command). Each node verifies that this private key corresponds with the public
key that is defined in the registry.

Likewise, the circuit admin's private key is required when voting on a circuit
proposal with the `--key` option in the `splinter circuit vote` command.

For more information, see [Splinter
Registry]({% link docs/0.5/concepts/splinter_registry.md %}) and the man pages
[splinter-circuit-propose(1)]({% link
docs/0.5/references/cli/splinter-circuit-propose.1.md %})
and [splinter-circuit-vote(1)]({% link
docs/0.5/references/cli/splinter-circuit-vote.1.md %}).

## Smart Contract Administration with Scabbard

Each circuit has at least one contract admin who can manage smart contracts for
that circuit

The contract admin (or admins) are defined in a circuit proposal (with
`splinter circuit propose`). The circuit admin includes one or more
`admin_keys` service arguments in the format `--service-arg
*::admin_keys=<public_key>`.

The contract admin can upload new smart contracts, configure new contracts
(create a contract registry, namespace, and namespace permissions), and update
or delete existing contracts. The contract admin also defines owners for the
contract registry and namespace.

* A contract registry owner can update contract versions. When creating a
  contract registry, the contract admin uses `scabbard cr create --owners` to
  specify at least one contract registry owner. To add an owner for an existing
  contract registry, the contract admin uses `scabbard cr update --owners`.

* A namespace owner can change the namespace permissions for the contract. When
  creating the contract namespace, the contract admin uses `scabbard ns create
  --owners` to specify at least one contract registry owner. To add an owner for
  an existing contract namespace, the contract admin uses `scabbard cr update
  --owners`.

For more information, see [Uploading a Smart
Contract]({% link docs/0.5/howto/uploading_smart_contract.md %}),
[the Grid
README](https://github.com/hyperledger/grid/blob/master/examples/splinter/README.md#demonstrate-grid-smart-contract-functionality),
and the man pages
[splinter-circuit-propose(1)]({% link
docs/0.5/references/cli/splinter-circuit-propose.1.md %}),
[scabbard-contract-upload(1)]({% link
docs/0.5/references/cli/scabbard-contract-upload.1.md %}),
[scabbard-cr(1)]({% link docs/0.5/references/cli/scabbard-cr.1.md %}),
[scabbard-ns(1)]({% link docs/0.5/references/cli/scabbard-ns.1.md %}),
and [scabbard-perm(1)]({% link docs/0.5/references/cli/scabbard-perm.1.md %}).

## User and Credential Management with Biome

Biome is the Splinter component that manages the relationship between
user-based data and Splinter's key-based user information. Put simply, Biome
maps user IDs and passwords (or other authentication credentials) to the
public/private keys that the rest of Splinter uses to sign transactions.

Biome isolates all user-based data from the rest of Splinter, using a
Biome-specific database to store the mapping between user data and keys. All
other Splinter functions use only key-based signing to identify actors and
verify that they have permission for the requested operation.

It's important to note that the private keys stored in Biome are encrypted
on the client side; Splinter does not re-encrypt private keys within the REST
API. The client application is responsible for encryption before submitting a
private key. For an example of client-encrypted keys, see the login
functionality in the Gameroom application (as described in
[Gameroom Walkthrough: Behind scene
1](../examples/gameroom/walkthrough/#i-1-behind-scene-1-alice-logs-into-acmes-gameroom-ui).

**NOTE**: Currently, Biome doesn't support integration with an organization's
identity provider (such as Active Directory). As a result, the current version
of Biome is not appropriate for production deployment.
This support is planned for the future. In the meantime, an application could
implement a component that integrates user authentication from the
organization's identity provider with Biome-style approach for mapping users to
keys.

For more information, see [Biome User
Management]({% link docs/0.5/concepts/biome_user_management.md %}).

## Smart Permissions for Organizations and Agents with Pike

Pike is a smart contract in Hyperledger Grid that handles organization and
identity permissions with Sawtooth Sabre. Pike provides organization-specific
business logic for agents (actors within the organization) and roles (sets of
permissions).

The predefined admin role in Pike identifies the user or process who can create
and change agents and roles for that organization. Other roles can be defined by
organization admins or smart contracts as necessary.

Pike runs as WebAssembly (WASM) code, like other smart contracts. Smart
permission data is stored in a portion of the Sabre namespace that other smart
contracts and applications can access, if necessary.

For an example of a smart contract that uses Pike smart permissions, see the
"intkey-multiply" smart contract in Sawtooth Sabre.

For more information, see the [Pike Transaction Family
Specification](https://grid.hyperledger.org/docs/grid/nightly/master/transaction_family_specifications/pike_transaction_family.html),
[Sawtooth Sabre: Smart
Permissions](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/smart_permissions.html),
and [Sawtooth Sabre Application Developer's
Guide](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/application_developer_guide.html).

## Ports and REST API Connections

By default, Splinter uses ports **8044** and **8080** for communication. Other
nodes must be able to connect on port 8044.  Applications and CLIs used to
manage Splinter will connect to the Splinter REST API on port 8080.

Splinter supports several connection protocols for node-to-node communication:

* Transport Layer Security (TLS), using X.509 certificates and associated keys
  for the certificate authority on each Splinter node

* WebSocket secure (WSS) when the application protocol is HTTPS

* Raw TCP (intended for development and testing only)

Currently, the `splinterd` REST API supports authentication with Biome or OAuth,
but does not yet provide authorization (except for the Biome endpoints). Anyone
with access to a Splinter node on port 8080 that can authenticate will have
unrestricted access to the REST API. Endpoint authorization is planned for the
future. In the meantime, protecting port 8080 is recommended, either by blocking
external access or allowing selective access with a mechanism such as a reverse
proxy server or webserver.

For more information, see [Planning a Splinter
Deployment]({% link docs/0.5/howto/planning_splinter_deployment.md %}).
