# Biome OAuth Integration
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This RFC proposes adding a linkage between an OAuth user id and a biome userid.
This change enables support of signing key management on behalf of a user that
has authenticated via an OAuth provider.

## Motivation
[motivation]: #motivation

OAuth authentication provides Splinter with a way to integrate with other user
management systems. These systems can include public providers, such as Github
or Google, or internal single-sign-on installations that provide OAuth2
capabilities.

When using Canopy applications, signing key management is provided by the Biome
REST API endpoints that may be exposed by a splinter daemon. These keys are tied
to a user ID that is currently only linked to Biome user credentials. In order
to connect an OAuth user to keys, we need a link between a user ID and the OAuth
user ID.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

To support this change, we will introduce a new store for saving the OAuth user
information.  This OAuthUserStore will manage the linkage between a user ID and
the information required about an OAuth user.

The information required for the OAuth user is:

* provider user identifier: this is the identifier for the user within the
  OAuth2 provider's system.  For example, email address in Google or Github
  account name.
* access token: the currently valid OAuth2 access token
* refresh token: a refresh token, if one is provided
* provider id: this is an id of the provider used.

This information will be associated with a user ID, which is required to exist
in the UserStore.  Implementations backed by databases, such as PostgreSQL, may
optimize how this requirement is checked.

This store will be used when the authorization process is completed to provide a
biome user ID back to the client.  Before the callback returns the information
to the client, it should check for the existence of the OAuth user.  If one does
not exist, a user ID and an OAuth user should be created in tandem.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

The OAuthUserStore will be defined by the following trait, in the module
`splinter::biome::oauth`:

```rust
use crate::error::{InternalError, ConstraintViolation};

#[derive(Debug)]
pub enum OAuthUserStoreError {
    InternalError(InternalError),
    ConstraintViolation(ConstraintViolation),
}

impl std::error::Error for OAuthUserStoreError {
    // contents omitted for brevity
}

impl std::fmt::Display for OAuthUserStoreError {
    // contents omitted for brevity
}

pub enum OAuthProvider {
    Github,
}

/// The OAuthUser links the user information from an OAuth user with a Biome
/// user ID.
pub struct OAuthUser {
    user_id: String,
    provider_user_identifier: String,

    access_token: String,
    refresh_token: Option<String>,
    provider: Provider,
}

impl OAuthUser {
    pub fn user_id(&self) -> &str {
        &self.user_id
    }

    pub fn provider_user_identifier(&self) -> &str {
        &self.provider_user_identifier
    }

    pub fn access_token(&self) -> &str {
        &self.access_token
    }

    pub fn refresh_token(&self) -> Option<&str> {
        self.refresh_token.as_deref()
    }

    pub fn provider(&self) -> &OAuthProvider {
        &self.provider
    }

    /// Convert this OAuthUser into an update builder.
    pub fn into_update_builder(self) -> OAuthUserUpdateBuilder {
        // contents omitted for brevity
    }
}

/// Builds new `OAuthUser` structs.
pub struct OAuthUserBuilder {
    // contents omitted for brevity
}

/// Builds an updated `OAuthUser` struct.
///
/// This builder only allows changes to the fields on an OAuthUser that may be
/// updated.
pub struct OAuthUserUpdateBuilder {
    // contents omitted for brevity
}

impl OAuthUserUpdateBuilder {
    pub fn with_access_token(mut self, access_token: String) -> Self {
        // contents omitted for brevity
    }

    pub fn with_refresh_token(mut self, access_token: String) -> Self {
        // contents omitted for brevity
    }

    pub fn build(self) -> Result<OAuthUser, InvalidStateError> {
        // contents omitted for brevity
    }
}

/// Defines methods for CRUD operations and fetching OAuth user information.
pub trait OAuthUserStore {
    /// Add an OAuthUser to the store.
    ///
    /// # Errors
    ///
    /// Returns a ConstraintViolation if either there already is a user ID
    /// associated with another provider identity, or the provider identity has
    /// already been associated with a user ID.
    fn add_oauth_user(&self, oauth_user: OAuthUser)
        -> Result<(), OAuthUserStoreError>;

    /// Update the the access token an/or refre
    fn update_oauth_user(
        &self,
        oauth_user: OAuthUser
    ) -> Result<(), OAuthUserStoreError>;

    /// Returns the stored OAuth user based on the identifier specified by an
    /// OAuth provider.
    fn get_by_provider_user_identity(
        &self,
        provider_user_identifier: &str,
    ) -> Result<Option<OAuthUser>, OAuthUserStoreError>;

    /// Returns the stored OAuth user based on the biome user ID.
    fn get_by_user_id(&self, user_id: &str)
        -> Result<Option<OAuthUser>, OAuthUserStoreError>;
}
```

These traits would be used in tandem with the existing `UserStore` to create a
new `OAuthUser`, if necessary.

Once an `OAuthUser` has been created and stored, subsequent authorization checks
can use this information to provide the user id for calls to the key store and
the like.

## Drawbacks
[drawbacks]: #drawbacks

The drawbacks of this method are similar to those that exist in other biome
stores: namely the limitations of the current architecture to provide
transactional capabilities across stores.  This is considered a very hard
problem, and has no immediate solution.

## Rationale and alternatives
[rationale-and-alternatives]: #rationale-and-alternatives

This follows the standard biome store model.

## Prior art
[prior-art]: #prior-art

This follows the standard biome store model.

## Unresolved Questions
[unresolved]: #unresolved

None.
