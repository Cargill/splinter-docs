# Generating Insecure Certificates for Development

This document describes how to use the `splinter` CLI to generate certificates
for running the Splinter daemon in a development environment.

The Splinter daemon can be run with raw TCP connections or with TLS connections.
When developing against Splinter, you might want to run in TLS mode without the
effort of getting valid X.509 certificates from a certificate authority. If so,
you can use the `splinter` CLI to generate insecure certificates and the
associated keys.

The `splinter cert generate` command creates the following certificates and
keys:
  - `client.crt`
  - `client.key`
  - `server.crt`
  - `server.key`
  - `generated_ca.pem`
  - `generated_ca.key`

> **Note:** The `generated_ca` files will be used to create the development
> client and server certificates. Do not use these files as the trusted
> certificate authority.

This command writes the files to the default Splinter certificate directory,
`/etc/splinter/certs/`. To use a different directory (for example, if you
already have valid certificate files in this directory), you can change the
location by setting the `SPLINTER_CERT_DIR` environment variable or using the
`--cert_dir` option on the command line.

## Prerequisites

This procedure requires a local development environment that includes the
`splinter` CLI and the Splinter daemon (`splinterd`).

## Procedure

1. Open a terminal window and navigate to the location of the `splinter` CLI
   on your local machine.

1. If you want to change the default certificate directory, set the
   `SPLINTER_CERT_DIR` environment variable. (Otherwise, you could
   use the `--cert_dir` option with the `splinter` and `splinterd`
   commands in this procedure.)

1. Run the following command to generate certificates and keys.

   ```
   $ splinter cert generate
   ```

   The output shows the full path of each file.

   ```
   Writing file: /etc/splinter/certs/generated_ca.pem
   Writing file: /etc/splinter/certs/private/generated_ca.key
   Writing file: /etc/splinter/certs/client.crt
   Writing file: /etc/splinter/certs/private/client.key
   Writing file: /etc/splinter/certs/server.crt
   Writing file: /etc/splinter/certs/private/server.key
   ```

   Tip: To change the common name of the certificates, use the `--common-name`
   flag. Otherwise, the common name will default to `localhost`.

1. Start the Splinter daemon in TLS mode with the following `splinterd` command.

   The `--insecure` flag turns off certificate authority validation (because the
   generated certificates are not signed by a common certificate authority).
   Without this flag, the Splinter daemon will get a TLS error when it tries to
   connect to another Splinter node.

   ```
   $ splinterd --node-id node-000 --transport tls --insecure
   [2020-02-04 15:40:29.763] T["main"] WARN [splinterd] Starting TlsTransport in insecure mode
   ```

   * You can specify the generated certificate directory by using the
    `--cert-dir` option, setting `SPLINTER_CERT_DIR` environment variable, or
    setting the location in the splinterd config, `splinterd.toml`. If
    necessary, you can specify each file separately with the command-line option
    or in the config file.

   * When the Splinter daemon starts, it logs a warning message that TLS
     has started in insecure mode. To verify that the correct certificates and
     keys were used, add `-vv` to increase the logging level.

   ```
   $ splinterd --node-id node-000 --transport tls --insecure -vv

   .
   .
   [2020-02-13 08:50:30.574] T["main"] DEBUG [splinterd] Loading configuration file
   [2020-02-13 08:50:30.592] T["main"] DEBUG [splinterd::config] Config: storage: yaml (source: Default)
   [2020-02-13 08:50:30.592] T["main"] DEBUG [splinterd::config] Config: transport: tls (source: CommandLine)
   [2020-02-13 08:50:30.592] T["main"] WARN [splinterd::config] Starting TlsTransport in insecure mode
   [2020-02-13 08:50:30.592] T["main"] DEBUG [splinterd::config] Config: cert_dir: /etc/splinter/certs/ (source: Default)
   [2020-02-13 08:50:30.592] T["main"] DEBUG [splinterd::config] Config: client_cert: /etc/splinter/certs/client.crt (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: client_key: /etc/splinter/certs/private/client.key (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: server_cert: /etc/splinter/certs/server.crt (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: server_key: /etc/splinter/certs/private/server.key (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: service_endpoint: 127.0.0.1:8043 (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: network_endpoint: 127.0.0.1:8044 (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: peers: [] (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: node_id: node-000 (source: CommandLine)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: bind: 127.0.0.1:8080 (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: registry_backend: FILE (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: registry_file: /etc/splinter/nodes.yaml (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: state_dir: /var/lib/splinter/ (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: heartbeat_interval: 30 (source: Default)
   [2020-02-13 08:50:30.593] T["main"] DEBUG [splinterd::config] Config: admin_service_coordinator_timeout: 30s (source: Default)
   [2020-02-13 08:50:30.615] T["main"] DEBUG [splinterd::daemon] Listening for peer connections on tls://127.0.0.1:8044
   [2020-02-13 08:50:30.615] T["main"] DEBUG [splinterd::daemon] Listening for service connections on tls://127.0.0.1:8043
   [2020-02-13 08:50:30.615] T["main"] INFO [splinterd::daemon] Starting SpinterNode with ID node-000
   .
   .
   ```

     With verbose logging, the Splinter daemon will log a debug message
     with the configuration used to start the daemon, including the location of
     the client and server certificate and keys.

## Troubleshooting

  If any certificate files already exist, `splinter cert generate` displays an
  error and stops. It does not create any new files.

  ```
  $ splinter cert generate

  Client certificate already exists: /etc/splinter/certs/client.crt
  Client key already exists: /etc/splinter/certs/private/client.key
  Server certificate already exists: /etc/splinter/certs/server.crt
  Server key already exists: /etc/splinter/certs/private/server.key
  CA certificate already exists: /etc/splinter/certs/generated_ca.pem
  CA key already exists: /etc/splinter/certs/private/generated_ca.key
  ERROR: action encountered an error: Refusing to overwrite files, exiting
  ```

  To create missing certificates and keys when some files already
   exist, add the `--skip` flag. The command will ignore the existing
   files and create any files that are missing.

  ```
  $ splinter cert generate --skip

  Client certificate exists, skipping: /etc/splinter/certs/client.crt
  Client key exists, skipping: /etc/splinter/certs/private/client.key
  Server certificate exists, skipping: /etc/splinter/certs/server.crt
  Server key exists, skipping: /etc/splinter/certs/private/server.key
  CA certificate exists, skipping: /etc/splinter/certs/generated_ca.pem
  CA key exists, skipping: /etc/splinter/certs/private/generated_ca.key
  ```

  To recreate the certificates and keys from scratch, use the  `--force` flag to
  overwrite all existing files.

  ```
  $ splinter cert generate --force

  Overwriting file: /private/etc/splinter/certs/generated_ca.pem
  Overwriting file: /private/etc/splinter/certs/private/generated_ca.key
  Overwriting file: /private/etc/splinter/certs/client.crt
  Overwriting file: /private/etc/splinter/certs/private/client.key
  Overwriting file: /private/etc/splinter/certs/server.crt
  Overwriting file: /private/etc/splinter/certs/private/server.key
  ```
