# Upgrading to Splinter v0.3.12 from Splinter v0.3.11

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Changes
* [The generate-cert feature has been removed](#the-generate-cert-features-has-been-removed)
* [The CLI command to create a circuit was updated](#the-CLI-command-to-create-a-circuit-was-updated)
* [The scabbard CLI's upload command has been changed](#the-scabbard-clis-upload-command-has-been-changed)
* [The circuits, node registry and key registry REST API routes now begin with admin](#the-circuits-node-registry-and-key-registry-rest-api-routes-now-begin-with-admin)
* [The Sabre version used by scabbard has been updated](#the-sabre-version-used-by-scabbard-has-been-updated)
* [The scabbard client's submit method has been changed](#the-scabbard-clients-submit-method-has-been-changed)

## The generate-cert features has been removed
If you are using the --generate-cert option to splinterd, you need to update
your procedure. Since this option requires a special build parameter to enable,
it is unlikely that you haven’t already upgraded.

In v0.3.11, the Splinter daemon could be built with the deprecated feature
`generate-cert` which would enable starting up splinterd with the flag
`--generate-cert`. This flag was used to generate development certificates and
keys on startup that would be used for running TLS transports in insecure mode.
If you are not using the `--generate-cert` flag nothing has changed.

``` console
$ splinterd --node-id example-node-id --transport tls --generate-cert
[2020-02-04 15:40:29.763] T["main"] WARN [splinterd] Starting TlsTransport in insecure mode
```

This feature has been fully removed in version v0.3.12. Now it is required to
use the `splinter` CLI to generate the development certificates. The `splinter`
CLI provides a subcommand called `splinter cert generate` which will generate
development certificates and keys files.

The `splinter cert generate` command creates the following certificates and
keys:
  - `client.crt`
  - `client.key`
  - `server.crt`
  - `server.key`
  - `generated_ca.pem`
  - `generated_ca.key`

The `generated_ca` files will be used to create the development client and
server certificates. Do not use these files as the trusted certificate
authority.

This command writes the files to the default Splinter certificate directory,
`/etc/splinter/certs/`. To use a different directory (for example, if you
already have valid certificate files in this directory), you can change the
location by setting the `SPLINTER_CERT_DIR` environment variable or using the
`--cert-dir` option on the command line.

### New Procedure:

1. Run the following command to generate certificates and keys.

   ``` console
   $ splinter cert generate
   ```

   The output shows the full path of each file.

   ``` console
   Writing file: /etc/splinter/certs/generated_ca.pem
   Writing file: /etc/splinter/certs/private/generated_ca.key
   Writing file: /etc/splinter/certs/client.crt
   Writing file: /etc/splinter/certs/private/client.key
   Writing file: /etc/splinter/certs/server.crt
   Writing file: /etc/splinter/certs/private/server.key
   ```

   Tip: To change the common name of the certificates, use the `--common-name`
   flag. Otherwise, the common name will default to `localhost`.

2. Start the Splinter daemon in TLS mode with the following `splinterd` command.

   ``` console
   $ splinterd --node-id node-000 --transport tls --insecure
   [2020-02-04 15:40:29.763] T["main"] WARN [splinterd] Starting TlsTransport in insecure mode
   ```
   The `--insecure` flag turns off certificate authority validation (because the
   generated certificates are not signed by a common certificate authority).
   Without this flag, the Splinter daemon will get a TLS error when it tries to
   connect to another Splinter node.

   * You can specify the generated certificate directory by using the
     `--cert-dir` option, setting `SPLINTER_CERT_DIR` environment variable, or
      setting the location in the splinterd config, `splinterd.toml`. If
      necessary, you can specify each file separately with the command-line option
      or in the config file.

For more information see [Generating Insecure Certificates for Development]({%
link docs/0.4/howto/generating_insecure_certificates_for_development.md %})

For an example of how this could be handled in a docker-compose.yaml file look
at the [Gameroom](https://github.com/Cargill/splinter/blob/v0.3.12/examples/gameroom/docker-compose-dockerhub.yaml)
example

## The CLI command to create a circuit was updated
If you are creating circuits with the experimental splinter CLI, you must update
your procedure.

In v0.3.11, the Splinter CLI command for creating a circuit, took as an input a
path to a yaml file with the circuit definition as in the example below.

``` console
$ cat circuit.yaml
circuit_id: my-grid-circuit
roster:
  - service_id: grid-scabbard-a
    service_type: scabbard
    allowed_nodes:
      - alpha-node-000
    arguments:
      - ["admin_keys", "[\"<gridd-alpha public key>\"]"]
      - ["peer_services", "[\"grid-scabbard-b\"]"]    
  - service_id: grid-scabbard-b
    service_type: scabbard
    allowed_nodes:
     - beta-node-000
    arguments:
      - ["admin_keys", "[\"<gridd-alpha public key>\"]"]
      - ["peer_services", "[\"grid-scabbard-a\"]"]
members:
  - node_id: alpha-node-000
    endpoint: tls://splinterd-alpha:8044
  - node_id: beta-node-000
    endpoint: tls://splinterd-beta:8044
authorization_type: Trust
durability: NoDurability
circuit_management_type: grid
```

``` console
$ splinter circuit create \
  --key <path_to_alpha_private_key> \
  --url http://splinterd-alpha:8085 \
  circuit.yaml
```

In v0.3.12, the `splinter circuit create` CLI command was updated to no longer
take a YAML file. The user passes arguments to the command and the CLI will
build the circuit definition based on those arguments.

``` console
$ splinter circuit create \
  --key <path_to_alpha_private_key> \
  --url http://splinterd-alpha:8085  \
  --node alpha-node-000::tls://splinterd-alpha:8044 \
  --node beta-node-000::tls://splinterd-beta:8044 \
  --service grid-scabbard-a::alpha-node-000 \
  --service grid-scabbard-b::beta-node-000 \
  --service-type *::scabbard \
  --management grid \
  --service-arg *::admin_keys=<alpha_public_key> \
  --service-peer-group grid-scabbard-a,grid-scabbard-b
```

With these changes the user can no longer set the circuit ID, the CLI auto
generates the ID as it creates the circuit proposal. For a full description of
all the arguments to create a circuit use:  

``` console
$ splinter circuit create --help
```

Examples can be found at:

  - [Uploading Smart
    Contract]({% link docs/0.4/howto/uploading_smart_contract.md %})
  - [Grid on Splinter](https://github.com/hyperledger/grid/tree/main/examples/splinter)

## The scabbard CLI's upload command has been changed
If you are using the experimental scabbard CLI to upload smart contracts, you
need to update your procedure.

In v0.3.11, you could upload a smart contract to scabbard using the experimental
`scabbard upload` command and supplying the path to a smart contract archive
(.scar) file.

In v0.3.12, the upload command has been moved to `scabbard contract upload`;
this change was made to accommodate other contract-related subcommands (such as
`list` and `show`). Additionally, the way a .scar file is specified has been
updated. To use the new upload subcommand, you will need to specify a `--path`
argument for a directory that contains the desired .scar file, and provide the
name and minimum version requirement of the .scar file in the format
`name:version`. Here is an example for using the new command to upload a file
called `xo_0.4.2.scar` in the current working directory:

``` console
$ scabbard contract upload \
  -k gridd \
  -U 'http://splinterd-alpha:8085' \
  --service-id $CIRCUIT_ID::grid-scabbard-a \
  --path . \
  xo:0.4.2
```

For more information, check the command's help text:

``` console
$ scabbard contract upload --help
```

## Circuits, node registry and key registry REST API routes now begin with admin
If you are using /keys, /nodes, or /circuits REST APIs directly in your
application, you need to update the endpoints in your code.

In v0.3.11, the routes pertaining to circuits, the node registry and the key
registry were reachable at the following endpoints:
 - `/circuits`
 - `/circuits/{circuit_id}`
 - `/keys`
 - `/keys/{public_key}`
 - `/nodes`
 - `/nodes/{identity}`

In v0.3.12, these routes are now prefixed with `admin`. The routes are now
reached at the following updated endpoints:
 - `/admin/circuits`
 - `/admin/circuits/{circuit_id}`
 - `/admin/keys`
 - `/admin/keys/{public_key}`
 - `/admin/nodes`
 - `/admin/nodes/{identity}`

With these changes, any instance of these endpoints must be updated to include
the `admin` prefix, otherwise the client will not be able to reach these
endpoints and the server will return a `404 NOT FOUND` HTTP error as the
v0.3.11 endpoints no longer exist.

The functionality for these endpoints has remained the same, and more
information on the functionality may be found in the
[Splinter REST API documentation](/docs/0.4/api/)

## The Sabre version used by scabbard has been updated
In v0.3.12, the scabbard service has been updated to use v0.5 of the Sawtooth
Sabre smart contract execution platform. This updated version of Sabre includes
improvements to the Rust SDK such as convenient addressing methods and batch
builder improvements to simplify client code.

If you have written client code that submits batches to scabbard, you will have
two options for upgrading:

1. Simply update the family_version of each submitted transaction to 0.5

2. If the client code is written in Rust, use the new transaction and batch
building pattern that's enabled by the Sabre, Sawtooth, and Transact SDKs. This
is the recommended approach because it greatly simplifies the process of
creating Sabre transactions and batches. For an example of this pattern, see the
[scabbard CLI](https://github.com/Cargill/splinter/blob/v0.3.12/services/scabbard/src/cli/main.rs)

## The scabbard client's submit method has been changed
If you are using the experimental scabbard client to submit batches, you will
need to update your code.

In v0.3.12, the scabbard client's `upload` method has undergone some changes:

- The `circuit_id` and `service_id` arguments have been replaced with a single
  `service_id` argument, which takes a `ServiceId` struct that represents a
  fully-qualified service ID (both circuit and service IDs). This can easily be
  updated by constructing a `ServiceId` from the individual circuit and service
  IDs, or by parsing a string of the format `circuit::service_id` using the
  `ServiceId` constructors.
- The type of the `batches` argument has been updated. It used to be a
  `BatchList` from the Sawtooth SDK, but is now a `Vec<Batch>`, where `Batch` is
  provided by the Transact library. This change requires updating the code that
  calls the scabbard client to use Transact for batch building rather than the
  Sawtooth SDK.

For an example of how to use the new `upload` method, see the [scabbard CLI](https://github.com/Cargill/splinter/blob/v0.3.12/services/scabbard/src/cli/main.rs).
