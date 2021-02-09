# REST API Maintenance Mode
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

The maintenance mode authorization handler will allow administrators to
temporarily disable operations that modify the state of the Splinter node.

## Motivation
[motivation]: #motivation

It may be necessary to perform maintenance activities on a Splinter node, during
which time "write" operations could interfere with maintenance or cause
unexpected behavior. The maintenance mode authorization handler will enable
administrators to control when internal state can or cannot be modified.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

The maintenance mode authorization handler will allow a Splinter node's "write"
operations to be temporarily disabled. For the REST API, this means turning off
transaction handling, circuit creation/update/deletion, and anything else that
modifies the node's internal state. Specifically, a write operation is
considered to be any endpoint whose permission ID does not end in `.read`.

While in maintenance mode, the only clients that are able to perform write
operations are the keys listed in the allow keys file or identities that have
been assigned the special `admin` role in the role-based authorization store.

For more on the allow keys file and the role-based authorization store, see the
[Splinter REST API Authorization design]({% link
community/planning/rest_api_authorization.md %}).

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Authorization Handler Implementation

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

### Managing Maintenance Mode

The maintenance mode authorization handler will provide the following REST API
endpoints:

* `GET /authorization/maintenance` for checking if maintenance mode is enabled
* `POST /authorization/maintenance` for enabling/disabling maintenance mode

Additionally, the following commands will be added to the Splinter CLI for
managing maintenance mode:

* `splinter maintenance status`
* `splinter maintenance enable`
* `splinter maintenance disable`

### Configuration

To achieve the desired behavior of the maintenance mode authorization handler
with respect to the other authorization handlers, `splinterd` will configure the
authorization handlers in the following order:

1. Allow keys file
1. Maintenance mode
1. Role-based

This order ensures that the keys listed in the allow keys file are always
allowed to perform any action, even when maintenance mode is turned on, while
the role-based permissions are ignored when a permission has been temporarily
disabled by maintenance mode (unless the identity has the `admin` role).

## Unresolved questions
[unresolved]: #unresolved

* Should maintenance mode be persistent across restarts? How would this be
  accomplished?
