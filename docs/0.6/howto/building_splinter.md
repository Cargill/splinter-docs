## Building Splinter

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The `splinter` repository is available at
[github.com/Cargill/splinter](https://github.com/Cargill/splinter).

Splinter is built using latest stable [rust](https://www.rust-lang.org/), which
you should install via [rustup](https://rustup.rs/).

To install the remaining dependencies using a package manager, run one of the
following commands.

Homebrew  (OS X):
```bash
brew install openssl zeromq pkg-config protobuf postgresql
```

APT (Ubuntu):
```bash
apt install libssl-dev libzmq3-dev pkg-config libprotobuf-dev postgresql
```

Once you have the prerequisites installed, build Splinter by running `cargo
build` from the root of the Splinter repository. This command builds all of the
Splinter components, including `libsplinter` (the main library), `splinterd`
(the splinter daemon), the CLI, the client, and all examples in the `examples`
directory.

To build individual components, run `cargo build` in the component directories.
For example, to build only the splinter library, navigate to
`libsplinter`, then run `cargo build`.

To build Splinter using Docker, run
`docker-compose -f docker-compose-installed.yaml build` from the root
of the Splinter repository. This command builds Docker images for all of the
Splinter components, including `libsplinter` (the main library), `splinterd`
(the splinter daemon), the CLI, the client, and all examples in the `examples`
directory.

To build individual components using Docker, run
`docker-compose -f docker-compose-installed.yaml build <component>`
from the root of the Splinter repository. For example, to build only the
splinter daemon, run `docker-compose -f docker-compose-installed.yaml build
splinterd`.

To use Docker to build Splinter with experimental features enabled, set an
environment variable in your shell before running the build commands (for
example: `export 'CARGO_ARGS= --features experimental'`). To go back to
building with default features, unset the environment variable
(`unset CARGO_ARGS`).

