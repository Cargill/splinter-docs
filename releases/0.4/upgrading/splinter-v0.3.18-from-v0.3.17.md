# Upgrading to Splinter v0.3.18 from Splinter v0.3.17

Breaking changes in this release:

* [The default network endpoint is now
  TLS](#the-default-network-endpoint-is-now-tls)

* [Changing the default service endpoint requires an experimental
  feature](#changing-the-default-service-endpoint-requires-an-experimental-feature)

* [The peer manager and components have been moved to the peer
   module ](#the-peer-manager-and-components-have-been-moved-to-the-peer-module)

## The default network endpoint is now TLS

In the previous release, the default network endpoint was a TCP connection to
`127.0.0.1:8044`. In release 0.3.18, this has changed to default to a TLS
connection, `tcps://127.0.0.1:8044`.

If you are using the `--no-tls` flag, you must provide a valid TCP network
endpoint. Otherwise, the following error will be returned:

``` console
Failed to start daemon, required argument is invalid: TLS is disabled, thus endpoint tcps://127.0.0.1:8044 is invalid
```

Add the TCP network endpoint when starting `splinter`, either on the command
line or in the configuration file. For example:

``` console
$ splinterd --no-tls --network-endpoint tcp://127.0.0.1:8044
```

## Changing the default service endpoint requires an experimental feature

The `splinterd` `service-endpoint` configuration setting and `service_endpoint`
command option are now available only with the experimental `service-endpoint`
feature. The command option and config setting no longer have an effect if the
`service-endpoint` feature is not enabled.

Use a pre-published experimental Splinter image or enable the `service-endpoint`
feature when building Splinter.

## The peer manager and components have been moved to the peer module

In the previous release, `PeerManager`, `PeerManagerConnector`,
`PeerInterconnect` and `PeerRef` were added to the
` splinter::network::peer_manager` module.

In release 0.3.18, these components have been moved to `splinter::peer`. The
`NetworkMessageSender` was also moved to `splinter::peer::interconnect`.

If you are using these components, update the `use` statements to the
following:

``` rust
use splinter::peer::interconnect::{PeerInterconnect, NetworkMessageSender};
use splinter::peer::PeerManager, PeerRef;
use splinter::peer:PeerManagerConnector;
```
