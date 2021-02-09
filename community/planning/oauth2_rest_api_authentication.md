# OAuth 2 REST API Authentication
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

OAuth 2 support for Splinter's REST APIs provides standard and secure
authentication with the REST APIs from end-user browser applications. The
primary OAuth 2 providers targeted are Azure Active Directory, Github, and Google.

## Motivation
[motivation]: #motivation

Splinter's REST API provides routes for the Admin Service, Scabbard, Biome, and
other Splinter components. Because it is desirable that the REST API be
accessible to a variety of applications, it is important to have a robust
authentication and authorization system implemented. OAuth 2 is a fundamental
part of providing a standards-based authentication solution for browser
applications.

Splinter's Biome component currently has the ability to manage users and
credentials. However, this capability is of primary interest only for
development and demo environments. In most other environments, it is highly
desirable or required to use single sign-on (SSO) for user authentication. The
two most common SSO standards are OAuth and SAML. (We will not cover SAML
further here.)

Splinter applications will commonly be integrated with an organization's SSO
implementation. Since most large organizations use Active Directory for managing
users, it is desirable to support Azure Active Directory as an OAuth
authentication server.

In public environments, it is common to use authentication servers provided by
organizations which have a large number of users. GitHub and Google both provide
authentication servers, as do many other organizations. GitHub is interesting in
the context of Splinter development because teams working on Splinter and
Hyperledger projects all have existing GitHub accounts. Google is interesting
because Google Apps is commonly used by smaller businesses, but also because of
the robust OAuth implementation provided by Google.

By supporting multiple OAuth providers, we ensure we are not implementing a
solution that only works with a single provider. Additionally, three (Azure
Active Directory, GitHub, and Google) is a reasonable number to initially
support.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

User authorization is done via the Authorization Code grant type. A
browser-based application accesses the Splinter REST API directly, and the REST
API redirects the application to the authorization page. On completion of the
authorization process, the REST API provides an access token to the application
that it can use to authorize future requests. The Splinter Admin UI is a good
example of this scenario, but it may be suitable for other applications as well.

Here is the flow in more detail:

![]({% link images/oauth2_basic_flow.svg %} "Flow of OAuth 2 Authentication")

<ol type="A">
  <li>User accesses Application</li>
  <li>Application attempts to access Splinter REST API</li>
  <li>Splinter REST API responds to application with `401 Unauthorized`</li>
  <li>Application requests authorization from Splinter REST API</li>
  <li>Splinter REST API responds to the Application with a redirect to the
  Authorization Server's login page</li>
  <li>Application performs redirect to the Authorization Server's login
  page</li>
  <li>User enters credentials</li>
  <li>Application submits credentials to the Authorization Server</li>
  <li>Authorization Server responds to the Application with an authorization
  code and a redirect to the Splinter REST API</li>
  <li>Application performs redirect to the Splinter REST API with the
  authorization code</li>
  <li>Splinter REST API submits the authorization code to the Authorization
  Server</li>
  <li>Authorization Server responds to Splinter REST API with OAuth access
  token</li>
  <li>Splinter REST API requests the user’s identity from the Authorization
  Server using the OAuth access token</li>
  <li>Authorization Server responds to the Splinter REST API with the user's
  identity</li>
  <li>Splinter REST API stores the OAuth access token and responds to
  Application with a new Splinter access token</li>
  <li>Application accesses Splinter REST API with the Splinter access token</li>
  <li>Splinter REST API checks if user authentication has expired. If not
  expired, skips to (S); if expired, gets the user's identity from the
  Authorization Server using the OAuth access token.</li>
  <li>Authorization Server responds to the Splinter REST API with the user's
  identity</li>
  <li>Application REST API satisfies the call</li>
</ol>

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

The implementation of this feature is based on the
[OAuth 2 protocol](https://oauth.net/2/) in combination with provider-specific
details ([Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow),
[Github](https://docs.github.com/en/free-pro-team@latest/developers/apps/building-oauth-apps),
and [Google](https://developers.google.com/identity/protocols/oauth2)).

### Biome OAuth User Session Store

The [Biome OAuth user session store]({% link
community/planning/biome_oauth_user_session_store.md %}) will be used by the
Splinter REST API for tracking and re-authenticating active user sessions.

### Subject Providers

The `SubjectProvider` trait defines the interface for getting a user's subject
identifier from an OAuth server. This trait will be defined in the
`splinter::outh::subject` module as follows:

```rust
use crate::error::InternalError;

/// A service that fetches subject identifiers from a backing OAuth server
pub trait SubjectProvider: Send + Sync {
    /// Attempts to get the subject that the given access token is for. This
    /// method will return `Ok(None)` if the access token could not be resolved
    /// to a subject.
    fn get_subject(
      &self,
      access_token: &str,
    ) -> Result<Option<String>, InternalError>;

    fn clone_box(&self) -> Box<dyn SubjectProvider>;
}
```

Each of the OAuth provider types will have its own implementation of the
`SubjectProvider` trait that queries the appropriate provider's servers. The
following implementations will be included with the Splinter REST API:

* `GithubSubjectProvider` - Gets a user's GitHub username using a GitHub OAuth
  access token

* `OpenIdSubjectProvider` - Gets a user's subject identifier from an
  OpenID-compliant OAuth provider (this covers the Azure Active Directory and
  Google providers)

### OAuth Client

The `OAuthClient` struct will be used for interacting with the OAuth server.
This struct will be defined in the `splinter::oauth` module with the following
API:

```rust
use std::time::Duration;

use crate:error::InternalError;

impl OAuthClient {
    /// Generates the URL that the end user should be redirected to for
    /// authorization
    pub fn get_authorization_url(
        &self,
        client_redirect_url: String,
    ) -> Result<String, InternalError> {
        // contents omitted for brevity
    }

    /// Exchanges the given authorization code for an access token and the
    /// client redirect URL provided in the original auth request, represented
    /// by a `String`.
    pub fn exchange_authorization_code(
        &self,
        auth_code: String,
        csrf_token: &str,
    ) -> Result<Option<(UserInfo, String)>, InternalError> {
        // contents omitted for brevity
    }

    /// Exchanges the given refresh token for an access token.
    pub fn exchange_refresh_token(
      &self,
      refresh_token: String
    ) -> Result<String, InternalError> {
        // contents omitted for brevity
    }

    /// Attempts to get the subject that the given access token is for from the
    /// OAuth server. This method will return `Ok(None)` if the access token
    /// could not be resolved to a subject.
    pub fn get_subject(
      &self,
      access_token: &str
    ) -> Result<Option<String>, InternalError> {
        self.subject_provider.get_subject(access_token)
    }
}

/// User information returned by the OAuth2 client
pub struct UserInfo {
    access_token: String,
    expires_in: Option<Duration>,
    refresh_token: Option<String>,
    subject: String,
}

impl UserInfo {
    // accessor methods omitted for brevity
}
```

Internally, the OAuth client will use a new store, the in-flight OAuth request
store, for correlating authorization requests with callbacks from the
authorization server. This store will be defined in the `splinter::oauth::store`
module as follows:

```rust
use crate::error::{ConstraintViolationError, InternalError};

/// Errors that may occur during InflightOAuthRequestStore operations.
#[derive(Debug)]
pub enum InflightOAuthRequestStoreError {
    InternalError(InternalError),
    ConstraintViolation(ConstraintViolationError),
}

/// A Store for the in-flight information pertaining to an OAuth2 request.
///
/// An OAuth2 request consists of a request to the provider, and then a callback
/// request back to the library user's REST API.  There is information created
/// for the first request that must be verified by the second request. This
/// store manages that information.
pub trait InflightOAuthRequestStore: Sync + Send {
    /// Insert a request into the store.
    fn insert_request(
        &self,
        request_id: String,
        authorization: PendingAuthorization,
    ) -> Result<(), InflightOAuthRequestStoreError>;

    /// Remove a request from the store and return it, if it exists.
    fn remove_request(
        &self,
        request_id: &str,
    ) -> Result<Option<PendingAuthorization>, InflightOAuthRequestStoreError>;

    fn clone_box(&self) -> Box<dyn InflightOAuthRequestStore>;
}

/// Information pertaining to pending authorization requests, including the
/// PKCE verifier, and client's redirect URL
#[derive(Debug, PartialEq)]
pub struct PendingAuthorization {
    pkce_verifier: String,
    client_redirect_url: String,
}
```

This store will be implemented according to the
[Splinter data store guidelines]({% link community/data_store_guidelines.md %}).

### Identity Provider

The Splinter REST API guards itself such that only properly authorized clients'
requests are accepted. This functionality is described in the
[REST API Authorization design]({% link
community/planning/rest_api_authorization.md %}).

An implementation of the `IdentityProvider` trait (defined in the REST API
authorization design) will be added for authenticating OAuth users. This
implementation will be defined in the
`splinter::rest_api::auth::identity::oauth` module as the
`OAuthUserIdentityProvider`.

The `OAuthUserIdentityProvider` will require that the `Authorization` header
specified with REST API requests has the value `Bearer: OAuth2:<token>`, where
`<token>` is an access token provided by the Splinter REST API. If this token
type (`OAuth2`) is not provided, or if this header is malformed, the Splinter
REST API will respond with `401 Unauthorized`.

This identity provider will use the `OAuthClient` and `OAuthUserSessionStore` to
authenticate a user. When the client's identity is retrieved initially in the
`GET /oauth/callback` endpoint, the OAuth tokens and identity will be entered
into the `OAuthUserSessionStore`.

For up to one hour after authentication, the OAuth identity provider will use
the `OAuthUserSessionStore` to lookup a user's identity based on a request's
provided Splinter access token. After an hour, the identity provider will
attempt to use the corresponding OAuth access token to re-check the user's
identity; this ensures that the user is still authenticated for the Splinter
REST API according to the OAuth provider. If this check fails but an OAuth
refresh token exists for the session, the identity provider will attempt to get
a new OAuth access token using the refresh token (using the
`OAuthClient::exchange_refresh_token` method); if this succeeds, Splinter will
update the store entry for the session and attempt to use the new access token
to fetch the user's identity. If the refresh token exchange fails or no refresh
token exists, the server will logout the user by removing the store entry before
returning a `401 Unauthorized` response to the client.

This identity provider will be configured for the REST API, which will call if
for each request to get the client's identity.

### REST API Endpoints

The Splinter REST API will provide three new endpoints to enable authorization:
the `GET /oauth/login` route, the `GET /oauth/callback` route, and the
`GET /oauth/logout` route. This section outlines the behavior of these routes.

#### Login Route

The login route is used by the browser application to initiate the
authentication process. The application will request this route from the
Splinter REST API, which will respond with a `302 Found` response that redirects
the browser to the Splinter REST API's configured authorization server. This
endpoint uses the `OAuthClient::get_authorization_url` method.

In the request to the Splinter REST API, the browser application must provide a
client redirect URL. This URL will be used by the Splinter REST API to redirect
the browser back to the application. This client redirect URL can be provided in
two ways: the `redirect_url` query parameter, or the `Redirect` header, which is
often provided automatically by the browser. If both methods of specifying the
client redirect URL are used, the query parameter will override the header.

The `302 Found` response provided by the Splinter REST API will provide the URL
of its configured authorization server using the `Location` HTTP header.

#### Callback Route

The callback route is used by the authorization server to send a temporary
authorization code to the Splinter REST API. After the user has granted
permission to the application, the authorization server will redirect the
browser to the callback route with the authorization code. The Splinter REST API
will then exchange this code for the user's OAuth access token and a refresh
token if the authorization server provides one. This endpoint uses the
`OAuthClient::exchange_authorization_code` method.

Once it has the OAuth token(s), the REST API will fetch the user's identity
using the configured OAuth `IdentityProvider`. Splinter will also generate a new
Splinter access token for the user, which is a random 32-character alphanumeric
string. These tokens, along with the user's identity, will then be entered into
the `OAuthUserSessionStore` before the REST API returns the Splinter access
token to the browser application.

The Splinter REST API sends its access token to the application by redirecting
the browser to the client redirect URL that was provided in the initial request
to the login route. The access token will be passed by appending the
`access_token` query parameter to the client redirect URL. This access token
will have the format `OAuth2:<token>`, where `<token>` is the token generated by
the Splinter REST API (this is different than the OAuth access token provided by
the authorization server).

The user's identity, retrieved by the `IdentityProvider` described above, will
also be appended to the client redirect URL using the `display_name` query
parameter.

#### Logout Route

The logout route is used by the browser application to remove the user's stored
tokens from the `OAuthUserSessionStore`. After the request has been
authenticated by the middleware component, the Splinter REST API will remove the
user's session from the store. If this operation is successful, the Splinter
REST API will respond with `200 Ok`.

### Configuration

The Splinter REST API will provide out-of-the-box support for configuring Azure
Active Directory, GitHub, and Google providers.

#### GitHub

To configure GitHub as an OAuth provider for the Splinter REST API, the library
user will need to provide three configuration values: a client ID, a client
secret, and a redirect URL. The Client ID and client secret are provided by
GitHub when setting up an OAuth app. The redirect URL, which will need to be
registered with the GitHub OAuth app, will be the URL of the `/oauth/callback`
endpoint of the Splinter REST API.

#### OpenID (Azure Active Directory and Google)

To configure an OpenID-compliant OAuth provider such as Azure Active Directory
or Google, the library user will need to provide four configuration values: a
client ID, a client secret, a redirect URL, and an OpenID discovery document
URL. The Client ID and client secret are determined by the provider when setting
up an OAuth app. The redirect URL, which will need to be registered with the
OAuth app, will be the URL of the `/oauth/callback` endpoint of the Splinter
REST API. The OpenID discovery document URL will be defined by the OAuth
provider; usually this is the `/.well-known/openid-configuration` endpoint of
the provider's server.

## Unresolved questions
[unresolved]: #unresolved

* This document does not cover applications with REST APIs that function
  side-by-side with the Splinter REST API, or as proxies of the Splinter REST
  API. These patterns likely require more design.
* It is unclear how CLIs or non-user-based applications such as integration
  daemons could leverage OAuth for authenticating with the Splinter REST API.
* How can the REST API provide more detailed information about users, such as
  profile pictures, display names, etc.?
