# Splinter FAQ

* [What is Splinter?](#what-is-splinter)

* [Does Splinter have any example applications?](#does-splinter-have-any-example-applications)

* [How can I learn more about Splinter?](#how-can-i-learn-more-about-splinter)

* [Can I run the Splinter daemon behind a firewall without opening up a port?](#can-i-run-the-splinter-daemon-behind-a-firewall-without-opening-up-a-port)

* [How can I tell if state is consistent across scabbard services on a circuit?](#how-can-i-tell-if-state-is-consistent-across-scabbard-services-on-a-circuit)

## What is Splinter?

Splinter is a privacy-focused platform for distributed applications that
provides a blockchain-inspired networking environment for communication and
transactions between organizations. Splinter lets you combine
blockchain-related technologies -- such as smart contracts and consensus
engines -- to build a wide variety of architectural patterns.

For more information, see the
[Splinter README](https://github.com/Cargill/splinter/blob/master/README.md).

## Does Splinter have any example applications?

Yes. [Gameroom](https://github.com/Cargill/splinter/tree/master/examples/gameroom)
is a complete web application that allows you to set up private, multi-party
circuits (called "gamerooms") and play tic tac toe with securely shared state.
For more information, see the
[Gameroom README](https://github.com/Cargill/splinter/blob/master/examples/gameroom/README.md).

## How can I learn more about Splinter?

We encourage interest in and contributions for this exciting new project! Please
contact the
[Splinter maintainers](https://github.com/Cargill/splinter/blob/master/MAINTAINERS.md)
for more information.

## Can I run the Splinter daemon behind a firewall without opening up a port?

While it is technically possible to run the Splinter daemon this way, it is
not recommended. If the daemon cannot accept incoming connections it will not
be able to receive circuit management requests from new peers. Also,
if an existing peer has disconnected, the peer will try to reestablish a
connection to the splinterd behind the firewall and be unsuccessful.

If running behind a firewall without an open port is absolutely necessary,
peers can be explicitly set with the `splinterd --peer` option on startup or
with the splinter config `peers = []` option. This will cause the splinterd to
try to establish a connection with another splinterd node regardless if there
is a shared circuit defined or not, assuming the other node will accept incoming
connections.

## How can I tell if state is consistent across scabbard services on a circuit?

When an application that uses scabbard is behaving differently on two nodes in
the same circuit, you may want to verify that the scabbard services are
consistent with each other. This is one of the first things that should be
verified.

All of scabbard's state is summarized by a Merkle state root hash. The state
root hash of a scabbard service can be compared with the state root hash of
another service to check if their states are consistent.

One way to check the current state root hash of a scabbard service is by looking
at scabbard's log messages. On startup, scabbard will log its state root hash
with a message that looks like this:

```
[2020-05-13 16:49:49.990] T["Service admin::bubba-node-000"] DEBUG [scabbard::service::state] Restoring scabbard state on root 9d1f8f581cd30cea54095e9ba150dd30cfd94637ecf88a5ba6b63e6c6c08025d
```

Scabbard also logs the resulting state root hash after every committed batch
with a message like this one:

```
[2020-05-13 16:52:45.523] T["consensus-gr01"] INFO [scabbard::service::state] committed 1 change(s) for new state root e2982636275dc02817a725a6671a709df4320e20d227614509270e581f246cf8
```

Another way to get the current state root hash from a scabbard service is with
the `scabbard state root` CLI command. See the `scabbard-state-root(1)` man page
for more information.
