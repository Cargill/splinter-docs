# Splinter v0.6 Downloads

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Splinter repository

Clone the core [GitHub repository](https://github.com/Cargill/splinter/)
to view the Splinter source code, demo applications, and example Docker compose
files for starting up a Splinter network. Learn
[how to build Splinter]({% link docs/0.6/howto/building_splinter.md %}) and more
by browsing the [Splinter documentation]({% link docs/0.6/index.md %}).

See [Repositories]({% link community/repositories.md %}) for the other Splinter
repositories in this project.

## Rust crates

Use the following crates in your Rust project:

* [splinter](https://crates.io/crates/splinter) Splinter's core library
* [scabbard](https://crates.io/crates/scabbard) Library for the scabbard
  service

## Docker images

Splinter provides the following prebuilt Docker images for running and
interacting with a Splinter node:

* [splintercommunity/splinterd](https://hub.docker.com/r/splintercommunity/splinterd)
  The Splinter daemon, an out-of-the-box implementation of a Splinter node
* [splintercommunity/splinter-cli](https://hub.docker.com/r/splintercommunity/splinter-cli)
  Splinter's command line interface for managing and interacting with a Splinter
  node
* [splintercommunity/scabbard-cli](https://hub.docker.com/r/splintercommunity/scabbard-cli)
  The scabbard service's command line interface

## Apt repository

Splinter is installable on Ubuntu Focal via the official apt repository.

Release versions:

``` console
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys --recv-keys B1DF8C00ACEB5855
$ sudo add-apt-repository "deb [arch=amd64] http://repo.splinter.dev/ubuntu/flipper focal stable"
$ sudo apt install splinter-cli splinter-daemon
```
