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
# Upgrading to Splinter v0.3.15 from Splinter v0.3.14

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
information, see the [splinterd OpenAPI
documentation](https://github.com/Cargill/splinter/blob/v0.3.15/splinterd/api/static/openapi.yml).

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
