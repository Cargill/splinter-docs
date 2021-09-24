# Splinter Registry

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Circuit creation is an important activity for Splinter administrators. Part of
creating a circuit is to specify the Splinter nodes that will be members of the
new circuit; to do this, admins need some way to find the nodes. The Splinter
registry feature enables administrators to easily find the nodes they're looking
for.

## What is a registry?

A Splinter registry (or just "registry") is a list of nodes that can be browsed
(and sometimes directly managed) by an administrator. Data for each of the nodes
in the registry include:

* Display name
* Node ID
* List of network endpoints
* List of public keys associated with the node
* Arbitrary metadata

Registries may provide node data from a variety of sources, including local and
remote files, databases, and even other registries, as is the case with the
unified registry.

## Unified Registry

<img alt="Splinter registry admin diagram" src="/docs/0.5/images/registry_admin_diagram.svg">

The Splinter daemon (splinterd) uses a **unified registry**, which aggregates
data from multiple "source" registries. There are two types of sources:

* The **internal registry** is a local, modifiable list of nodes that belongs
  solely to the Splinter daemon and is stored in the configured database. A
  unified registry has only one internal registry. All modifications to the
  unified registry, like adding or updating a node definition, are stored in the
  internal registry. For more information, see
  [Configuring Splinter Daemon
  Database]({% link docs/0.5/howto/configure_database_storage.md %}).

* **External registries** are, as the name implies, managed externally. They are
  read-only to the unified registry, and they cannot be modified using the
  registry APIs. A unified registry may have zero or more external registries.

### Data Merging and Precedence

The unified registry merges data from its internal and external registries,
presenting a single, aggregated view of all the data.

If a node with the same ID exists in multiple sources, the definition of the
node from the highest-precedence registry is used. The internal registry has the
highest precedence; the precedence of the external registries is determined by
the order in which they're specified (see
[Configuring the splinterd Registry](#configuring-the-splinterd-registry) to
learn how external registries are configured).

Node metadata (arbitrary key/value pairs associated with a node)
is merged from all sources; if a node with the same ID exists in multiple
sources, the metadata for that node is merged from all of them. If the same
metadata key is set for a node in multiple registries, precedence is determined
in the same way as node definitions.

### Recommended Patterns

External registries are the recommended way to manage lists of known Splinter
nodes because they can be shared in a consistent way across a Splinter network.
The internal registry is only available on the local Splinter node, so any data
added, modified, or removed from it will not be reflected on other nodes. This
can be useful in some cases, but generally it's desirable for node data to be
consistent across the network.

While most node data is static, it is sometimes necessary to modify the
properties of a node that's defined in an external registry. This can be done
using the internal registry, but it's usually better to modify the external
registry directly.

If an external registry is modified (the file is edited or the database is
updated), the unified registry will detect the changes and update the
information it provides. How external changes are detected and loaded by the
unified registry depends on the type of external registry.

### Types of External Registries

There are currently two external registry implementations provided by Splinter:

* **Local YAML files** exist on the filesystem. The local file is cached in
  memory, so if the file is removed or becomes unavailable, its contents will
  remain available as long as the Splinter node is running. Any changes made
  directly to the file will be immediately detected by the unified registry.

* **Remote YAML files** are accessed over HTTP and cached to a local YAML file;
  if the remote file becomes unavailable, its contents from the last successful
  read will continue to be available, even across restarts. Changes made to
  remote files are fetched periodically; see
  [Configuring Remote YAML File Refreshes](#configuring-remote-yaml-file-refreshes)
  for details on how this works.

Local and remote YAML files contain arrays of nodes, where each node definition
provides all required fields and some optional metadata:

``` yaml
- identity: "Node1"                       # Required, must not be empty
  endpoints:                              # At least one endpoint is required
    - "tcps://123.0.0.123:8080"           # Must not be empty
  display_name: "Bitwise IO - Node 1"     # Required, must not be empty
  keys:                                   # At least one key is required
    - "000000000000000000000000000000000" # Must not be empty
  metadata:                               # May be empty
    company: "Cargill"
...
```

## Configuring the splinterd Registry

The external registries that will be used by splinterd are configured using the
`--registries` CLI option and the `registries` config file setting. Each
external registry is specified with a URL:

* For remote YAML files, the URL should begin with `http://` or `https://`.
* For local YAML files, the URL should be the path to the file on the local
  filesystem, prefixed with `file://`.

When using the CLI option, registries can be specified either as a
comma-separated list, or with multiple uses of the option. These examples are
equivalent:

``` console
$ splinterd ... \
  --registries file:///path/to/local_registry.yaml,https://www.example.com/remote_registry.yaml \
  ...
```

``` console
$ splinterd ... \
  --registries file:///path/to/local_registry.yaml \
  --registries https://www.example.com/remote_registry.yaml \
  ...
```

When using the config file option, the registries should be specified as a TOML
array. This example is equivalent to the CLI examples:

``` toml
registries = ["file:///path/to/local_registry.yaml, https://www.example.com/remote_registry.yaml"]
```

### Configuring Remote YAML File Refreshes

The splinter daemon periodically checks remote YAML files for changes in two
ways:

The splinter daemon provides two options for configuring the behavior of remote
YAML file registries:

* **Automatic refresh**: The remote file is fetched in the background at a
  regular interval of time. This interval is configured with the
  `--registry-auto-refresh` CLI option and `registry_auto_refresh` config file
  setting. The default value is 600 seconds (10 minutes).

* **Forced refresh**: After a period of time since the last refresh, the
  next read operation will fetch the remote file; this is similar to cache
  invalidation. The forced refresh time is configured with the
  `--registry-forced-refresh` CLI option and `registry_forced_refresh` config
  file setting. The default value is 10 seconds.

Both the automatic refresh interval and the forced refresh time options take the
number of seconds as an argument. These CLI and config file examples are
equivalent:

``` console
$ splinterd ... \
  --registries https://www.example.com/remote_registry.yaml \
  --registry-auto-refresh 60 \
  --registry-forced-refresh 5 \
  ...
```

``` toml
registries = ["https://www.example.com/remote_registry.yaml"]
registry_auto_refresh = 60
registry_forced_refresh = 5
```

For more information on how the automatic and forced refreshes work, see the
[Remote YAML Registry Rust documentation](https://docs.rs/splinter/0.5/splinter/registry/struct.RemoteYamlRegistry.html).

## Accessing and Updating the Unified Registry

The splinter daemon's unified registry can be accessed via the REST API. The
following registry endpoints are provided by splinterd:

* `POST /registry/nodes` adds a node to the registry
* `GET /registry/nodes` lists nodes in the registry
* `GET /registry/nodes/{identity}` fetches a node in the registry by its
  identity
* `PUT /registry/nodes/{identity}` adds or replaces a node in the registry
* `DELETE /registry/nodes/{identity}` deletes a node from the registry

For more information, see the
<a href="/docs/0.5/api/#tag/Splinter-Registry" target="_blank">
Splinter registry routes REST API reference
</a>.

Any changes made to the unified registry will be saved to its internal registry.
These changes will be persisted across splinterd restarts.
