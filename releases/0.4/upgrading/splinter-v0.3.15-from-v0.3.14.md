# Upgrading to Splinter v0.3.15 from Splinter v0.3.14

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Breaking changes in this release:

* [The routes for the Biome keys endpoints have
  changed](#the-routes-for-the-biome-keys-endpoints-have-changed)

* [The splinter circuit create subcommand has been renamed to
  propose](#the-splinter-circuit-create-subcommand-has-been-renamed-to-propose)

## The routes for the Biome keys endpoints have changed

In release v0.3.14, the following endpoints required a user ID:

* `biome/users/{user_id}/keys`
* `biome/user/{user_id}/keys/{public_key}`

In this release, these endpoints no longer require a user ID. The Biome keys
endpoints have been changed to:

* `biome/keys`
* `biome/keys/{public_key}`

All instances of these endpoints must be updated. Requests to the previous
endpoints will result in a `404 NOT FOUND` error.

The functionality for these endpoints has remained the same. For more
information, see the [Splinter REST API documentation](/docs/0.4/api/).

## The splinter circuit create subcommand has been renamed to propose

In previous releases, the command `splinter circuit create` was used to propose
a new circuit.

In release v0.3.15, the `create` subcommand has been changed to `propose`.
Use `splinter circuit propose` for a new circuit, as shown in the following
example:

``` console
$ splinter circuit propose \
  --url http://splinterd-alpha:8085 \
  --key <path_to_alpha_private_key> \
  --node alpha-node-000::tls://splinterd-alpha:8044
```

The functionality of this subcommand has not changed.
