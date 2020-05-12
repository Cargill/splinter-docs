# Upgrading to Splinter v0.3.17 from Splinter v0.3.16

Breaking changes in this release:

* [Name changes for splinterd CLI options and config settings](#name-changes-for-splinterd-cli-options-and-config-settings)

* [The key registry and node registry have been combined](#the-key-registry-and-node-registry-have-been-combined)

* [Circuit connections start with agreement on protocol version](#circuit-connections-start-with-agreement-on-protocol-versions)

* [Scabbard has been moved to its own crate](#scabbard-has-been-moved-to-its-own-crate)

* [The Splinter registry REST API routes have been moved](#the-splinter-registry-rest-api-routes-have-been-moved)

* [Gameroom startup has changed because Gameroom uses Biome](#gameroom-startup-has-changed-because-gameroom-uses-biome)

## Name changes for splinterd CLI options and config settings

Several `splinterd` configuration settings and CLI command options have been
changed to be consistent. All option names match the config setting names,
except that options use a dash separator and config settings use an underscore.

| OLD CONFIGURATION SETTINGS       |NEW CONFIGURATION SETTINGS |
|----------------------------------|---------------------------|
| admin_service_coordinator_timeout| admin_timeout             |
| bind                             | rest_api_endpoint         |
| heartbeat_interval,              | heartbeat                 |
| registry_auto_refresh_interval   | registry_auto_refresh     |
| registry_forced_refresh_interval | registry_forced_refresh   |

| OLD COMMAND-LINE OPTIONS | NEW COMMAND-LINE OPTIONS  |
|--------------------------|---------------------------|
| --advertised-endpoint    | --advertised-endpoints    |
| --bind                   | --rest-api-endpoint       |
| --network-endpoint       | --network-endpoints       |
| --peer                   | --peers                   |
| --registry               | --registries              |

IMPORTANT:

* Use the new command options when starting `splinterd` on the command line and
  in Docker Compose files.

* Update existing `splinterd` TOML configuration files to use the changed
  options. For example:

  ```
  # Config file format version
  version = "1"

  node_id = "012"

  # Endpoint used for service to daemon communication.
  service_endpoint = "127.0.0.1:8043"

  # Endpoints used for daemon to daemon communication.
  network_endpoints = ["tcps://127.0.0.1:8044"]

  # How often to sent a heartbeat to connections
  heartbeat = 30  
  ```

## The key registry and node registry have been combined

In v0.3.16, the key registry has been entirely removed from Splinter, and the
node registry is now called the "Splinter registry" because it includes key
information. Instead of using a separate key registry, each node definition in
the registry must have a `keys` entry that lists the public key or keys that are
permitted to propose and modify circuits on behalf of that node.

Update existing Splinter registry files to include the public key or keys that
are allowed to modify circuits on behalf of each node. All nodes must have at
least one public key.

When the nodes in the registry file(s) have been updated with the appropriate
keys, remove the key registry file configuration(s) from your splinter nodes.
All key registry-related configuration and CLI options are no longer supported.

In the previous release, a node registry entry had the following format:

```
- identity: '<NODE_ID>'
  endpoints:
    - '<PROTOCOL>://<HOSTNAME>:<PORT>'
  display_name: '<NODE_NAME>'
  metadata: {}
```

In this release, a registry entry has the following format:

```
- identity: '<NODE_ID>'
  endpoints:
    - '<PROTOCOL>://<HOSTNAME>:<PORT>'
  display_name: '<NODE_NAME>'
  keys:
      - '<KEY>'
  metadata: {}
```

The following example shows Acme Corporation's registry entries for two nodes,
`acme-node-000` and `acme-node-001`. Each entry includes the keys that are
permitted to propose and modify circuits on behalf of that node.  

```
- identity: 'acme-node-000'
  endpoints:
    - 'tcps://acme-node-000:8044'
  display_name: 'Acme Node 0'
  keys:
'02381b606ac2bbe3bd374654cb7cb467ffb0225eb46038a5ec37b43e0c2f085dcb'
  metadata: {}
- identity: 'acme-node-001'
  endpoints:
    - 'tcps://acme-node-001:8044'
  display_name: 'Acme Node 1'
  keys:
'7b6c889058c2d22558ead2c61b321634b74e705c42f890e6b7bc2c80abb4713118'
'02381b606ac2bbe3bd374654cb7cb467ffb0225eb46038a5ec37b43e0c2f085dcb'
  metadata: {}
```

## Circuit connections start with agreement on protocol version

A circuit connection between two Splinter nodes now includes a new request and
response so that the admin services can agree on the protocol version to use for
communication. This agreement must occur before any circuit management payloads
can be handled.

The connecting admin service (the service on the node initiating the connection)
sends a request that specifies the minimum and maximum protocol versions it can
support. The other admin service responds with its highest supported version in
the connecting service's range. If there is no compatible protocol version, the
payload will be dropped.

This change allows the admin services to know if they are running compatible
versions of Splinter software. It also makes it possible to support older
protocol versions in the future, with the ability to downgrade the protocol
version to support nodes running older Splinter software.

IMPORTANT: This is a breaking change that affects all nodes on a circuit. All
Splinter nodes must be running release v0.3.17 before they attempt circuit
connections. If some nodes are outside of your control, coordinate the upgrade
with the administrators of other nodes.  

If the two nodes attempt a circuit connection but one is running v0.3.16 (or
earlier), the connection will hang or fail. For example, if the connecting
node is running release v0.3.17 and the other node is running release v0.3.16,
the older admin service cannot send the required protocol response message, so
later circuit payload messages will not be handled. In some cases, the older
admin service will crash because of a known bug when it receives a message it
cannot understand. (This bug has been fixed in v0.3.17; the admin service now
logs an error message that an unknown message was received but does not
crash.)

## Scabbard has been moved to its own crate

The scabbard service, scabbard client, and all associated scabbard code have
been moved from the `splinter` crate to the newly created `scabbard` crate.
Additionally, the optional feature for compiling in the scabbard client has been
renamed from `scabbard-client` to `client`.

Any code that uses the scabbard service or its client should add the new
`scabbard` crate as a dependency. When using the scabbard client, compile with
the `client` feature for the `scabbard` crate. The location of the various
scabbard components differs slightly in the new crate, so some imports will need
to be updated as well; see the
[scabbard documentation](https://docs.rs/scabbard) for details.

## The Splinter registry REST API routes have been moved

In v0.3.16, the REST API routes for retrieving node information from the
Splinter registry were located at `/admin/nodes` In v0.3.17, these routes have
been moved to `/registry/nodes` to more accurately represent their place in the
Splinter ecosystem (they are provided by the registry, not the admin service).

All calls to the `/admin/nodes` endpoints should be updated to call
`/registry/nodes` instead.

## Gameroom startup has changed because Gameroom uses Biome

The Gameroom daemon, `gameroomd`, now uses Biome for user and credential
management. This means that a new "migrate database" step is required to
populate the Biome tables in the database. In addition, the Splinter nodes
backing `gameroomd` need to be run with Biome enabled and must be connected to a
database.

Gameroom's example docker-compose files have been updated to migrate the
database and start `splinterd` correctly. If you start Gameroom manually, note
the following changes:

* Run the `splinter database migrate` command to populate the correct Biome
tables in the database. For more information, see the
`splinter-database-migrate(1)` man page or run
`splinter database migrate --help`.

* Start `splinterd` with the `--enable-biome` flag and specify the database URL
with the `--database` option. For more information, see the `splinterd(1)` man
page or run `splinterd --help`.
