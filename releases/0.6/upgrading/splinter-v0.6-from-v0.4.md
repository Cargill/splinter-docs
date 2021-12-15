# Upgrading to Splinter v0.6 from Splinter v0.4

Breaking changes and significant changes in this release:

* [`splinter database migrate` default has
  changed](#splinter-database-migrate-default-has-changed)

* [Splinter CLI URL default has
  changed](#splinter-cli-url-default-has-changed)

* [Splinter state now supports SQLite and
  PostgreSQL](#splinter-state-now-supports-sqlite-and-postgresql)

* [Node ID is now stored in SQLite or
  PostgreSQL](#node-id-is-now-stored-in-sqlite-or-postgresql)

* [Local Registry is now backed by SQLite or
  PostgreSQL](#local-registry-is-now-backed-by-sqlite-or-postgresql)

* [Scabbard LMDB state is now stored in SQLite and
  PostgreSQL](#scabbard-lmdb-state-is-now-stored-in-sqlite-and-postgresql)

* [Scabbard has been updated to version
  2](#scabbard-has-been-updated-to-version-2)

* [The Splinter REST API is now secure by
  default](#the-splinter-rest-api-is-now-secure-by-default)

* [AdminProtocolVersion has increased](#adminprotocolversion-has-increased)

* [Default authorization type is now Challenge
  Authorization](#default-authorization-type-is-now-challenge-authorization)

* [Certain updates to circuits are not compatible with
  0.4](#certain-updates-to-circuits-are-not-compatible-with-04)

* [Splinterd Rest API endpoint requires
  protocol](#splinterd-rest-api-endpoint-requires-protocol)

## `splinter database migrate` default has changed

In v0.4 `splinter database migrate` only supported running migrations against
PostgreSQL databases. If a connection string was not provided, the migrations
were run against `postgres://admin:admin@localhost:5432/splinterd` by default.

The `splinter database migrate` command has been updated to also support SQLite
and the default connection url has now been updated to be a SQLite database at
`/var/lib/splinter/splinter_state.db`.

To continue to run migrations against
`postgres://admin:admin@localhost:5432/splinterd` change:

```
$ splinter database migrate
```

to

```
splinter database migrate -C postgres://admin:admin@localhost:5432/splinterd
```

To run SQLite migrations against a different SQLite database, provide the path
to the `-C` option.

## Splinter CLI URL default has changed

In the `splinter` CLI command, the default value for the `--url` parameter has
changed to `"http://127.0.0.1:8080"`.  This matches the default port value of
`splinterd` as set in 0.4.  The previous port value of `8085` was used in
earlier examples and pre-release versions of `splinterd` before the release of
0.4.

If a Splinter node has been configured to run on port 8085 (as in many of the
examples) and is being accessed from localhost, the `--url` parameter (or the
environment variable `SPLINTER_REST_API_URL`) will need to be set to the
appropriate value.

## Splinter state now supports SQLite and PostgreSQL

In v0.4, Splinter circuit and proposal state were by default stored in a YAML
file. By using the `--storage` option state could be changed to in memory. Biome
state could be stored in a PostgreSQL database by providing a URL with the
`--database` option.

In v0.6, Splinter circuit state is now stored in SQLite or PostgreSQL
exclusively. Biome and Splinter state must be stored in the same database. The
`--storage` option is removed.

The new default state database is a SQLite database stored at
`/var/lib/splinter/splinter_state.db`. This location will change based on the
environment variables `SPLINTER_STATE_DIR` and `SPLINTER_HOME`. We will call
this location STATE_DIR in the following sections.

There are two steps to upgrading: Preparing the SQL database for use with
`splinterd` via `splinter database migrate`, and upgrading your existing data
with `splinter upgrade`.

The upgrade subcommand will import all YAML circuit and proposal state from the
files `STATE_DIR/circuits.yaml` and `STATE_DIR/circuit_proposals.yaml` into your
database. It then renames those state files to `circuits.yaml.old` and
`circuit-proposals.yaml.old` respectively.

NOTE: If `splinterd` finds yaml circuit state files that have not been renamed
in this manner, it will abort and inform the user they must run the
`splinter upgrade` command.

To use the default SQLite database:

```
$ splinter database migrate

$ splinter upgrade

$ splinterd
```

The database can be changed to any SQLite file by providing the path to
`--database`

```
$ splinter database migrate -C ./example_state.db

$ splinter upgrade -C ./example_state.db

$ splinterd --database ./example_state.db
```

To use a PostgreSQL database instead, pass the PostgreSQL URL to the commands
prefixed with `postgres://`

```
$ splinter database migrate -C postgres://admin:admin@splinterd-db-acme:5432/splinter

$ splinter upgrade -C postgres://admin:admin@splinterd-db-acme:5432/splinter

$ splinterd --database postgres://admin:admin@splinterd-db-acme:5432/splinter
```

## Node ID is now stored in SQLite or PostgreSQL

In 0.4, the node ID was stored in a text file in the state directory called
`node_id`.

In 0.6, the node ID has been moved to the state database (SQLite or PostgreSQL
depending on configuration). The Splinter daemon will not start if it finds an
existing node ID file. Running the `splinter upgrade` command will move the
existing node ID into the database.

## Local Registry is now backed by SQLite or PostgreSQL

In 0.4, the local registry was stored as a YAML file in the state directory
called `STATE_DIR/local_registry.yaml`.

In 0.6, the local registry YAML file has been replaced with either a SQLite or
PostgreSQL backend. Registry state is stored in the same database as circuit
state and biome state mentioned previously.

If you are upgrading from 0.4 and need to include node information from the YAML
registry file, when starting up `splinterd`, include the old
`local_registry.yaml` file as a read only registry. This will add the node
information to the unified registry.

```
$ splinterd --registries STATE_DIR/local_registry.yaml
```

## Scabbard LMDB state is now stored in SQLite and PostgreSQL

In 0.4, for each Scabbard instance the merkle state and transaction receipts
were stored in seperate LMDB files in the state directory. The merkle state also
included the current state root hash.

In 0.6, the current state root hash is now stored in the SQLite or PostgreSQL
state database. Transaction receipts have also been moved into the state
database. Merkle state can be configured to either remain in LMDB files or be
stored in the state database.

The state root hash and the transaction receipts will be moved into the database
when running the `splinter upgrade` command.

The scabbard merkle state is assumed to be in the database unless the following
is added to the `splinterd` command:

```
$ splinterd --scabbard-state lmdb
```

The Splinter daemon will not start if scabbard state is found in the location
that is not configured, for example if LMDB files exist when the state should be
stored in the SQLite or PostgreSQL state database. Any existing state can be
migrated to or from LMDB files using the `splinter state migrate` command. The
old merkle data will be deleted on the completion of the migration. This command
requires the connection URI for the state database and the state directory where
the LMDB files can be found if it is not in the default location.

```
$ splinter state migrate --in lmdb --out /var/lib/splinter/splinter_state.db
```

## Scabbard has been updated to version 2

Version 2 of the scabbard service has been introduced in Splinter 0.6. This new
version of scabbard is not compatible with the old version; this means that a
scabbard v2 service cannot work on the same circuit as a scabbard v1 service.

Splinter 0.6 supports backwards compatibility for scabbard v1. When upgrading to
Splinter 0.6, any existing scabbard services will continue to work as they did
before. New circuits created using the scabbard circuit template provided by the
Splinter CLI will create scabbard v2 services.

If a Splinter 0.6 node and a Splinter 0.4 node need to create a new circuit with
scabbard v1 services, the circuit will need to be proposed manually (without the
  scabbard circuit template).

## The Splinter REST API is now secure by default

In 0.4, the Splinter REST API did not require authentication and authorization.

Splinter 0.6 provides a secure REST API for managing circuits, submitting
transactions, reading state, and a variety of other operations. Clients must
authenticate and be granted permissions to use the various `splinterd`
endpoints, which requires some setup. For more information on how to configure
this see [Configuring REST API Authorization]({% link
docs/0.6/howto/configuring_rest_api_authorization.md %}).

If you were using Biome in 0.4, the only change required is to update the biome
flag provided to `splinterd`. It has been changed from `--enable-biome` to
`--enable-biome-credentials`

```
$ splinterd --enable-biome-credentials
```

## AdminProtocolVersion has increased

In 0.4, the AdminProtocolVersion was set to 1.

In 0.6, due to several changes in the circuit API the AdminProtocolVersion is
now set to 2. If you have a client that is compatible with 0.4, make sure to set
the SplinterProtocolVersion header to 2.

To see the updated API see the [REST API
reference](https://www.splinter.dev/docs/0.6/api/#tag/Admin-Service)

## Default authorization type is now Challenge Authorization

When Splinter nodes connect, they must go through a “handshake” to verify the
identity of the other node.

In 0.4, Trust Authorization is the only authorization algorithm implemented.
Trust Authorization takes the identity provided from the node without further
verification.

In 0.6, the default authorization type has been updated to Challenge
Authorization. Challenge Authorization requires a node’s ID to be tied to a
public key/private key pair and a node must prove they have access to that key
by signing a random nonce, providing the resulting signature and their public
key.

This requires that a `splinterd` has its own system key that will be used for
identification. The key must be stored in the `SPLINTER_CONFIG_DIR/keys/`
directory. If multiple keys exist in this location, all of them will be loaded
into `splinterd` and can be used for Challenge Authorization. To create this key
run:

```
$ splinter keygen --system
```

When creating a circuit with the CLI, the public keys for the other members must
be known and provided. Use `--node-public-key` for each node:

```
$ splinter circuit propose \
    --node n20959::tcp://127.0.0.1:18044 \
    --node n8198::tcp://127.0.0.1:28044 \
    --node-public-key n20959::0372a7ee5e43a241fb0d622e02a53797507d1b4d289286577157b1ed72a82a6edd \
    --node-public-key n8198::02bf74d9263327a571763c6557f50d7995bf3dec86387fc8e5f9f75a74b15919a4 \
    . . .
```

To continue using Trust authorization, set `--auth-type trust` when proposing
the circuit.

If using `--peers` on `splinterd` to connect to other nodes without a circuit,
Challenge Authorization will be used as default also. You can change the key
that it is used for this authorization with `--peering-key`. It must be a key
stored in SPLINTER_CONFIG_DIR/keys/. If you are trying to connect to to a 0.4
node and need to use trust, append `+trust` to the protocol prefix.

```
$ splinterd \
    --peering-key other_key \
    --peers tcp://127.0.0.1:8000 \
    --peers tcp+trust://127.0.0.1:8001 \
    . . .
```

## Certain updates to circuits are not compatible with 0.4

Several new features have been added to circuits, for example Challenge
Authorization and display names. These updates however are not compatible with
0.4 nodes. To make it easier to create 0.4 compatible nodes, there is the
`--compat` flag that can be provided to `splinter circuit propose` which will
error if invalid options are provided.

For example if the following command was run:

```
$ splinter \
    circuit propose \
    --display-name circuit01 \
    --node n20959::tcp://127.0.0.1:18044 \
    --node n8198::tcp://127.0.0.1:28044 \
    --service a000::n20959 \
    --service b000::n8198 \
    --service-peer-group b000,a000 \
    --service-arg "*::admin_keys=038684ef88607ca0e5175fe31b7d94f65b30dc27ef838845f0496eb9c1126c8c82" \
    --service-type "*::scabbard" \
    --management manual \
    --auth-type trust \
    --compat 0.4
```

The following error would be provided:

`ERROR: Subcommand encountered an error: Display name is not compatible with
Splinter v0.4`

To be 0.4 compatible the service arg also must be provided in a JSON list:
`--service-arg *::admin_keys="[\"$(cat /config/keys/beta.pub)\"]" `

## Splinterd Rest API endpoint requires protocol

In 0.4, the `--rest-api-endpoint` option would accept a URL without a protocol.
For example, `--rest-api-endpoint 127.0.0.1:8080`.

In 0.6, the URL must include the protocol. Add `http` to the URL.

```
$ splinterd --rest-api-endpoint http://127.0.0.1:8080
```
