# Upgrading to Splinter v0.3.15 from Splinter v0.3.14

## Changes

## The routes for keys endpoint have changed

In v0.3.14 the following endpoints required a user id

* `biome/users/{user_id}/keys`
* `biome/user/{user_id}/keys/{public_key}`

In v0.3.15 the above endpoints no longer require a user id and have been
changed to

* `biome/keys`
* `biome/keys/{public_key}`

With these changes, any instance of these endpoints must be updated, otherwise
requests to these endpoints will result in a 404 NOT FOUND HTTP error as the
v0.3.14 endpoints no longer exist.

The functionality for these endpoints has remained the same, and more
information on the functionality may be found in the [openapi documentation](https://github.com/Cargill/splinter/blob/v0.3.15/splinterd/api/static/openapi.yml).

## The splinter create command has been renamed to propose

In v0.3.14 in order to propose a circuit, one would run the following command.

```
$ splinter circuit create \
    --url http://splinterd-alpha:8085 \
    --key <path_to_alpha_private_key> \
    --node alpha-node-000::tls://splinterd-alpha:8044 \
```

In v0.3.15 "create" has been changed to "propose".

```
$ splinter circuit propose \
    --url http://splinterd-alpha:8085 \
    --key <path_to_alpha_private_key> \
    --node alpha-node-000::tls://splinterd-alpha:8044 \
```

The functionality has not changed.
