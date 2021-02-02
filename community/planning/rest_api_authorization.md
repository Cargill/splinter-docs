# Splinter REST API Authorization
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

Access control for the Splinter REST API will be provided by a set of identity
providers for identifying clients and a set of authorization handlers for
determining which clients have which permissions.

## Motivation
[motivation]: #motivation

In most production environments, there will be multiple users of a Splinter
node, each with different roles, responsibilities, and permissions. In some
cases, a Splinter node's REST API may be accessible on a public network such as
the internet. It is important to provide access control for Splinter's REST API
to restrict unauthorized parties from viewing sensitive data, transacting on
behalf of the node, or modifying system state.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

Authorization for the Splinter REST API will be handled by an authorization
guard. This component will inspect all REST API requests and attempt to
verify if the client is permitted to make the request. This process is as
follows:

1. Determine if the requested endpoint requires authorization
1. Read the `Authorization` HTTP header
1. Parse the authorization header into a known format
1. Query a set of configured identity providers to match the authorization
   header with a client identity
1. Query a set of configured authorization handlers to determine if the client
   is authorized to make the request

### Identity Providers

To determine the identity of a client, the Splinter REST API will be configured
with a set of identity providers. These identity providers will be called by the
authorization guard in the configured order with the parsed contents of the
request's `Authorization` header in an attempt to find an identity that
corresponds to the header. If this is successful, the authorization guard will
use the returned client identity to perform authorization; if no identity could
be found, the guard will respond to the client with `401 Unauthorized`.

### Authorization Handlers

To determine the authorization of a given client to perform a request, the
Splinter REST API will be configured with a set of authorization handlers. These
handlers will be called by the authorization guard in the configured order with
the client's identity (as determined by the set of identity providers) as well
as data about the requested action, including a permission string and a set of
contextual data. The authorization handlers will each attempt to determine if
the client should be granted permission to make the request.

Each handler may allow, deny, or pass on the request. If a handler allows a
request, the guard will stop calling the authorization handlers and will pass on
the request to the appropriate handler for the requested endpoint. If a handler
denies a request, the guard will stop calling the authorization handlers and
will return a `401 Unauthorized` response to the client. If a handler passes on
a request, the guard will call the next authorization handler. If no
authorization handler provides an allow or deny decision, the authorization
guard will deny the request with a `401 Unauthorized` response.

Initially, three authorization handler implementations will be provided by
Splinter: a file-backed store of admin keys, a database-backed store for
role-based access control, and a "maintenance mode" handler.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Authorization Guard

The authorization guard for the Splinter REST API will be implemented in two
parts: a framework-agnostic function for performing authorization, and a
framework-specific component that calls the authorization function.

The authorization function will be defined as follows:

```rust
/// The possible outcomes of attempting to authorize a client
enum AuthorizationResult {
    /// The client was authorized to the given identity
    Authorized {
        identity: String,
        authorization: Authorization,
    },
    /// The requested endpoint does not require authorization
    NoAuthorizationNecessary,
    /// The authorization header could not be resolved to an identity or the
    /// client is not authorized to make the given request
    Unauthorized,
}

/// Uses the given identity providers to check authorization for the request.
/// This function is framework-agnostic and intended as a helper for the REST
/// API implementations.
///
/// # Arguments
///
/// * `endpoint` - The endpoint that is being requested. Example:
///   "/endpoint/path"
/// * `auth_header` - The value of the Authorization HTTP header for the request
/// * `identity_providers` - The identity providers that will be used to check
///   the client's identity
/// * `authorization_handlers` - The authorization handlers that will be used to
///   check the client's authorization
fn authorize(
    endpoint: &str,
    auth_header: Option<&str>,
    identity_providers: &[Box<dyn IdentityProvider>],
    authorization_handlers: &[Box<dyn AuthorizationHandler>],
) -> AuthorizationResult {
    // contents omitted for brevity
}
```

The framework-specific component will parse the request for the required data
(endpoint and authorization header) and, along with the REST API's configured
identity providers and authorization handlers, call the `authorize` function to
determine if the client is permitted to make the request.

### Identity Providers

Identity providers will resolve a request's `Authorization` header to a client
identity. These providers will be configured for the REST API based on the
authentication types supported. For instance, Biome credentials authentication
would provide its own identity provider, as would Cylinder JWT authentication
and OAuth authentication. For more on OAuth authentication, see the
[OAuth 2 REST API Authentication]({% link
community/planning/oauth2_rest_api_authentication.md %}) document.

The identity providers used by the REST API are configured indirectly. When
building the Splinter REST API, one or more authentication types will be
configured; based on the authentication types configured, the appropriate
identity providers will be created and used in the authorization guard.

The interface for identity providers will be defined using the following Rust
trait, located in the `splinter::rest_api::auth::identity` module:

```rust
/// A service that fetches identities from a backing provider
pub trait IdentityProvider: Send + Sync {
    fn get_identity(
        &self,
        authorization: &Authorization
    ) -> Result<String, IdentityProviderError>;

    fn clone_box(&self) -> Box<dyn IdentityProvider>;
}

/// The authorization that is passed to an `IdentityProvider`
#[derive(PartialEq)]
pub enum Authorization {
    Bearer(BearerToken),
    Custom(String),
}

/// A bearer token of a specific type
#[derive(PartialEq)]
pub enum BearerToken {
    // contents omitted for brevity
}
```

### Authorization Handlers

Authorization handlers are responsible for answering questions about whether a
client is permitted to perform a request. These handlers will be configured for
the REST API based on which sources are required for verifying permissions.

The interface for authorization handlers will be defined using the following
Rust code, located in the `splinter::rest_api::auth::authorization` module:

```rust
/// An error that may occur when using an [AuthorizationHandler]
#[derive(Debug)]
pub enum AuthorizationHandlerError {
    InternalError(InternalError),
}

impl fmt::Display for AuthorizationHandlerError {
    // contents omitted for brevity
}

impl Error for AuthorizationHandlerError {
    // contents omitted for brevity
}

/// An authorization handler's decision about whether to allow, deny, or pass on
/// the request
pub enum AuthorizationHandlerResult {
    Allow,
    Deny,
    Continue,
}

/// Determines if a client (identity) has the requested permissions (represented
/// by the permission ID)
pub trait AuthorizationHandler {
    fn has_permission(
        identity: &str,
        permission_id: &str
    ) -> Result<AuthorizationHandlerResult, AuthorizationHandlerError>;
}
```

### Admin Keys File Authorization Handler

An admin keys file will be used to grant all permissions to a set of keys. This
file will be called `admin_keys`, and it will live in the Splinter daemon's
configuration directory (`/etc/splinter` by default). This file will be a simple
list of public keys, separated by newlines.

This implementation provides no granular access control; the keys in the file
will have permission to perform any action in the system. This keys file has two
intended purposes:

* It provides a way to bootstrap permissions by allowing an administrator to set
up the Splinter node using the Splinter CLI with one of the configured keys.

* The keys defined in this file will have system-wide permissions even when all
other permissions have been disabled, such as when the node is in "maintenance
mode". This authorization source is a special case in this regard.

This authorization handler will be defined in the
`splinter::rest_api::auth::authorization::admin_keys` module as follows:

```rust
use std::time::SystemTime;

use cylinder::PublicKey;
use super::{
  AuthorizationHandler, AuthorizationHandlerError, AuthorizationHandlerResult
};

/// A file-backed authorization handler that permits admin keys
pub struct AdminKeysAuthorizationHandler {
    file_path: String,
    cached_keys: Vec<PublicKey>,
    last_read: SystemTime,
}

impl AdminKeysAuthorizationHandler {
    /// Creates a new handler backed by the file at the given path. This
    /// constructor will attempt to read the keys from the file; an error will
    /// be returned if the read fails.
    fn new(file_path: String) -> Result<Self, AuthorizationHandlerError> {
        // contents omitted for brevity
    }

    /// Gets the internal list of keys. If the backing file has been modified
    /// since the last read, attempt to refresh the cache.
    fn get_keys(&mut self) -> Vec<PublicKey> {
        // contents omitted for brevity
    }

    /// Reads the backing file and caches its contents.
    fn read_keys(&mut self) -> Result<(), AuthorizationHandlerError> {
        // contents omitted for brevity
    }
}

impl AuthorizationHandler for AdminKeysAuthorizationHandler {
    fn has_permission(
        identity: &str,
        _permission_id: &str
    ) -> Result<AuthorizationHandlerResult, AuthorizationHandlerError> {
        // check if `identity` is in the internal list of keys
    }
}
```

### Role-based Authorization Handler

A database-backed authorization handler will work as a role-based authorization
store. The store will be configured with a list of roles that each map to a set
of permissions. These roles will then be assigned to different identities. This
database-backed store can be used to assign roles to both users and signing
keys.

This authorization handler will be defined in the
`splinter::rest_api::auth::authorization::roles` module as follows:

```rust
use super::{
  AuthorizationHandler, AuthorizationHandlerError, AuthorizationHandlerResult
};

/// An authorization handler that assigns permissions to roles and roles to
/// identities
pub struct RoleBasedAuthorizationHandler {
    store: Box<dyn RoleBasedAuthorizationStore>,
}

impl RoleBasedAuthorizationHandler {
    // contents omitted for brevity
}

impl AuthorizationHandler for RoleBasedAuthorizationHandler {
    fn has_permission(
        identity: &str,
        permission_id: &str
    ) -> Result<AuthorizationHandlerResult, AuthorizationHandlerError> {
        // use the internal store to check the permissions for the identity
    }
}
```

The authorization store will be defined like a standard Splinter data store in
the `splinter::rest_api::auth::authorization::roles::store` module. This store
will be defined using the following API:

```rust
pub struct Role {
    id: String,
    display_name: String,
    permissions: Vec<String>,
}

pub struct RoleBuilder {
    // contents omitted for brevity
}

impl RoleBuilder {
    // contents omitted for brevity
}

pub struct RoleUpdateBuilder {
    // contents omitted for brevity
}

impl RoleUpdateBuilder {
    with_display_name(mut self, display_name: String) -> Self {
        // contents omitted for brevity
    }

    with_permissionss(mut self, permissions: Vec<String>) -> Self {
        // contents omitted for brevity
    }

    build(self) -> Role {
        // contents omitted for brevity
    }
}

pub struct Assignment {
    identity: Identity,
    roles: Vec<String>,
}

pub enum Identity {
    Key(String),
    User(String),
}

pub struct AssignmentBuilder {
    // contents omitted for brevity
}

impl AssignmentBuilder {
    // contents omitted for brevity
}

pub struct AssignmentUpdateBuilder {
    // contents omitted for brevity
}

impl AssignmentUpdateBuilder {
    with_roles(mut self, roles: Vec<String>) -> Self {
        // contents omitted for brevity
    }

    build(self) -> Assignment {
        // contents omitted for brevity
    }
}

pub trait RoleBasedAuthorizationStore {
    fn get_role(
      &self,
      id: &str,
    ) -> Result<Option<Role>, RoleBasedAuthorizationStoreError>;

    fn list_roles(
        &self,
    ) -> Result<
      Box<dyn ExactSizeIterator<Item = Role>>,
      RoleBasedAuthorizationStoreError,
    >;

    fn add_role(
      &self,
      role: Role,
  ) -> Result<(), RoleBasedAuthorizationStoreError>;

    fn update_role(
      &self,
      role: Role,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;

    fn remove_role(
      &self,
      role_id: &str,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;

    fn get_assignment(
        &self,
        identity: &Identity,
    ) -> Result<Option<Assignment>, RoleBasedAuthorizationStoreError>;

    fn list_assignments(
        &self,
    ) -> Result<
      Box<dyn ExactSizeIterator<Item = Assignment>>,
      RoleBasedAuthorizationStoreError,
    >;

    fn add_assignment(
        &self,
        assignment: Assignment,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;

    fn update_assignment(
        &self,
        assignment: Assignment,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;

    fn remove_assignment(
        &self,
        identity: &Identity,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;
}
```

The database implementation of this store will be implemented using the Diesel
crate. The database tables will be structured as follows:

```sql
CREATE TABLE IF NOT EXISTS roles (
    id           TEXT    PRIMARY KEY,
    display_name TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id           TEXT    NOT NULL,
    permission   TEXT    NOT NULL,
    PRIMARY KEY(id, permission),
    FOREIGN KEY (id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS identities (
    identity     TEXT    PRIMARY KEY,
    type         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
    identity     TEXT    NOT NULL,
    role_id      TEXT    NOT NULL,
    PRIMARY KEY(identity, role_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

#### Managing the Role-Based Authorization Store

The role-based authorization store will provide REST API endpoints for managing
roles and assignments. These endpoints will roughly correspond to the methods
provided by the store's trait. They will be:

* `GET /authorization/roles`
* `POST /authorization/roles`
* `GET /authorization/roles/{id}`
* `PATCH /authorization/roles/{id}`
* `DELETE /authorization/roles/{id}`
* `GET /authorization/identities`
* `POST /authorization/identities`
* `GET /authorization/identities/{identity}`
* `PATCH /authorization/identities/{identity}`
* `DELETE /authorization/identities/{identity}`

In addition to the REST API endpoints, a set of subcommands will be added to the
`splinter` CLI to manage the authorization store. The following commands will be
supported by the authorization store's REST API:

* `splinter role list [--format human,csv]`
* `splinter role show [--format human,csv] ROLE-ID`
* `splinter role create --perm PERMISSION-ID ... DISPLAY-NAME`
* `splinter role update [--dry-run] --add-perm PERMISSION-ID --rm-perm
  PERMISSION-ID ... ROLE-ID`
* `splinter role delete ROLE-ID`
* `splinter authid list [--type=key|user] [--format human,csv]`
* `splinter authid show [--format human,csv] IDENTITY`
* `splinter authid create --type=key|user --role ROLE-ID ... IDENTITY`
* `splinter authid update [--dry-run] --add-role ROLE-ID --rm-role ROLE-ID ...
  IDENTITY`
* `splinter authid delete IDENTITY`

Each of the above commands have the following options, which are standard for
the Splinter CLI:

* `--url <url>`
* `--key <key-file>`

### Maintenance Mode Authorization Handler

The maintenance mode authorization handler will allow a Splinter node's "write"
operations to be temporarily disabled. For the REST API, this means turning off
transaction handling, circuit creation/update/deletion, and anything else that
modifies the node's internal state. While in maintenance mode, the only clients
that are able to perform write operations are the keys listed in the admin keys
file.

The maintenance mode authorization handler will be defined in the
`splinter::rest_api::auth::authorization::maintenance` module as follows:

```rust
use super::{
  AuthorizationHandler, AuthorizationHandlerError, AuthorizationHandlerResult
};

/// An authorization handler that can temporarily disable write operations
pub struct MaintenanceModeAuthorizationHandler {
    writes_enabled: bool,
}

impl MaintenanceModeAuthorizationHandler {
    fn new() -> Self {
        Self { writes_enabled: true }
    }

    fn enable_writes(&mut self, enable_writes: bool) {
        self.writes_enabled = enable_writes;
    }

}
impl AuthorizationHandler for MaintenanceModeAuthorizationHandler {
    fn has_permission(
        _identity: &str,
        permission_id: &str
    ) -> Result<AuthorizationHandlerResult, AuthorizationHandlerError> {
        // if permission is a write permission and writes are disabled,
        // return AuthorizationHandlerResult::Deny, otherwise
        // AuthorizationHandlerResult::Continue
    }
}
```

### Authorization Handler Configuration

Because the Splinter REST API evaluates the authorization handlers in order, the
order in which they're configured is important. To support the desired behavior,
the authorization handlers will be configured in the following order:

1. Admin keys file
1. Maintenance mode
1. Role-based

This order ensures that the keys listed in the admin keys file are always
allowed to perform any action, even when maintenance mode is turned on, while
the role-based permissions are ignored when a permission has been temporarily
disabled by maintenance mode.

### Permission Definitions

Permissions will be defined in the code for the various Splinter REST API
endpoints. Permission definitions will use the following Rust struct defined in
the `splinter::rest_api::auth` module:

```rust
pub struct Permission {
    id: String,
    display_name: String,
    description: String,
}
```

## Prior art
[prior-art]: #prior-art

The `AdminKeysAuthorizationHandler` borrows its file-loading strategy from
Splinter's `LocalYamlRegistry`.

The `RoleBasedAuthorizationStore` is based on the standard Splinter store design
guidelines.

## Unresolved questions
[unresolved]: #unresolved

* How/where are permissions defined, and how are requests translated into
  permissions? This design needs to take into account that some endpoints may
  provide access to certain users based on some path or query parameters (such
  as the Biome endpoints, where a normal user would likely have permission to
  modify their own keys).

* What is the set of data required by the `authorize` method and authorization
  handlers?

* How is maintenance mode enabled? This may be done through a REST API endpoint
  with a corresponding CLI subcommand.

* What is the list of permissions defined for the Splinter REST API, and which
  permissions apply to which endpoints?

* Should the role-based authorization store have a predefined set of roles, such
  as "admin"?
