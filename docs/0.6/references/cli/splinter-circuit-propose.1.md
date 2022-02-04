% SPLINTER-CIRCUIT-PROPOSE(1) Cargill, Incorporated | Splinter Commands
<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

NAME
====

**splinter-circuit-propose** — Propose that a new circuit is created

SYNOPSIS
========
**splinter circuit propose** \[**FLAGS**\] \[**OPTIONS**\]

DESCRIPTION
===========
This command submits a proposal to create a new Splinter circuit with one or more
other nodes. When the other nodes receive this proposal, they vote to accept or
reject it with `splinter circuit vote`. If all nodes accept the proposal, the
circuit is created.

It is necessary to specify the participating nodes for a circuit proposal as well
as information for the intended use and operation of the circuit. Circuit proposals
may be constructed multiple ways, via command-line options using this command or
using the `splinter circuit template` command. The `splinter circuit template`
command offers a partially completed circuit proposal, requiring less input than
using `splinter circuit propose`. More information on how to use circuit templates
can be found in the splinter-circuit-template(1) man page.

A circuit proposal may be removed using `splinter circuit remove-proposal`.
More information on this command is available in the
splinter-circuit-remove-proposal(1) man page.

FLAGS
=====
`-n`, `--dry-run`
: Show the circuit definition without submitting the proposal

`-h`, `--help`
: Prints help information

`-q`, `--quiet`
: Decrease verbosity (the opposite of -v). When specified, only errors or
  warnings will be output.

`-V`, `--version`
: Prints version information

`-v`
: Increases verbosity (the opposite of -q). Specify multiple times for more
  output.

OPTIONS
=======
`--auth-type AUTHORIZATION_TYPE`
: Authorization type for the circuit. Possible values `trust` or `challenge`.
  Defaults to `challenge`. If using `challenge`, node public keys are required.

`--comments COMMENTS`
: Adds human-readable comments to the circuit proposal.

`--compat COMPAT_VERSION`
: Enforce that the proposed circuit is compatible with a specific version.
  Accepted values: `0.4`, `0.6`

`--display-name DISPLAY-NAME`
: Add human-readable name for the circuit.

`-k, --key PRIVATE-KEY-FILE`
: Specifies the full path to the private key file.

`--management MANAGEMENT-TYPE`
: Specifies the circuit management type. Circuit management type indicates the
  application authorization handler which handles the circuit’s change proposals.

`--metadata APPLICATION-METADATA` ...
: Provides application-specific metadata for the circuit proposal. Repeat this
  option to provide multiple entries for the application metadata.

`--metadata-encoding METADATA-ENCODING`
: Sets the encoding type for the application metadata (default: `string`).
  Accepted values: `json`, `string`.

`--node NODE-STRING` ...
: Specifies a node that should be part of the circuit, using the format
  `NODE-ID::ENDPOINT1,ENDPOINT2`. All endpoints must be in the registry entry
  for the given node ID. The proposer must also specify its own node, if it is
  to be be included on the circuit proposal. Repeat this option to specify
  multiple nodes.

`--node-public-key NODE-PUBLIC-KEY-STRING` ...
: Specifies the public key for node, using the format `NODE-ID::PUBLIC-KEY`.
  The proposer must also specify its own node's public key, if it is
  to be be included on the circuit proposal. Repeat this option to specify keys
  for multiple nodes. Public keys are required if using `challenge`
  authorization.

`--service SERVICE-STRING` ...
: Specifies the service ID and allowed nodes, using the format
  `SERVICE-ID::ALLOWED-NODES`. Service IDs are comprised of 4 ASCII alphanumeric
  characters. The ALLOWED-NODES specifies the node which the service will run
  on, currently only one node ID is allowed.

`--service-arg SERVICE-ARGUMENTS` ...
: Passes key/value arguments to the specified service (as defined by
  `--service`), using the format `SERVICE-ID::KEY=VALUE`. Service arguments
  provided must match those required to create the service. The glob operator,
  `*`, may be used in place of the SERVICE-ID to match all or certain parts
  of the 4 character SERVICE-ID. For instance, `AA*::KEY=VALUE` to match
  all service IDs that begin with `AA`. Repeat this option to specify multiple
  key/value arguments.

`--service-peer-group SERVICE-PEER-GROUP` ...
: Specifies the service peer group (a list of peer services). Peer services are
  services used by peer nodes within a circuit. This is the group of services
  that must come to consensus amongst the node peers. Repeat this option to
  specify multiple service peer groups.

`--service-type SERVICE-TYPE` ...
: Provides a service type for the specified service (as defined by
  `--service`), using the format `SERVICE-ID::SERVICE-TYPE`. The glob operator,
  `*`, may be used in place of the SERVICE-ID to match all or certain parts
  of the 4 character SERVICE-ID. For instance, `AA*::SERVICE-TYPE` to match
  all service IDs that begin with `AA`. Scabbard is a  Splinter service currently
  implemented to be used, that can be specified with `service-type` of `scabbard`.
  Repeat this option to specify multiple service types.

`--template TEMPLATE`
: Specifies a template to use for defining the circuit. Additional information
  on circuit templates can be found in the splinter-circuit-template(1) man page.

`--template-arg TEMPLATE-ARG` ...
: Provides a key/value argument for the circuit template (as specified by
  `--template``), using the format `KEY=VALUE`. Repeat this option to
  specify multiple template arguments.

`-U`, `--url URL`
: Specifies the URL for the `splinterd` REST API. The URL is required unless
  `$SPLINTER_REST_API_URL` is set.

ENVIRONMENT VARIABLES
=====================
**SPLINTER_REST_API_URL**
: URL for the `splinterd` REST API. (See `-U`, `--url`.)

EXAMPLES
========
This command proposes a simple circuit with one other node.

* The proposing node has ID `alpha001` and endpoint `tcps://splinterd-node-acme001:8044`.
* The other node has ID `beta001` and endpoint `tcps://splinterd-node-beta001:8044`
  and `tcp://splinterd-node-beta001:8045`.
* There is one service with ID `AA01`. This service has no service
  arguments, service type, or service group.

```
$ splinter circuit propose \
  --node alpha001::tcps://splinterd-node-alpha001:8044 \
  --node beta001::tcps://splinterd-node-beta001:8044,tcp://splinterd-node-beta001:8045 \
  --service AA01::alpha001 \
  --key PRIVATE-KEY-FILE
  --url URL-of-splinterd-REST-API
  --auth-type trust
```

The next command proposes a circuit with one other node, with multiple services
and multiple service-args.

* The proposing node has ID `alpha001` and endpoint `tcps://splinterd-node-alpha001:8044`.
* The other node has ID `beta001` and endpoint `tcps://splinterd-node-beta001:8044`.
* There are two services for each member node with a `service-type` of `scabbard`
  for each. The service ID for the alpha node service is `AA01` and the
  beta node service ID is `BB01`. Each of these services are specified
  in the service group by providing each service ID for the `service-peer-group`
  argument. There is also a service-arg for the `AA01`, the `admin_keys`
  which is required by the Splinter Scabbard service.

```
splinter circuit propose \
  --key PRIVATE-KEY-FILE \
  --url URL-of-splinterd-REST-API \
  --node alpha001::tcps://splinterd-node-alpha001:8044 \
  --node beta001::tcps://splinterd-node-beta001:8044 \
  --service AA01::alpha-node-001 \
  --service BB01::beta-node-001 \
  --service-type AA01::scabbard \
  --service-type BB01::scabbard \
  --service-arg AA01::admin_keys=NODE-PUBLIC-KEY \
  --service-arg BB01::admin_keys=NODE-PUBLIC-KEY \
  --service-peer-group AA01,BB01
  --auth-type trust
```

The glob operator, `*` may be used to match SERVICE-ID for the `--service-type`
and `--service-arg` arguments. Therefore, this part of the command:

```
--service-type AA01::scabbard \
--service-type BB01::scabbard \
--service-arg AA01::admin_keys=NODE-PUBLIC-KEY \
--service-arg BB01::admin_keys=NODE-PUBLIC-KEY \
```

becomes the following using the glob operator:
```
--service-type *::scabbard \
--service-arg *::admin_keys=NODE-PUBLIC-KEY \
```

SEE ALSO
========
| `splinter-circuit-abandon(1)`
| `splinter-circuit-disband(1)`
| `splinter-circuit-list(1)`
| `splinter-circuit-proposals(1)`
| `splinter-circuit-purge(1)`
| `splinter-circuit-remove-proposal(1)`
| `splinter-circuit-show(1)`
| `splinter-circuit-vote(1)`
|
| Splinter documentation: https://www.splinter.dev/docs/0.6/
