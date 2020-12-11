# Biome OAuth Integration
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This RFC proposes adding a new Biome store for tracking OAuth sessions and
an OAuth user identity with a Biome user ID. This change enables support of user
notifications and signing key management on behalf of a user that has
authenticated via an OAuth provider instead of Biome's own credentials
authentication.

## Motivation
[motivation]: #motivation

OAuth authentication provides Splinter with a way to integrate with other user
management systems. These systems can include public providers, such as Github
or Google, or internal single-sign-on installations that provide OAuth2
capabilities.

This new store will serve four purposes:

* This store will provide a link between a Biome user ID and an OAuth user ID to
  connect an OAuth user to notification and keys. This is required by Canopy
  applications, where signing key management is provided by the Biome REST API
  endpoints that may be exposed by a Splinter daemon.

* This store will enable the Splinter REST API to cache a user's authorization
  so that it doesn't need to check the authorization for each request. The store
  will track the last time the user was authenticated and, after some period of
  time, the REST API will re-authenticate the user.

* This store will keep track of the refresh token associated with an OAuth
  session, which may be needed in the future to keep a user's session going.

* This store will allow the Splinter REST API to provide a custom access token
  that is associated with the OAuth access token. This is important because the
  Splinter REST API should not directly expose the OAuth access token for
  security reasons.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

This change will introduce a new store for saving the OAuth user session info.
This `OAuthUserSessionStore` will manage the linkage between a user ID and the
information about an OAuth user and their active sessions.

The information required for the OAuth user is:

* Subject identifier: the unique identifier for the user within the OAuth2
  provider's system.
* OAuth access token: an OAuth2 access token for validating the user's
  authentication with the OAuth provider.
* OAuth refresh token: an refresh token for getting a new access token from the
  OAuth provider (this is optional as not all OAuth providers have expiring
  access tokens).
* Splinter access token: the access token created and issued by the Splinter
  REST API for the authenticated user's session.

This information will be associated with a Biome user ID, which is a generated
UUID.

Two initial implementations will be provided: one with in-memory storage, and
another backed by a database via the Diesel crate.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

The `OAuthUserSessionStore` will be defined by the following trait, in the
module `splinter::biome::oauth`:

```rust
use std::time::SystemTime;

use crate::error::{ConstraintViolation, InternalError, InvalidStateError};

/// Errors that may be returned by the `OAuthUserSessionStore`
#[derive(Debug)]
pub enum OAuthUserSessionStore {
    InternalError(InternalError),
    ConstraintViolation(ConstraintViolation),
}

impl std::error::Error for OAuthUserSessionStoreError {
    // contents omitted for brevity
}

impl std::fmt::Display for OAuthUserSessionStoreError {
    // contents omitted for brevity
}

/// Correlates an OAuth user (subject) with a Biome user ID
pub struct OAuthUser {
    id: String,
    subject: String,
}

impl OAuthUser {
    fn new(id: String, subject: String) -> Self {
        Self { id, subject }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn subject(&self) -> &str {
        &self.subject
    }
}

/// Contains data associated with an OAuth user's session
pub struct OAuthUserSession {
    splinter_access_token: String,
    subject: String,
    oauth_access_token: String,
    oauth_refresh_token: Option<String>,
    last_authenticated: SystemTime,
}

impl OAuthUserSession {
    pub fn splinter_access_token(&self) -> &str {
        &self.splinter_access_token
    }

    pub fn subject(&self) -> &str {
        &self.subject
    }

    pub fn oauth_access_token(&self) -> &str {
        &self.oauth_access_token
    }

    pub fn oauth_refresh_token(&self) -> Option<&str> {
        self.oauth_refresh_token.as_deref()
    }

    pub fn last_authenticated(&self) -> SystemTime {
        self.last_authenticated
    }

    pub fn into_update_builder(self) -> OAuthUserSessionUpdateBuilder {
        // contents omitted for brevity
    }
}

/// Builds an updated [OAuthUserSession]
///
/// This builder only allows changes to the fields of a session that may be
/// updated.
pub struct OAuthUserSessionUpdateBuilder {
    // contents omitted for brevity
}

impl OAuthUserSessionUpdateBuilder {
    pub fn with_oauth_access_token(
        mut self,
        oauth_access_token: String,
    ) -> Self {
        // contents omitted for brevity
    }

    pub fn with_oauth_refresh_token(
        mut self,
        oauth_refresh_token: String,
    ) -> Self {
        // contents omitted for brevity
    }

    pub fn build(self) -> Result<OAuthUserSession, InvalidStateError> {
        // contents omitted for brevity
    }
}

/// A new OAuth user session to be stored
///
/// Unlike [OAuthUserSession], this struct does not contain a
/// `last_authenticated` timestamp, since this value will be set internally by
/// the store.
pub struct NewOAuthUserSession {
    // contents omitted for brevity
}

impl NewOAuthUserSession {
    // contents omitted for brevity
}

/// Builds [NewOAuthUserSession]s
pub struct NewOAuthUserSessionBuilder {
    // contents omitted for brevity
}

impl NewOAuthUserSessionBuilder {
    // contents omitted for brevity
}

/// Defines methods for CRUD operations and fetching OAuth session information.
pub trait OAuthUserSessionStore {
    /// Adds an OAuth session. This will generate a new OAuth user entry if one
    /// does not already exist for the session's subject.
    ///
    /// # Errors
    ///
    /// Returns a `ConstraintViolation` error if a session with the given
    /// `splinter_access_token` already exists.
    fn add_session(
        &self,
        session: OAuthUserSession,
    ) -> Result<(), OAuthUserStoreError>;

    /// Updates the the OAuth access and/or refresh token for a session. This
    /// will set the "last authenticated" value of the session to the current
    /// time.
    ///
    /// # Errors
    ///
    /// Returns a `ConstraintViolation` error if there is no session with the
    /// given `splinter_access_token` or if any field other than
    /// `oauth_access_token` or `oauth_refresh_token` have been changed
    fn update_session(
        &self,
        session: OAuthUserSession
    ) -> Result<(), OAuthUserStoreError>;

    /// Returns an OAuth session based on the provided Splinter access token.
    fn get_session(
        &self,
        splinter_access_token: &str
    ) -> Result<Option<OAuthUserSession>, OAuthUserStoreError>;

    /// Returns the [OAuthUser] struct for the given subject.
    fn get_user(
        &self,
        subject: &str
    ) -> Result<Option<OAuthUser>, OAuthUserStoreError>;
}
```

The database-backed implementation of this store will be comprised of two
tables: the `oauth_users` table and the `oauth_user_sessions` table.

The `oauth_users` table will associate the user's OAuth identity (the identity
of the user according to the configured OAuth provider, such as a username or a
subject identifier) with a unique Biome user ID. The table will be defined as:

```sql
CREATE TABLE IF NOT EXISTS oauth_users (
  user_id                   TEXT        PRIMARY KEY,
  subject                   TEXT        NOT NULL
);
```

The `user_id` value will be a UUID generated by the store. To ensure uniqueness
of these user IDs with respect to user IDs generated by the Biome credentials
store, these user IDs will be namespaced to this table.

The `oauth_user_sessions` table will track each active session that has been
initiated by a user. The table will be defined as:

```sql
CREATE TABLE IF NOT EXISTS oauth_user_sessions (
  splinter_access_token     TEXT        PRIMARY KEY,
  subject                   TEXT        NOT NULL,
  oauth_access_token        TEXT        NOT NULL,
  oauth_refresh_token       TEXT,
  last_authenticated        TEXT        NOT NULL,
  FOREIGN KEY (subject) REFERENCES oauth_users(subject) ON DELETE CASCADE
);
```

The `splinter_access_token` will be a value that is randomly generated by the
Splinter REST API. The `oauth_access_token` and `oauth_refresh_token` will be
used to periodically re-authenticate with the OAuth provider. The
`last_authenticated` timestamp will be used to determine when the user should be
re-authenticated with the OAuth provider (the Splinter REST API will determine
when this needs to be done). This timestamp will be generated internally by the
database, not by the Rust implementation.

By separating the user definitions and sessions into separate tables, we are
able to provide a stable user ID that can be correlated with other Biome tables
(such as `keys` and `user_notifications`) while also allowing 0 or more active
user sessions.

The storage of OAuth tokens in this Biome-specific store was intentionally
designed. While the development team acknowledges that the contents of the
`oauth_user_sessions` table are not user-specific (the same values would be used
to represent a non-user OAuth session, such as one using the client credentials
grant type), the table is contained within this store to keep the store
self-contained. The team has deemed it undesirable for the Splinter stores to
interact with external database tables. As such, the table has been explicitly
named to indicate that it will only contain user sessions. If non-user OAuth
authentication is implemented for Splinter, the tokens and other relevant data
will be stored in a separate store and database table.

## Drawbacks
[drawbacks]: #drawbacks

None

## Rationale and alternatives
[rationale-and-alternatives]: #rationale-and-alternatives

This follows the standard biome store model.

## Prior art
[prior-art]: #prior-art

This follows the standard biome store model.

## Unresolved Questions
[unresolved]: #unresolved

None.
