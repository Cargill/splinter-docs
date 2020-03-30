# Splinter FAQ

* [What is Splinter?](#what-is-splinter)

* [Does Splinter have any example applications?](#does-splinter-have-any-example-applications)

* [How can I learn more about Splinter?](#how-can-i-learn-more-about-splinter)

* [Can I run the Splinter daemon behind a firewall without opening up a port?](#can-i-run-the-splinter-daemon-behind-a-firewall-without-opening-up-a-port)

## What is Splinter?

Splinter is a privacy-focused platform for distributed applications that
provides a blockchain-inspired networking environment for communication and
transactions between organizations. Splinter lets you combine
blockchain-related technologies -- such as smart contracts and consensus
engines -- to build a wide variety of architectural patterns.

For more information, see the
[Splinter README](https://github.com/Cargill/splinter/blob/master/README.md).

## Does Splinter have any example applications?

The [cargill/splinter repository](https://github.com/Cargill/splinter/tree/master/examples)
includes several example applications that you can run as demos. For more
information, see the [Splinter README:
Demos](https://github.com/Cargill/splinter/blob/master/README.md#demos).

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
