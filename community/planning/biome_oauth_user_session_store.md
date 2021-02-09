# Biome OAuth Integration
<!--
  Copyright 2018-2021 Cargill Incorporated
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
module `splinter::biome::oauth::store`:

```rust
use std::time::SystemTime;

/// Correlation between an OAuth user (subject) and a Biome user ID
pub struct OAuthUser {
    subject: String,
    user_id: String,
}

impl OAuthUser {
    // contents omitted for brevity
}

/// Data for an OAuth user's session that's in an [OAuthUserSessionStore]
pub struct OAuthUserSession {
    splinter_access_token: String,
    user: OAuthUser,
    oauth_access_token: String,
    oauth_refresh_token: Option<String>,
    last_authenticated: SystemTime,
}

impl OAuthUserSession {
    // accessor methods omitted for brevity

    /// Converts the session data into an update builder
    pub fn into_update_builder(
      self
    ) -> InsertableOAuthUserSessionUpdateBuilder {
        // contents omitted for brevity
    }
}

/// Builds a new [OAuthUserSession]
///
/// This builder should only be used by implementations of the
/// [OAuthUserSessionStore] for creating session data to return.
pub struct OAuthUserSessionBuilder {
    splinter_access_token: Option<String>,
    user: Option<OAuthUser>,
    oauth_access_token: Option<String>,
    oauth_refresh_token: Option<String>,
    last_authenticated: Option<SystemTime>,
}

impl OAuthUserSessionBuilder {
    // contents omitted for brevity
}

/// Data for an OAuth user's session that can be inserted into an
/// [OAuthUserSessionStore]
///
/// Unlike [OAuthUserSession], this struct does not contain a
/// `last_authenticated` timestamp or the user's Biome user ID; this is because
/// the timestamp and Biome user ID are always determined by the store itself.
pub struct InsertableOAuthUserSession {
    splinter_access_token: String,
    subject: String,
    oauth_access_token: String,
    oauth_refresh_token: Option<String>,
}

impl InsertableOAuthUserSession {
    // accessor methods omitted for brevity
}

/// Builds a new [InsertableOAuthUserSession]
pub struct InsertableOAuthUserSessionBuilder {
    splinter_access_token: Option<String>,
    subject: Option<String>,
    oauth_access_token: Option<String>,
    oauth_refresh_token: Option<String>,
}

impl InsertableOAuthUserSessionBuilder {
    // contents omitted for brevity
}

/// Builds an updated [InsertableOAuthUserSession]
///
/// This builder only allows changes to the fields of a session that may be
/// updated.
pub struct InsertableOAuthUserSessionUpdateBuilder {
    // Immutable items
    splinter_access_token: String,
    subject: String,
    // Mutable items
    oauth_access_token: String,
    oauth_refresh_token: Option<String>,
}

impl InsertableOAuthUserSessionUpdateBuilder {
    pub fn with_oauth_access_token(mut self, oauth_access_token: String) -> Self {
        self.oauth_access_token = oauth_access_token;
        self
    }

    pub fn with_oauth_refresh_token(mut self, oauth_refresh_token: Option<String>) -> Self {
        self.oauth_refresh_token = oauth_refresh_token;
        self
    }

    pub fn build(self) -> InsertableOAuthUserSession {
        // contents omitted for brevity
    }
}

/// Defines methods for CRUD operations on OAuth session data
pub trait OAuthUserSessionStore: Send + Sync {
    /// Adds an OAuth session
    ///
    /// The store will set the "last authenticated" value of the session to the
    /// current time. The store will also generate a new OAuth user entry if one
    /// does not already exist for the session's subject.
    ///
    /// # Errors
    ///
    /// Returns a `ConstraintViolation` error if a session with the given
    /// `splinter_access_token` already exists.
    fn add_session(
        &self,
        session: InsertableOAuthUserSession,
    ) -> Result<(), OAuthUserSessionStoreError>;

    /// Updates the OAuth access token and/or refresh token for a session
    ///
    /// The store will set the "last authenticated" value of the session to the
    /// current time.
    ///
    /// # Errors
    ///
    /// * Returns an `InvalidState` error if there is no session with the given
    ///   `splinter_access_token`
    /// * Returns a `InvalidArgument` error if any field other than
    ///   `oauth_access_token` or `oauth_refresh_token` have been changed.
    fn update_session(
        &self,
        session: InsertableOAuthUserSession,
    ) -> Result<(), OAuthUserSessionStoreError>;

    /// Removes an OAuth session based on the provided Splinter access token.
    ///
    /// # Errors
    ///
    /// Returns an `InvalidState` error if there is no session with the given
    /// `splinter_access_token`
    fn remove_session(&self, splinter_access_token: &str)
        -> Result<(), OAuthUserSessionStoreError>;

    /// Returns the OAuth session for the provided Splinter access token if it
    /// exists
    fn get_session(
        &self,
        splinter_access_token: &str,
    ) -> Result<Option<OAuthUserSession>, OAuthUserSessionStoreError>;

    /// Returns the correlation between the given OAuth subject identifier and a
    /// Biome user ID if it exists
    fn get_user(
      &self,
      subject: &str,
    ) -> Result<Option<OAuthUser>, OAuthUserSessionStoreError>;

    /// Clone into a boxed, dynamically dispatched store
    fn clone_box(&self) -> Box<dyn OAuthUserSessionStore>;
}
```

The database-backed implementation of this store will be comprised of two
tables: the `oauth_users` table and the `oauth_user_sessions` table.

The `oauth_users` table will associate the user's OAuth identity (the identity
of the user according to the configured OAuth provider, such as a username or a
subject identifier) with a unique Biome user ID. The table will be defined as:

```sql
CREATE TABLE IF NOT EXISTS oauth_users (
  subject                   TEXT        PRIMARY KEY,
  user_id                   TEXT        NOT NULL UNIQUE
);
```

The `user_id` value will be a UUID generated by the `OAuthUser::new`
constructor. To ensure uniqueness of these user IDs with respect to user IDs
generated by the Biome credentials store, these user IDs will be namespaced to
this table.

The `oauth_user_sessions` table will track each active session that has been
initiated by a user. The table will be defined as:

```sql
CREATE TABLE IF NOT EXISTS oauth_user_sessions (
  splinter_access_token    TEXT       PRIMARY KEY,
  subject                  TEXT       NOT NULL,
  oauth_access_token       TEXT       NOT NULL,
  oauth_refresh_token      TEXT,
  last_authenticated       BIGINT    DEFAULT extract(epoch from now()) NOT NULL,
  FOREIGN KEY (subject) REFERENCES oauth_users(subject) ON DELETE CASCADE
);

CREATE FUNCTION update_oauth_user_session_timestamp() RETURNS trigger AS $$
    BEGIN
      UPDATE oauth_user_sessions
      SET last_authenticated = extract(epoch from now())
      WHERE splinter_access_token = OLD.splinter_access_token;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oauth_user_sessions_timestamp_update
  AFTER UPDATE ON oauth_user_sessions
  FOR EACH ROW EXECUTE PROCEDURE update_oauth_user_session_timestamp();
```

Note that this is the PostgreSQL definition; the SQLite definition will differ
slightly.

The `splinter_access_token` will be a value that is randomly generated by the
Splinter REST API. The `oauth_access_token` and `oauth_refresh_token` will be
used to periodically re-authenticate with the OAuth provider. The
`last_authenticated` timestamp will be used to determine when the user should be
re-authenticated with the OAuth provider (the Splinter REST API will determine
when this needs to be done). This timestamp will be generated internally by the
database with the `oauth_user_sessions_timestamp_update` trigger.

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
