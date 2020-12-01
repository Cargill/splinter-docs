# OAuth 2 REST API Authentication
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

OAuth 2 support for Splinter's REST APIs provides standard and secure
authentication with the REST APIs from end-user browser applications. The
primary OAuth 2 providers targeted are Active Directory, Github, and Google.

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
users, it is desirable to support Active Directory as an OAuth authentication
server.

In public environments, it is common to use authentication servers provided by
organizations which have a large number of users. GitHub and Google both provide
authentication servers, as do many other organizations. GitHub is interesting in
the context of Splinter development because teams working on Splinter and
Hyperledger projects all have existing GitHub accounts. Google is interesting
because Google Apps is commonly used by smaller businesses, but also because of
the robust OAuth implementation provided by Google.

By supporting multiple OAuth providers, we ensure we are not implementing a
solution that only works with a single provider. Additionally, three (Active
Directory, GitHub, and Google) is a reasonable number to initially support.

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
  <li>Authorization Server responds to Splinter REST API with access token</li>
  <li>Splinter REST API responds to Application with access token</li>
  <li>Application accesses Splinter REST API with access token</li>
  <li>Splinter REST API gets the user's identity from the Authorization Server
  using the access token</li>
  <li>Authorization Server responds to the Splinter REST API with the user's
  identity</li>
  <li>Application REST API satisfies the call</li>
</ol>

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

The implementation of this feature is based on the
[OAuth 2 protocol](https://oauth.net/2/) in combination with provider-specific
details ([Active Directory](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow),
[Github](https://docs.github.com/en/free-pro-team@latest/developers/apps/building-oauth-apps),
and [Google](https://developers.google.com/identity/protocols/oauth2)).

### Authorization Guard

The Splinter REST API will be guarded such that only properly authorized
requests are accepted. Any request that does not include sufficient
authorization will receive a `401 Unauthorized` response, with the exception of
REST API routes that provide authorization (such as the OAuth routes).

For the Actix REST API, Splinter will use a middleware component to check
authorization using the `Authorization` HTTP header. For OAuth, it is expected
that this header has the value `Bearer: OAuth2:<token>`, where `<token>` is the
access token that the authorization server gives to the REST API. If this token
type (`OAuth2`) is not provided, or if this header is malformed, the Splinter
REST API will respond with `401 Unauthorized`.

The middleware will resolve tokens to client identities using a set of
configured identity providers, which are defined by the following trait:

```rust
/// A service that fetches identities from a backing provider
pub trait IdentityProvider: Send + Sync {
    fn get_identity(
      &self,
      authorization: &Authorization
    ) -> Result<String, IdentityProviderError>;

    fn clone_box(&self) -> Box<dyn IdentityProvider>;
}
```

Each OAuth provider will have its own `IdentityProvider` implementation that
queries the appropriate provider's servers using an access token to get the
client's identity. These will be configured for the REST API and passed to the
middleware, which will call them for each request to get the client's identity.

### REST API Endpoints

The Splinter REST API will provide two new endpoints to enable authorization:
the `GET /oauth/login` route and the `GET /oauth/callback` route. This section
outlines the external behavior of these routes.

#### Login Route

The login route is used by the browser application to initiate the
authentication process. The application will request this route from the
Splinter REST API, which will respond with a `302 Found` response that redirects
the browser to the Splinter REST API's configured authorization server.

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
will then exchange this code for the user's access token, and return the access
token to the browser application.

The Splinter REST API sends the access token to the application by redirecting
the browser to the client redirect URL that was provided in the initial request
to the login route. The access token will be passed by appending the
`access_token` query parameter to the client redirect URL. This access token
will have the format `OAuth2:<token>`, where `<token>` is the access token that
the authorization server provided.

Some authorization servers expire access tokens after a period of time and
provide a refresh token to get a new access token. If the configured
authorization server provides them, the Splinter REST API will also provide the
refresh token using the `refresh_token` query parameter, and the lifetime of the
access token (in seconds) using the `expires_in` query parameter.

When biome features are enabled, the user's token and other details will be
added to the biome `OAuthUserStore`; see [Biome OAuth Integration]({% link
community/planning/biome_oauth_user_store.md %}) for more details.

### Configuration

The Splinter REST API will provide out-of-the-box support for configuring Active
Directory, GitHub, and Google providers.

#### Active Directory

TBD

#### GitHub

To configure GitHub as an OAuth provider for the Splinter REST API, the library
user will need to provide three configuration values: a client ID, a client
secret, and a redirect URL. The Client ID and client secret are provided by
GitHub when setting up an OAuth app. The redirect URL, which will need to be
registered with the GitHub OAuth app, will be the URL of the `/oauth/callback`
endpoint of the Splinter REST API.

#### Google

TBD

## Unresolved questions
[unresolved]: #unresolved

* This document does not cover applications with REST APIs that function
  side-by-side with the Splinter REST API, or as proxies of the Splinter REST
  API. These patterns likely require more design.
* It is unclear how CLIs or non-user-based applications such as integration
  daemons could leverage OAuth for authenticating with the Splinter REST API.
* How should refresh tokens handled for authorization servers that expire access
  tokens?
* How can the REST API avoid calling the identity provider every time it needs
  to verify a user's identity?
* How can the REST API provide more detailed information about users, such as
  profile pictures, display names, etc.?
