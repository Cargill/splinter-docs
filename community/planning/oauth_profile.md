# Oauth Profile
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

After authenticating a user with one of the available OAuth providers, a user's
profile information may be retrieved from the OAuth server. The primary OAuth
providers for which profile information can be retrieved are Azure Active
Directory, Github, and Google. Other OpenID OAuth providers may work as well.

## Motivation
[motivation]: #motivation

User profile information can be used in end user applications to create a
personalized profile for the user based on the account used for authentication.
[Splinter Admin UI]({% link community/planning/admin_ui_profile.md %}) is an
example of a browser-based application that uses the user profile information
from the OAuth provider to create a profile page for the authenticated user.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

Retrieval of profile information is handled by a profile provider in the OAuth
client. The process is as follows:

1. User has been authenticated with one of the available OAuth providers and the
Splinter REST API has received an OAuth access token
1. The profile provider queries the appropriate endpoint for the given OAuth
provider using the OAuth access token
1. The OAuth server responds with the available profile information for the
authenticated user

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### `ProfileProvider`

The interface for getting a user's profile information from an OAuth server is
defined using the  `ProfileProvider` trait.

```rust
/// A service that fetches profile details from a backing OAuth server
pub trait ProfileProvider: Send + Sync {
    /// Attempts to get the profile details for the account that the given access
    /// token is for.
    fn get_profile(&self, access_token: &str) -> Result<Option<Profile>, InternalError>;

    /// Clone implementation for `ProfileProvider`. The implementation of the
    /// `Clone` trait for `Box<dyn ProfileProvider>` calls this method.
    fn clone_box(&self) -> Box<dyn ProfileProvider>;
}
```
The `access_token` argument passed to the `get_profile` method is the token sent
to the Splinter REST API by the authorization server after authentication.

Implementations of the `ProfileProvider` trait exist for Github and OpenID OAuth
providers. While other OpenID OAuth providers may work, the
`OpenIdProfileProvider` is configured to work specifically with Azure Active
Directory and Google.

So that the ProfileProvider may be accessed from the oauth client, a
profile_provider field is added to the `OAuthClient` struct. See
[OAuth 2 REST API Authentication]({%link
community/planning/oauth2_rest_api_authentication.md %}) for more
details on `OAuthClient`.

## Prior art
[prior-art]: #prior-art

The `ProfileProvider` trait is modeled after the `SubjectProvider` trait in 
[OAuth 2 REST API Authentication]({%
link community/planning/oauth2_rest_api_authentication.md %}).
