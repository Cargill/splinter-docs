# Configuring REST API Authorization
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The Splinter daemon (splinterd) provides a secure REST API for managing
circuits, submitting transactions, reading state, and a variety of other
operations. Clients must authenticate and be granted permissions to use the
various splinterd endpoints, which requires some setup.

This document will describe the configuration of both authentication and
authorization for the Splinter REST API.

## Authentication Configuration

The Splinter daemon provides 3 different authentication methods for REST API
users and clients: Cylinder JWT, Biome credentials, and OAuth. This section
briefly describes these authentication methods and explains how to configure and
use them.

### Cylinder JWT

Cylinder JWT authentication is a basic authentication method where the client
provides a JSON Web Token (JWT) that is signed by a Cylinder private key. The
REST API verifies the signature of the JWT and uses the signer's public key
(which is the value of the `iss` claim of the JWT) as the client's identity.

Cylinder JWTs are the preferred authentication method for non-user-based
Splinter clients such as the Splinter CLI or integration daemons. Because of
this important role, it is enabled by default for splinterd with no
configuration necessary.

Cylinder JWT support is built into the Splinter CLI. Each subcommand of the CLI
that makes requests to the Splinter REST API takes a `--key` argument for
specifying a Cylinder private key file for generating a JWT; this JWT is then
used to authenticate REST API requests. For an example, see the
[`splinter circuit propose` man page]({% link
docs/0.6/references/cli/splinter-circuit-propose.1.md %}).

For other clients, Cylinder provides a convenient API for creating and signing
JWTs as part of its Rust crate. This functionality is provided by the
`JsonWebTokenBuilder`, which is enabled with the `jwt` feature.

For more on Cylinder JWTs and how they work with the Splinter REST API, see the
[Cylinder JWT]({% link community/planning/cylinder_jwt.md %}) and
[Cylinder JWT authentication]({% link
community/planning/cylinder_jwt_authentication.md %}) design documents.

### Biome Credentials

Biome is the Splinter component that manages users and their associated data for
a node. Biome provides a basic credentials mechanism that allows users to
register and login with a username and password. When a user logs in, the
Splinter REST API provides a Biome JWT that can be used to authenticate future
requests.

Biome credentials is a quick and easy way to allow users to login with minimal
configuration, and it's on of the supported authentication methods for the
[Splinter Admin UI]({% link community/planning/admin_ui.md %}).

Biome credentials can be enabled for the Splinter daemon by specifying the
`--enable-biome-credentials` flag when running `splinterd`. For more details on
this flag and running `splinterd`, see the
[`splinterd` man page]({% link docs/0.6/references/cli/splinterd.1.md %}).

For more details about Biome and credentials, see
[Biome User Management]({% link docs/0.6/concepts/biome_user_management.md %}).

### OAuth

OAuth is an open standard for user authentication. Splinter provides built-in
support for OAuth authentication with Azure Active Directory, GitHub, Google,
and any OpenID-compliant OAuth provider. With OAuth authentication, a user that
wishes to login will be redirected to the OAuth provider's website to enter
their credentials for that provider. Once the user has authenticated with the
OAuth provider, they will be redirected to Splinter. The Splinter REST API will
then do the following:

1. Use the OAuth token provided by the OAuth server to validate that the user is
   logged in
1. Assign a new Biome (user) ID to the user if they do not already have one
1. Generate a new Splinter access token to return to the user

The access token returned in the last step can be used to authenticate future
requests. When the user (or the user's client) provides this access token with a
REST API request, the REST API will verify that it's valid. Additionally, the
REST API will periodically check that the user is still logged in with the OAuth
server by using the OAuth token.

OAuth requires a bit more setup than Biome credentials, but it's generally the
preferred method for user authentication. OAuth integrates the Splinter REST
API with existing identity-providing services and allows users to login with
existing accounts. OAuth is supported by the
[Splinter Admin UI]({% link community/planning/admin_ui.md %}) and should be
considered for any user-based clients of the Splinter REST API.

To configure OAuth, the Splinter daemon requires a few settings:

* `oauth-provider` for specifying which provider to use (`azure`, `github`,
  `google`, or `openid`)
* `oauth-client-id` for specifying an OAuth client ID (this is provided by the
  OAuth provider)
* `oauth-client-secret` for specifying an OAuth client secret (this is provided
  by the OAuth provider)
* `oauth-redirect-url` for specifying the URL of the Splinter REST API's
  callback endpoint

These four settings must be set to enable OAuth as an authentication method for
the Splinter REST API. In addition, some configurations require additional
settings:

* `oauth-openid-url` for specifying the URL of the OpenID discovery document
  (only when the OAuth provider is Azure or OpenID)
* `oauth-openid-auth-params` for specifying additional parameters to include in
  the authorization request to an OAuth OpenID provider (only when the OAuth
  provider is OpenID)
* `oauth-openid-scopes` for specifying additional scopes to request from an
  OAuth OpenID provider (only when the OAuth provider is OpenID)

For more details on how to configure OAuth for `splinterd`, see the
"Authorization Configuration" section of the
[`splinterd` man page]({% link docs/0.6/references/cli/splinterd.1.md %}).

## Authorization Configuration

The Splinter daemon provides 2 ways to configure permissions for clients and
users of the REST API: an admin keys file and a role-based access control
system. These two configuration mechanisms are automatically provided by
`splinterd`. This section describes how to use these two mechanisms to configure
authorization for individual clients and users.

### Allow Keys File

The allow keys file lets you assign administrative privileges to a set of
Cylinder public keys. This authorization configuration is specifically for
authorizing requests made with [Cylinder JWTs](#cylinder-jwt). This is the
simplest way to configure authorization, but it lacks any fine-grained control:
the public keys listed in this file will be granted all permissions for the
Splinter REST API.

Though this file may be used as a simple way to assign admin privileges for the
life of the node, it is especially useful for bootstrapping a Splinter node. To
manage the other authorization mechanisms (such role-based access control, which
is covered in the next section) via the Splinter REST API, you must first be
authorized yourself. The allow keys file enables easy authorization that lets
you set up a node from scratch using the Splinter CLI and REST API.

The file is simply named `allow_keys` and is located in the Splinter config
directory. The default location is `/etc/splinter/allow_keys`, but this may vary
if the Splinter config or Splinter home directories are configured differently.

Configuring the allow keys file is as simple as copying the desired public keys
into the file using a text editor. The file should contain a list of the public
keys that will be granted admin privileges with each one on its own line. The
file may be updated at any time, even while the node is running. Splinter will
monitor the file and detect when it's modified, at which point it will reload it
for an up-to-date list of admin keys.

### Role-based Access Control

Splinter provides a role-based access control (RBAC) system for authorizing
users and public keys to access various REST API endpoints. Each role is made up
of a set of permissions.  Identities in the system may have multiple roles.

Note that these permissions only apply to access via the REST API and not other
aspects of the system, such as smart contract processing.

#### Roles and Permissions

In Splinter, roles define a set of one or more permissions that are granted to
its members. In the context of the authorization framework, the permissions
allow access, never deny it.

The available permissions include:

| permission | Description | Routes |
| ---------- | ----------- | ------ |
| authorization.maintenance.read | Allows the client to check maintenance mode status | `/authorization/maintenance` |
| authorization.maintenance.write | Allows the client to enable/disable maintenance mode | `/authorization/maintenance` |
| authorization.permissions.read | Allows the client to read REST API permissions | `/authorization/permissions` |
| authorization.rbac.read | Allows the client to read roles, identities, and role assignments | `/authorization/roles`, `/authorization/assignments` |
| authorization.rbac.write | Allows the client to modify roles, identities, and role assignments | `/authorization/roles`, `/authorization/assignments` |
| biome.user.read | Allows the client to view all Biome users | `/biome/users` |
| biome.user.write | Allows the client to modify all Biome users | `/biome/users` |
| circuit.read | Allows the client to read circuit state | `/admin/circuits`, `/admin/proposals` |
| circuit.write | Allows the client to modify circuit state | `/admin/circuits`, `/admin/proposals`, `/admin/submit`|
| health.read | Allows the client to check node health | |
| registry.read | Allows the client to read the registry | `/registry/nodes` |
| registry.write | Allows the client to modify the registry |`/registry/nodes` |
| scabbard.read | Allows the client to read scabbard services' state and batch statuses | `/scabbard/*` |
| scabbard.write | Allows the client to submit batches to scabbard services | `/scabbard/{circuit}/{service}/batches` |
| status.read | Allows the client to get node status info | `/status` |

Depending on which features have been compiled into the `splinterd` binary, this
list may vary. To see the definitive list of permissions for a given `splinterd`
instance, run the command

```
$ splinter permissions
```

Splinter is initialized with a single role, `"admin"`, which has all of the
permissions.  This role may not be removed via the tools in the following
section.

##### Configuration

Roles are configured via the `splinter` CLI tool.  All roles are local to a
splinter node.

###### Viewing Roles

The CLI has two subcommands for displaying information about the existing roles
on a splinter node: [`splinter role list`]({% link
docs/0.6/references/cli/splinter-role-list.1.md %}) and [`splinter role
show`]({% link docs/0.6/references/cli/splinter-role-show.1.md %}).  The `list`
subcommand displays all of the roles that exist on the node.  The `show`
subcommand displays details about a specific role, including the set of
permissions available to members of that role.

For example, the roles can be listed as follows:

```
$ splinter role list
ID             NAME
admin          Administrator
perm_reader    Permission Reader
circuit_admin  Circuit Admin
circuit_reader Circuit Admin
status_reader  Status Reader
```

The details for a role can be displayed as follows:

```
$ splinter role show circuit_admin
Id: circuit_admin
    Name: Circuit Admin
    Permissions:
        circuit.read
        circuit.write
```

###### Creating Roles

Roles are created via the [`splinter role create`]({% link
docs/0.6/references/cli/splinter-role-create.1.md %}) subcommand.  The roles
require at least one permission and a display name.  The following example will
create a role with two permissions.

```
$ splinter role create \
    --display "My Role" \
    --permission status.read \
    --permission scabbard.read \
    my_role
```

The resulting role authorizes members to read both status and scabbard service
details.

The details for the new role can be displayed via the `show` subcommand:

```
$ splinter role show circuit_admin
Id: my_role
    Name: My Role
    Permissions:
        status.read
        scabbard.read
```

###### Modifying Roles

Roles are modified via the [`splinter role update`]({% link
docs/0.6/references/cli/splinter-role-update.1.md %}) subcommand.  A role's
display name and permissions can both be optionally modified, however the
requirement that there is still at least one permission stands.

The following example modifies the role created in the previous section, by
adding one permission and removing another.

```
$ splinter role update \
    ---rm-perm status.read \
    ---add-perm scabbard.write \
    my_role
```

The resulting change authorizes members to both read and write scabbard service
details, but removes the ability to read status information from the node.

###### Deleting roles

Finally, roles are deleted via the [`splinter role delete`]({% link
docs/0.6/references/cli/splinter-role-delete.1.md %}) subcommand.  Any
authorized identities will have their membership of that role removed.

The following example deletes the role updated in the previous section.

```
$ splinter role delete my_role
```

#### Authorized Identities

From the perspective of the Splinter REST API, identities come in two flavors:
users and keys. Users are provided via biome or an OAuth2 integration.  Keys are
Cylinder public keys, provided to the API via a Cylinder JWT.

Identities are authorized via one or more roles. Once the user is authorized,
the user may make use of the REST API, either via the CLI, or in a browser
environment.

##### Configuration

Authorized identities are configured via the `splinter` CLI tool. All authorized
identities are local to a splinter node.

###### Viewing Authorized Identities

The CLI has two subcommands for displaying information about the existing
authorized identities on a splinter node: [`splinter authid list`]({% link
docs/0.6/references/cli/splinter-authid-list.1.md %}) and [`splinter authid
show`]({% link docs/0.6/references/cli/splinter-authid-show.1.md %}).  The
`list` subcommand displays all of the authorized identities that exist on the
node.  The `show` subcommand displays details about a specific authorized
identity, including the set of roles of which the identity is a member.

For example, the authorized identities can be listed as follows:

```
$ splinter authid list
IDENTITY                                                           TYPE ROLES
03d4a6ea6bae775622912b6cf49437098dc3bf06ca49ea331113e27ee0b14c7a3c key  2
557C80AC-4C17-4A21-9E68-AB9AABD3C8CD                               user 2
```

The details for an authorized identity can be displayed as follows:

```
$ splinter authid show --id-user 557C80AC-4C17-4A21-9E68-AB9AABD3C8CD
ID: 557C80AC-4C17-4A21-9E68-AB9AABD3C8CD
    Type: user
    Roles:
        circuit_reader
        status_reader
```

###### Creating Authorized Identities

Authorized identities are created via the [`splinter authid create`]({% link
docs/0.6/references/cli/splinter-authid-create.1.md %}) subcommand.  An identity
is either a user id or a public key, one of which is required.  The identity
must also have at least one role specified.

The following example assigns two roles to a public key (the public key is
assumed to be in a file, for brevity).

```
$ splinter authid create \
    --id-key $(cat ~/.cylinder/keys/my_user.pub) \
    --role perm_reader \
    --role circuit_admin
```

This can be verified via the `show` subcommand:

```
$ splinter authid show --id-key $(cat ~/.cylinder/keys/my_user.pub)
ID: 03d4a6ea6bae775622912b6cf49437098dc3bf06ca49ea331113e27ee0b14c7a3c
    Type: key
    Roles:
        circuit_admin
        perm_reader
```

###### Modifying Authorized Identities

Authorized identities are updated via the [`splinter authid update`]({% link
docs/0.6/references/cli/splinter-authid-update.1.md %}) subcommand.  Roles may
be added or removed, however the identity must still have at least one role
specified.

The following example removes one role and adds another.

```
$ splinter authid update \
    --id-key $(cat ~/.cylinder/keys/my_user.pub) \
    --rm-role circuit_admin \
    --add-role circuit_reader
```

The resulting change removes the identity's ability to administer circuits, but
still allows it to read them.

###### Deleting Authorized Identities

Finally, authorized identities are deleted via the [`splinter authid delete`]({%
link docs/0.6/references/cli/splinter-authid-delete.1.md %}) subcommand. An
identity removed immediately loses its access to any of their permitted REST API
endpoints.

The following example deletes the public key identity used in the previous
sections.

```
$ splinter authid delete --id-key $(cat ~/.cylinder/keys/my_user.pub)
```
