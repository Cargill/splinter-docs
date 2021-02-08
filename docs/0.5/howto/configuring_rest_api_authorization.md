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
docs/0.5/references/cli/splinter-circuit-propose.1.md %}).

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
`--enable-biome` flag when running `splinterd`. For more details on this flag
and running `splinterd`, see the
[`splinterd` man page]({% link docs/0.5/references/cli/splinterd.1.md %}).

For more details about Biome and credentials, see
[Biome User Management]({% link docs/0.5/concepts/biome_user_management.md %}).

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
[`splinterd` man page]({% link docs/0.5/references/cli/splinterd.1.md %}).

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
