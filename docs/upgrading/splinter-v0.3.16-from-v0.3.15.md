# Upgrading to Splinter v0.3.16 from Splinter v0.3.15

Breaking changes and significant changes in this release:

* [Node registry configuration options for splinterd have
  changed](#node-registry-configuration-options-for-splinterd-have-changed)

* [Protocol prefix for TLS transport has
  changed](#protocol-prefix-for-tls-transport-has-changed)

* [The transport option has been removed from
  splinterd](#the-transport-option-has-been-removed-from-splinterd)

* [Splinter nodes now have multiple
  endpoints](#splinter-nodes-now-have-multiple-endpoints)

* [The `splinterd` TLS options are now prefixed with
  tls](#the-splinterd-tls-options-are-now-prefixed-with-tls)

* [The `splinterd` admin timeout now takes
  seconds](#the-splinterd-admin-timeout-is-now-specified-in-seconds)

## Node registry configuration options for splinterd have changed

In previous releases, the node registry consisted of a single YAML file that was
specified with the `splinterd` configuration settings `registry_backend` and
`registry_file`. This YAML file was the only source that the node registry used
to provide node data.

In release v0.3.16, the node registry has received a significant update: the
registry can now pull node data from multiple sources. `splinterd` maintains an
internal registry file that it uses for storing nodes that are added or modified
via the `splinterd` REST API's `/admin/nodes` endpoints. Additionally,
`splinterd` can pull node data from external, read-only registry files. The data
from external registry files is merged with the data from the internal registry
file, then presented as a single, unified node registry.

To support this update, the following changes have been made to `splinterd`
configuration:

* Removed the `registry_backend` and `registry_file` configuration settings,
  along with the `--registry-backend` and `--registry-file` command options.
* Added the `registries` configuration setting (and the `--registry` command
  option) for specifying pre-populated node files.

As a result, the internal node file maintained by `splinterd` is no longer
configurable. This file is now located in the Splinter state directory and
should not be set or modified directly, since it is considered part of
`splinterd` internal state.

### Command and configuration file changes

* Use the `registries` configuration setting or  `--registry` command option to
  add external, read-only node registry files for `splinterd`. These files must
  be valid YAML node files that are accessible on the local file system or
  remotely via HTTP(S). Local files must be prefixed with `file://`, and remote
  files must be prefixed with `http://` or `https://`.

* If your configuration file previously specified the location of the node
  registry file with the `registry_backend` or `registry_file` config options,
  remove these configuration options. If a pre-populated registry is required,
  use the `registries` config .

For example, the following `splinterd` command includes nodes from registry
files located at `/tmp/nodes.yaml` and
`https://www.github.com/org/repo/nodes.yaml`:

```
$ splinterd …
     --registry file:///tmp/nodes.yaml \
     --registry https://www.github.com/org/repo/nodes.yaml \
     ...
```

To specify these registry files in a `splinterd` TOML config file, use the
following syntax:

```
registries = ["file:///tmp/nodes.yaml", "https://www.github.com/org/repo/nodes.yaml"]
```

## Protocol prefix for TLS transport has changed

In previous releases, the TLS transport accepted the protocol prefix `tls://`.

In release v0.3.16, this prefix has been changed to `tcps://` for consistency.
Now, the TCP and TLS prefixes (`tcp://` and `tcps://`) match the WebSocket
prefix (`ws://`) and planned WebSocket TLS (`wss://`). The old prefix, `tls://`,
is still supported but is considered deprecated.

All commands and configuration files specifying an endpoint that starts with
"tls://" should be updated to "tcps://".  For example, when proposing a circuit,
the `-node` options should use the new prefix:

    ```
    $ splinter circuit propose \
           … \
           --node alpha-node-000::tcps://splinterd-alpha:8044 \
           --node beta-node-000::tcps://splinterd-beta:8044 \
           … \
    ```

Endpoints in the node registry should use the new prefix (as well as the new
list format described elsewhere). For example:

```
- identity: ...
  endpoints:
    - 'tcps://splinterd-node-alpha:8044'
  ...
```

### The transport option has been removed from splinterd

In previous releases, the connection type for `splinterd` could be set to either
TCP (the default) or TLS, using the  `splinterd` `transport` configuration
setting or `--transport` command option. The argument `tls` would configure TLS;
using `raw` would configure TCP.

In release 0.3.16, the `transport` setting and `--transport` option have been
removed. Instead, `splinterd` supports communication over different transport
types at the same time and automatically configures all available transport
types. By default, TCP and TLS are available, as well as the internal "inproc"
type.  The WebSocket type `ws://` is included if `splinterd` is compiled with
the experimental "ws-transport" Rust feature.

Supported protocol prefixes are:

`tcp:// ` for TCP connections
`tcps://` for TLS connections
`ws://` for WebSocket connections (available with the experimental
"ws-transport" Rust feature)

If an endpoint does not have a protocol prefix, the connection will default to
TCP.

This release also adds a `--no-tls` flag for the `splinterd` command. If the
correct TLS certificates and keys are not available when creating the TLS
connection, `splinterd` will exit with an error. To skip enabling TLS
(`TlsTransport`) connections, add the `--no-tls` flag when starting `splinterd`.

For example, if you started splinterd in a previous release with
`--network-endpoint 127.0.0.1:804`, you should add the `tcps://` prefix, like
this:  

```
splinterd ... --network-endpoint tcps://127.0.0.1:8084 …
```

As described above, `splinterd` now supports communication over multiple
transport types at the same time. For example, the following options would
configure `splinterd` to accept connections on both the TLS connection at
127.0.0.1:8084 and the TCP connection at 127.0.0.1:8094.

```
splinterd … --network-endpoint tcps://127.0.0.1:8084 -network-endpoint tcp://127.0.0.1:8094 ...
```

To configure `splinterd` to support only TCP connections, use the `tcp://`
prefix and the `--no-tls` option, like this:

```
splinterd ... test --network-endpoint tcp://127.0.0.1:8084 --no-tls ...
```

## Splinter nodes now have multiple endpoints

In release v0.3.16, Splinter nodes now support multiple network endpoints for
connections from other nodes.  This change impacts a variety of components,
including the node registry, circuit proposals, circuit definitions, REST API
responses, and `splinterd` configuration settings and options.

* For existing node registries, each node entry must change the `endpoint` field
to `endpoints` and update the contents of the field to a list. For example, if
you had the following node definition in a registry YAML file:

    ```
    - identity: ..
      endpoint: "tcps://127.0.0.1:8080"
      ...
    ```

  Update the endpoint definition like this:

    ```
      - identity: ...
        endpoints:
          - "tcps://127.0.0.1:8080"
      ...
    ```

* Existing circuit definitions do not need to be updated manually; Splinter
  handles this automatically.

* Existing circuit proposals must be deleted and reissued.

    - First, note the content of the existing circuit proposal. See the
      `circuit_proposals.yaml` file in the Splinter state directory (default:
      `/var/lib/splinter`).

    - Next, remove the `circuit_proposals.yaml` file from Splinter's state
      directory. If using the default state directory (`/var/lib/splinter`),
      you can remove circuit proposals with this command:

      ```
      $ rm /var/lib/splinter/circuit_proposals.yaml
      ```

    - Finally, reissue the circuit proposal with the `splinter circuit propose`
      command.

* To accommodate the REST API response changes, update response handling for
  node-related responses to use the `endpoints` field instead of `endpoint`, and
  treat the field as an array of strings rather than a string.

* For `splinterd` TOML configuration files, replace the `network_endpoint` field
  with the `network_endpoints` field in the correct format. For example, if you
  have the following entry:

    ```
    ...
    network_endpoint = "127.0.0.1:8044"
    ...
    ```

Replace this entry with:

```
...
network_endpoints = ["127.0.0.1:8044"]
...
```

* The `splinterd` command option `--network-endpoint` has not changed. You can
specify multiple endpoints in a comma-separated list or repeat the option for
each endpoint.

## The splinterd TLS options are now prefixed with tls

Several `splinterd` configuration settings and command options have added a
`tls` prefix. In addition, the configuration setting to provide a trust CA
certificate is now `tls_ca_file`, instead of `ca_cert`(so that the setting name
matches the command option).

| OLD SETTINGS AND OPTIONS   | NEW SETTINGS AND OPTIONS           |
|----------------------------|------------------------------------|
| ca_file, --ca-file         | tls_ca_file, --tls-ca-file         |
| cert_dir, --cert-dir       | tls_cert_dir, --tls-cert-dir       |
| client_cert, --client-cert | tls_client_cert, --tls-client-cert |
| client_key, --client-key   | tls_client_key, --tls-client-key   |
| server_cert, --server_cert | tls_server_cert, --tls-server-cert |
| server_key, --server-key   | tls_server_key, --tls-server-key   |
| insecure, --insecure       | tls_insecure, --tls-insecure       |
                    |

Use the new command options when starting `splinterd` on the command line and in
Docker Compose files.

Update existing `splinterd` TOML configuration files to use the changed options.
For example:

```
# List of certificate authority certificates (*.pem files).
tls_ca_file = "certs/ca.pem"

# A certificate signed by a certificate authority.
# Used by the daemon when it is acting as a client
# (sending messages).
tls_client_cert = "certs/client.crt"

# Private key used by daemon when it is acting as a client.
tls_client_key = "certs/client.key"

# A certificate signed by a certificate authority.
# Used by the daemon when it is acting as a server
# (receiving messages).
tls_server_cert = "certs/server.crt"

# Private key used by daemon when it is acting as a server.
tls_server_key = "certs/server.key"
```

Note: The old options and configuration settings are now supported aliases, so
old configuration files and docker-compose files will continue to work, but the
matching options are hidden.

## The splinterd admin timeout is now specified in seconds

For `splinterd`, the `admin_timeout` configuration setting and `--admin-timeout`
command option sets the coordinator timeout for the admin service. This setting
affects consensus-related activities for pending circuit changes (functions
that use the two-phase commit agreement protocol in the Scabbard service).

In previous releases, the timeout was specified in milliseconds, with a default
of 30000 ms.

In release 0.3.16, the timeout argument is specified in seconds, with default of
30 seconds. This change was made for consistency with the unit of time used by
the `heartbeat_interval` setting (and `--heartbeat` option).

For existing `splinterd` configuration files that use this option, update the
value from milliseconds to seconds.
