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
verify if the client is permitted to make the request. This process is generally
as follows:

1. Determine the permission that applies to the requested endpoint
1. Parse the `Authorization` HTTP header into a known format
1. Query the set of configured identity providers to resolve the authorization
   header to a client identity
1. Query the set of configured authorization handlers to determine if the client
   has been granted the permission

### Permissions

Each REST API endpoint will declare a permission that is required to use the
endpoint. When these endpoints are added to the REST API builder on startup,
the REST API will assemble a map that it will use to determine which permission
to check for a requested endpoint.

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
    /// The client was authorized to the given identity based on the authorization header
    Authorized(Identity),
    /// The requested endpoint does not require authorization
    NoAuthorizationNecessary,
    /// The authorization header is empty or invalid
    Unauthorized,
    /// The request endpoint is not defined
    UnknownEndpoint,
}

/// Uses the given identity providers to check authorization for the request. This function is
/// backend-agnostic and intended as a helper for the backend REST API implementations.
///
/// # Arguments
///
/// * `method` - The HTTP method used for the request
/// * `endpoint` - The endpoint that is being requested. Example: "/endpoint/path"
/// * `auth_header` - The value of the Authorization HTTP header for the request
/// * `identity_providers` - The identity providers that will be used to check the client's identity
/// * `authorization_handlers` - The authorization handlers that will be used to check the client's
///   permissions
fn authorize(
    method: &Method,
    endpoint: &str,
    auth_header: Option<&str>,
    permission_map: &PermissionMap,
    identity_providers: &[Box<dyn IdentityProvider>],
    authorization_handlers: &[Box<dyn AuthorizationHandler>],
) -> AuthorizationResult {
    // contents omitted for brevity
}
```

The contents of the `authorize` function are described in the
[guide-level explanation](#guide-level-explanation).

The framework-specific component will parse the request for the required data
(method, endpoint, and authorization header) and, along with the REST API's
configured permission map, identity providers, and authorization handlers, call
the `authorize` function to determine if the client is permitted to make the
request.

The framework-specific piece of the authorization guard will handle the
`AuthorizationResult` returned by the `authorize` function as follows:

* `Authorized` - The returned identity will be injected into the request for
  endpoints to use as needed (some endpoints perform operations based on the
  authenticated user)
* `NoAuthorizationNecessary` - No special actions are necessary
* `Unauthorized` - A `401 Unauthorized` response will be returned to the client
* `UnknownEndpoint` - A `404 Not Found` response will be returned to the client

### Permissions

Permissions will be declared by all Splinter REST API endpoints. Permission
definitions will use the following Rust enum defined in the
`splinter::rest_api::auth::authorization` module:

```rust
/// A permission assigned to an endpoint
pub enum Permission {
    /// Check that the authenticated client has the specified permission.
    Check {
        /// The permission ID that's passed to [`AuthorizationHandler::has_permission`]
        permission_id: &'static str,
        /// The human-readable name for the permission
        permission_display_name: &'static str,
        /// A description for the permission
        permission_description: &'static str,
    },
    /// Allow any request that has been authenticated (the client's identity has been determined).
    /// This may be used by endpoints that need to know the client's identity but do not require a
    /// special permission to be checked (the Biome key management and OAuth logout routes are an
    /// example of this).
    AllowAuthenticated,
    /// Allow any request without checking for authorization.
    AllowUnauthenticated,
}
```

Each of these permissions is handled differently by the authorization guard:

* `Check` - The authorization guard will check the client's identity and the
  permission ID against the configured set of authorization handlers to
  determine if the permission has been granted to the client. This is a standard
  permission.
* `AllowAuthenticated` - The authorization guard will only require that the
  client's identity could be determined from the `Authorization` header by one
  of the configured identity providers.
* `AllowUnauthenticated` - The authorization guard will not perform any
  authentication or authorization for the request. This is typically used for
  login endpoints.

Permissions may be shared by multiple endpoints; for example, the REST API
endpoints for listing circuits and showing individual circuits will share the
`circuit.read` permission.

The permission IDs defined in `Permission::Check` declarations should consist of
one or more namespaces separted by `.` and ending with either `.read` or
`.write`. The `circuit.read` permission mentioned above is an example of a
read-only permission; the ID `component.subcomponent.write` is an example of a
write permission. This format is not enforced, but strongly encouraged.

#### Permission Map

These permissions are declared in the `Resource` definitions for all REST API
endpoints. When the `Resource` definitions are added to the Splinter REST API's
builder, the builder creates a specialized `PermissionMap` that will be used by
the authorization guard to map requests--(method, endpoint) pairs--to the
appropriate permissions. The `PermissionMap` will be defined in the
`splinter::rest_api::auth::authorization` module as follows:

```rust
/// A map used to correlate requests with the permissions that guard them.
pub(in crate::rest_api) struct PermissionMap {
    internal: Vec<(RequestDefinition, Permission)>,
}

impl PermissionMap {
    pub fn new() -> Self {
        // contents omitted for brevity
    }

    /// Gets a list of all permissions.
    pub fn permissions(&self) -> impl Iterator<Item = Permission> + '_ {
        // contents omitted for brevity
    }

    /// Sets the permission for the given (method, endpoint) pair. The endpoint may contain path
    /// variables surrounded by `{}`.
    pub fn add_permission(&mut self, method: Method, endpoint: &str, permission: Permission) {
        // contents omitted for brevity
    }

    /// Gets the permission for a request. This will attempt to match the method and endpoint to a
    /// known (method, endpoint) pair, considering path variables of known endpoints.
    pub fn get_permission(&self, method: &Method, endpoint: &str) -> Option<&Permission> {
        // contents omitted for brevity
    }

    /// Takes the contents of another `PermissionMap` and merges them into itself. This consumes the
    /// contents of the other map.
    pub fn append(&mut self, other: &mut PermissionMap) {
        // contents omitted for brevity
    }
}

/// A (method, endpoint) definition that will be used to match requests
struct RequestDefinition {
    method: Method,
    path: Vec<PathComponent>,
}

impl RequestDefinition {
    pub fn new(method: Method, endpoint: &str) -> Self {
        // contents omitted for brevity
    }

    /// Checks if the given request matches this definition, considering any variable path
    /// components.
    pub fn matches(&self, method: &Method, endpoint: &str) -> bool {
        // contents omitted for brevity
    }
}

/// A component of an endpoint path
enum PathComponent {
    /// A standard path component where matching is done on the internal string
    Text(String),
    /// A variable path component that matches any string
    Variable,
}

impl From<&str> for PathComponent {
    // contents omitted for brevity
}

impl PartialEq<&str> for PathComponent {
    // contents omitted for brevity
}
```

#### Permission Details

To aid the discovery and assignment of permissions, the Splinter REST API will
automatically provide a `GET /authorization/permissions` endpoint that will list
all permissions declared by the REST API's configured endpoints. Each entry in
the returned list will include the permission's ID, display name, and
description.

Additionally, the `splinter permissions` command will be added to the Splinter
CLI for displaying this list in a table, CSV, or JSON format.

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
    /// Attempts to get the identity that corresponds to the given authorization header. This method
    /// will return `Ok(None)` if the identity provider was not able to resolve the authorization
    /// to an identity.
    fn get_identity(
        &self,
        authorization: &AuthorizationHeader,
    ) -> Result<Option<Identity>, InternalError>;
}

/// A parsed authorization header
pub enum AuthorizationHeader {
    Bearer(BearerToken),
    Custom(String),
}

/// A bearer token of a specific type
pub enum BearerToken {
    /// Contains a Biome JWT
    Biome(String),
    /// Contains a custom token, which is any bearer token that does not match one of the other
    /// variants of this enum
    Custom(String),
    /// Contains a Cylinder JWT
    Cylinder(String),
    /// Contains an OAuth2 token
    OAuth2(String),
}
```

### Authorization Handlers

Authorization handlers are responsible for answering questions about whether a
client is permitted to perform a request. These handlers will be configured for
the REST API based on which sources are required for verifying permissions.

The interface for authorization handlers will be defined using the following
Rust code, located in the `splinter::rest_api::auth::authorization` module:

```rust
use crate::error::InternalError;

use super::identity::Identity;

/// An authorization handler's decision about whether to allow, deny, or pass on the request
pub enum AuthorizationHandlerResult {
    /// The authorization handler has granted the requested permission
    Allow,
    /// The authorization handler has denied the requested permission
    Deny,
    /// The authorization handler is not able to determine if the requested permission should be
    /// granted or denied
    Continue,
}

/// Determines if a client has some permissions
pub trait AuthorizationHandler: Send + Sync {
    /// Determines if the given identity has the requested permission
    fn has_permission(
        &self,
        identity: &Identity,
        permission_id: &str,
    ) -> Result<AuthorizationHandlerResult, InternalError>;=
}
```

### Allow Keys File Authorization Handler

An allow keys file will be used to grant all permissions to a set of keys. This
file will be called `allow_keys`, and it will live in the Splinter daemon's
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
`splinter::rest_api::auth::authorization::allow_keys` module as follows:

```rust
use std::time::SystemTime;

use crate::error::InternalError;
use crate::rest_api::auth::identity::Identity;

use super::{AuthorizationHandler, AuthorizationHandlerResult};

/// A file-backed authorization handler that permits admin keys
pub struct AllowKeysAuthorizationHandler {
    internal: Arc<Mutex<Internal>>,
}

impl AllowKeysAuthorizationHandler {
    /// Constructs a new `AllowKeysAuthorizationHandler`. If the backing file already exists, it
    /// will be loaded and cached; if the backing file doesn't already exist, it will be created.
    ///
    /// # Arguments
    ///
    /// * `file_path` - The path of the backing allow keys file.
    pub fn new(file_path: &str) -> Result<Self, InternalError> {
        // contents omitted for brevity
    }
}

impl AuthorizationHandler for AllowKeysAuthorizationHandler {
    fn has_permission(
        &self,
        identity: &Identity,
        _permission_id: &str,
    ) -> Result<AuthorizationHandlerResult, InternalError> {
        // Allow if `identity` is in the internal list of keys, otherwise continue
    }
}

/// Internal state of the authorization handler
struct Internal {
    file_path: String,
    cached_keys: Vec<String>,
    last_read: SystemTime,
}

impl Internal {
    fn new(file_path: &str) -> Result<Self, InternalError> {
        // load keys from file or create file if necessary
    }

    /// Gets the internal list of keys. If the backing file has been modified since the last read,
    /// attempts to refresh the cache. If the file is unavailable, clears the cache.
    fn get_keys(&mut self) -> &[String] {
        // contents omitted for brevity
    }

    /// Reads the backing file and caches its contents, logging an error for any key that can't be
    /// read
    fn read_keys(&mut self) -> Result<(), InternalError> {
        // contents omitted for brevity
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
`splinter::rest_api::auth::authorization::rbac` module as follows:

```rust
use crate::error::InternalError;
use crate::rest_api::auth::authorization::{AuthorizationHandler, AuthorizationHandlerResult};

use super::store::RoleBasedAuthorizationStore;

/// A Role-based authorization handler.
pub struct RoleBasedAuthorizationHandler {
    role_based_auth_store: Box<dyn RoleBasedAuthorizationStore>,
}

impl RoleBasedAuthorizationHandler {
    /// Construct a new role-based authorization handler with the given store.
    pub fn new(role_based_auth_store: Box<dyn RoleBasedAuthorizationStore>) -> Self {
        // contents omitted for brevity
    }
}

impl AuthorizationHandler for RoleBasedAuthorizationHandler {
    fn has_permission(
        identity: &str,
        permission_id: &str
    ) -> Result<AuthorizationHandlerResult, AuthorizationHandlerError> {
        // Allow if `identity` has been assigned a role with the given permission in the store,
        // otherwise continue
    }
}
```

The authorization store will be defined like a standard Splinter data store in
the `splinter::rest_api::auth::authorization::roles::store` module. This store
will be defined using the following API:

```rust
pub use error::RoleBasedAuthorizationStoreError;

/// A Role is a named set of permissions.
pub struct Role {
    id: String,
    display_name: String,
    permissions: Vec<String>,
}

impl Role {
    // contents omitted for brevity
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

/// An identity that may be assigned roles.
pub enum Identity {
    /// A public key-based identity.
    Key(String),
    /// A user ID-based identity.
    User(String),
}

/// An assignment of roles to a particular identity.
pub struct Assignment {
    identity: Identity,
    roles: Vec<String>,
}

impl Assignment {
    // contents omitted for brevity
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

/// Defines methods for CRUD operations on Role and assignment data.
pub trait RoleBasedAuthorizationStore: Send + Sync {
    /// Returns the role for the given ID, if one exists.
    fn get_role(&self, id: &str) -> Result<Option<Role>, RoleBasedAuthorizationStoreError>;

    /// Lists all roles.
    fn list_roles(
        &self,
    ) -> Result<Box<dyn ExactSizeIterator<Item = Role>>, RoleBasedAuthorizationStoreError>;

    /// Adds a role.
    ///
    /// # Errors
    ///
    /// Returns a `ConstraintViolation` error if a duplicate role ID is added.
    fn add_role(&self, role: Role) -> Result<(), RoleBasedAuthorizationStoreError>;

    /// Updates a role.
    ///
    /// # Errors
    ///
    /// Returns a `InvalidState` error if the role does not exist.
    fn update_role(&self, role: Role) -> Result<(), RoleBasedAuthorizationStoreError>;

    /// Removes a role.
    ///
    /// # Errors
    ///
    /// Returns a `InvalidState` error if the role does not exist.
    fn remove_role(&self, role_id: &str) -> Result<(), RoleBasedAuthorizationStoreError>;

    /// Returns the role for the given Identity, if one exists.
    fn get_assignment(
        &self,
        identity: &Identity,
    ) -> Result<Option<Assignment>, RoleBasedAuthorizationStoreError>;

    /// Returns the assigned roles for the given Identity.
    fn get_assigned_roles(
        &self,
        identity: &Identity,
    ) -> Result<Box<dyn ExactSizeIterator<Item = Role>>, RoleBasedAuthorizationStoreError>;

    /// Lists all assignments.
    fn list_assignments(
        &self,
    ) -> Result<Box<dyn ExactSizeIterator<Item = Assignment>>, RoleBasedAuthorizationStoreError>;

    /// Adds an assignment.
    ///
    /// # Errors
    ///
    /// Returns a `ConstraintViolation` error if there is a duplicate assignment of a role to an
    /// identity.
    fn add_assignment(
        &self,
        assignment: Assignment,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;

    /// Updates an assignment.
    ///
    /// # Errors
    ///
    /// Returns a `InvalidState` error if the assignment does not exist.
    fn update_assignment(
        &self,
        assignment: Assignment,
    ) -> Result<(), RoleBasedAuthorizationStoreError>;

    /// Removes an assignment.
    ///
    /// # Errors
    ///
    /// Returns a `InvalidState` error if the assignment does not exist.
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
    role_id      TEXT    NOT NULL,
    permission   TEXT    NOT NULL,
    PRIMARY KEY(role_id, permission),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS identities (
    identity      TEXT    PRIMARY KEY,
    identity_type INTEGER NOT NULL
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
* `GET /authorization/roles/{role_id}`
* `PATCH /authorization/roles/{role_id}`
* `DELETE /authorization/roles/{role_id}`
* `GET /authorization/assignments`
* `POST /authorization/assignments`
* `GET /authorization/assignments/{identity_type}/{identity}`
* `PATCH /authorization/assignments/{identity_type}/{identity}`
* `DELETE /authorization/assignments/{identity_type}/{identity}`

In addition to the REST API endpoints, a set of subcommands will be added to the
`splinter` CLI to manage the authorization store. The following commands will be
supported by the authorization store's REST API:

* `splinter role list [--format human,csv]`
* `splinter role show [--format human,csv] ROLE-ID`
* `splinter role create --perm PERMISSION-ID --display DISPLAY-NAME ... ROLE-ID`
* `splinter role update [--dry-run] [--rm-all] [--force] --display DISPLAY-NAME
  --add-perm PERMISSION-ID --rm-perm PERMISSION-ID ... ROLE-ID`
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
that are able to perform write operations are the keys listed in the allow keys
file or identities that have been assigned the special `admin` role in the
role-based authorization store.

The maintenance mode authorization handler will be defined in the
`splinter::rest_api::auth::authorization::maintenance` module as follows:

```rust
use crate::error::InternalError;
use crate::rest_api::auth::{
  authorization::rbac::store::RoleBasedAuthorizationStore, identity::Identity
};

use super::{AuthorizationHandler, AuthorizationHandlerResult};

/// An authorization handler that allows write permissions to be temporarily revoked
pub struct MaintenanceModeAuthorizationHandler {
    maintenance_mode: Arc<AtomicBool>,
    rbac_store: Option<Box<dyn RoleBasedAuthorizationStore>>,
}

impl MaintenanceModeAuthorizationHandler {
    pub fn new(rbac_store: Option<Box<dyn RoleBasedAuthorizationStore>>) -> Self {
        // contents omitted for brevity
    }

    /// Returns whether or not maintenance mode is enabled
    pub fn is_maintenance_mode_enabled(&self) -> bool {
        // contents omitted for brevity
    }

    /// Sets whether or not maintenance mode is enabled
    pub fn set_maintenance_mode(&self, maintenance_mode: bool) {
        // contents omitted for brevity
    }

}
impl AuthorizationHandler for MaintenanceModeAuthorizationHandler {
    fn has_permission(
        &self,
        identity: &Identity,
        permission_id: &str,
    ) -> Result<AuthorizationHandlerResult, AuthorizationHandlerError> {
        // if permission is a write permission, writes are disabled, and identity does not have the
        // "admin" role in the RBAC store, deny; otherwise continue
    }
}
```

### Authorization Handler Configuration

Because the Splinter REST API evaluates the authorization handlers in order, the
order in which they're configured is important. To support the desired behavior,
the authorization handlers will be configured in the following order:

1. Allow keys file
1. Maintenance mode
1. Role-based

This order ensures that the keys listed in the allow keys file are always
allowed to perform any action, even when maintenance mode is turned on, while
the role-based permissions are ignored when a permission has been temporarily
disabled by maintenance mode (unless the identity has the `admin` role).

## Prior art
[prior-art]: #prior-art

The `AllowKeysAuthorizationHandler` borrows its file-loading strategy from
Splinter's `LocalYamlRegistry`.

The `RoleBasedAuthorizationStore` is based on the standard Splinter store design
guidelines.

## Unresolved questions
[unresolved]: #unresolved

* How is maintenance mode enabled? This may be done through a REST API endpoint
  with a corresponding CLI subcommand.

* Should the role-based authorization store have a predefined set of roles, such
  as "admin"?
