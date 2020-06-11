<!--
  Copyright 2018-2020 Cargill Incorporated

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# Splinter v0.4 Downloads

## Splinter repository

Clone the core [GitHub repository](https://github.com/Cargill/splinter/tree/0-4)
to view the Splinter source code, demo applications, and example Docker compose
files for starting up a Splinter network. Learn
[how to build Splinter](/docs/0.4/howto/building_splinter.html) and more by
browsing the [Splinter documentation](/docs/0.4/).

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
