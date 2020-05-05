# Biome User Management

Biome is the Splinter component for user, credential, and private key
management. It isolates and securely exposes user-based information for other
Splinter components. Biome stores user and credential information in a local
PostgreSQL database, manages access tokens, and provides encrypted keys for
other Splinter actions, such as signing transactions on behalf of a user.

Biome stores information in a local PostgreSQL database on the Splinter node.
Splinter does not share any user, credential, or key information with other
Splinter nodes. See [Biome Database Tables](#biome-database-tables) for the
database structure and table names.

Biome is part of the Splinter daemon, `splinterd`. The `splinterd` REST API
exposes this functionality as Biome-specific endpoints. The [splinterd REST API
Reference](https://www.splinter.dev/docs/0.4/api/) provides documentation and
examples for the Biome routes and request/response format.

This topic explains Biome's architecture, then illustrates how Biome works with
examples of using Biome endpoints.

## Biome Architecture

Biome provides the following functions:

* User account management: Creates and stores users by username and ID.
  A Splinter user has a username, access credentials, and an automatically
  generated user ID (UUID). Biome generates the UUID when a user is registered.

* Key management: Encrypts and stores users' private keys.

* Credential management: Registers and authenticates users.  The initial
  implementation uses usernames and passwords for authentication and is not
  recommended for production use.

* Token management: Stores a refresh token for each user that can be used to
  issue a new access token when the previous one expires.

* Database migration: Updates the Biome database when a new release adds or
  changes tables.

### Biome REST API routes

Biome is part of the Splinter daemon, `splinterd`. The `splinterd` REST API
exposes Biome functionality as Biome-specific endpoints. The following diagram
shows the relationship of the Biome component and REST API routes with the other
`splinterd` components and routes.

<img alt="Biome architecture" src="../images/biome_architecture_diagram.svg">

### Key Management in Biome

Biome's user key management provides the capability to store and retrieve
public/private key pairs and associate them with a user. The Biome
implementation is a general solution that reduces the overhead of writing a new
key management system for any application that needs keys. It is designed to be
flexible enough to support a multitude of use cases in an enterprise
environment.

The design of Biome includes the following assumptions:

* The client application is responsible for encrypting the user's private key
  (which is strongly recommended).

* Biome does not enforce any correctness of the key pairs. The private key
  should never be available to Biome in plain text, which makes it impossible to
  check that a private key is actually associated with the public key.

* Biome does not enforce any uniqueness of the key pairs. Though not ideal, this
  design supports organizational structures that associate keys with specific
  permissions rather than individual users.

### CanopyJS Library for Saplings

The [CanopyJS library](https://github.com/Cargill/splinter-canopyjs) provides
code so that saplings (Splinter web apps) can use the key management
functionality of Biome, as well as handlers to make key data available across
saplings running in Canopy. This code includes a function to generate a new
keypair using the secp256k1 algorithm, as well as handlers to store an active
key in Canopy state or fetch the currently active key.

For example, the Profile sapling uses Biome and the CanopyJS key management
library to allow an app to take the following actions:

*   Update user credentials (username or password)
*   Create, delete, and view a given user's keys
*   Select a key as the active key

The Profile sapling encrypts the private key before sending it to Biome. This
sapling is responsible for all direct communication with the Biome endpoints.
For more information, see the [splinter-canopyjs
repository](https://github.com/Cargill/splinter-canopyjs).

### The libsplinter biome module

For Splinter developers, Biome functionality is available as independent
submodules in the Rust-language `libsplinter` library, so that customized
Splinter applications can choose some functions but not use others. The `biome`
module in the `libsplinter` library includes the following submodules:

* `credentials`
* `key_management`
* `migrations`
* `notifications`
* `refresh_tokens`
* `rest_api`

For more information, see the `biome` module in the [splinter Rust API
Reference](https://docs.rs/splinter/latest/splinter/biome/index.html).

## Examples: Using Biome Endpoints

To demonstrate how Biome works, this section shows examples of using the Biome
REST API endpoints for the following tasks:

* Register a new user with `/biome/register`
* Log the user in with `/biome/login`
* Store the new user's keys with `/biome/keys`
* Fetch a private key with `/biome/keys/<public_key>`
* Verify user credentials with `/biome/verify`
* Refresh an access token with `/biome/token`
* Log a user out with `/biome/logout`

For details on each request and response, see the `biome` routes in the
[splinterd REST API Reference](https://www.splinter.dev/docs/0.4/api/).

### Registering a New User

The workflow for adding a new user to the Biome database has three steps:
register the new user, log the user in, then add the new user's public key and
encrypted private key to the Biome database.

This example shows the first step: use `/biome/register` to register a new
user in the Biome database.

In this example, the user name is an email address. The password is hashed
because the application should not reveal the user's plain-text password to the
REST API. (The examples in this document show an abbreviated hashed password.)

```
    POST /biome/register
    {
         "username": "coral.reef@example.org",
         "hashed_password": "8e066d41...d99ada0d"
    }
```

A successful response includes the user ID (a UUID for that user).

```
    {
        "data": {
            "user_id": "9146dcfa-dd1d-472c-b3d4-5cfb80eea16f",
            "username": "coral.reef@example.org"
        },
        "message": "User created successfully"
    }
```

### Logging In

This example shows the second step for adding a new user to the Biome database:
use `/biome/login` to log the user in and get the user's access and refresh
tokens.

Note: Biome uses [JSON Web Tokens (JWT)](https://jwt.io/) to manage user
authentication and user sessions. An access token is required for interacting
with all Biome endpoints (other than `POST /biome/register` and `POST
/biome/login`).

The request must include the username (this example uses an email address)
and a hashed password, because the application should not reveal the user's
plain-text password to the REST API. For example:

```
    POST /biome/login
    {
        "username": "coral.reef@example.org",
        "hashed_password": "8e066d41...d99ada0d"
    }
```

A successful response contains the user ID, an access token, and a refresh
token. (The examples in this document show abbreviated strings for the
tokens.)

```
    {
        "message": "login successful!",
        "user_id": "9146dcfa-dd1d-472c-b3d4-5cfb80eea16f",
        "token": "eyJ0eXAiOikZjBjOGE0I...aXNzIjoic2PEUXY70Ehc",
        "refresh_token": "QiLCJhbGcilkIjoiZjM1YW...ZC00ZWRhLWiJ9.eyJ1c2"
    }
```

The access token must be included in the authentication header of all
requests submitted on the part of this user.

When an access token expires, use the refresh token to get a new access token
(see [Refreshing an Access Token](#refreshing-an-access-token)).

### Storing New User Keys

This example shows the final step for adding a new user: use `/biome/keys` to
store the user's keys in the Biome database.

This example assumes that the user's public and private key files already exist.
For information on generating these keys, see the [splinter-keygen(1) man
page](../references/cli/splinter-keygen.1.html).

**Important**: For security reasons, it is highly recommended to encrypt the
private key.  The encryption method is left to the calling application; Biome
itself is agnostic to the specific encryption algorithm.

The request header must include the user's access token from the `POST
/biome/login` response in the previous step. The request body specifies the
plain-text public key, an encrypted private key, the key's human-readable
display name, and the user ID (from the `POST /biome/login` response in the
previous step).


```
    POST /biome/keys
    Authorization: bearer eyJ0eXAiOikZjBjOGE0I...aXNzIjoic2PEUXY70Ehc
    SplinterProtocolVersion: 1
    {
        "public_key": "<public_key>",
        "encrypted_private_key": "<private_key>",
        "display_name": "Key for coral.reef@example.org",
        "user_id": "9146dcfa-dd1d-472c-b3d4-5cfb80eea16f"
    }
```

A successful response includes the message "key added successfully", as well
as the items provided in the request.

```
    {
        "message": "key added successfully",
        "data": {
            "public_key": "<public_key>",
             "user_id": "9146dcfa-dd1d-472c-b3d4-5cfb80eea16f",
             "display_name": "Key for coral.reef@example.org",
             "encrypted_private_key": "<private_key>"
        }
    }
```

### Fetching a Private Key

Use `/biome/keys/<public_key>` to fetch the private key from the Biome database
so that the key can be used to sign a transaction.

The request header must contain the user's access token. For example:

```
    GET /biome/keys/<public_key>
    Authorization: bearer eyJ0eXAiOikZjBjOGE0I...aXNzIjoic2PEUXY70Ehc
```

A successful response contains the encrypted private key, as well as the user's
display name (usually the same as the username) and user ID.

```
    {
        "data": {
            "public_key": "<public_key>",
            "encrypted_private_key": "<private_key">,
            "display_name": "Key for coral.reef@example.org",
            "user_id": "9146dcfa-dd1d-472c-b3d4-5cfb80eea16f"
        }
    }
```

### Verifying User Credentials

Use `/biome/verify` to verify a user's password by sending the
username and hashed password. The request header must contain the user's access
token. For example:

```
    POST /biome/verify
    Authorization: bearer eyJ0eXAiOikZjBjOGE0I...aXNzIjoic2PEUXY70Ehc
    {
        "username": "coral.reef@example.com",
        "Hashed_password": "8e066d41...d99ada0d"
    }
```

A successful response includes a message and the user ID.

```
    {
        "message": "Successful verification",
        "user_id": "9146dcfa-dd1d-472c-b3d4-5cfb80eea16f"
    }
```

### Refreshing an Access Token

When an access token expires, user-related requests return a 401 error with a
message indicating that the token has expired.

Use `POST /biome/token` to request a new access token. Include the expired
access token in the request header and put the refresh token in the request
body. For example:

```
    POST /biome/token
    Authorization: bearer eyJ0eXAiOikZjBjOGE0I...aXNzIjoic2PEUXY70Ehc
    {
        "token": "QiLCJhbGcilkIjoiZjM1YW...ZC00ZWRhLWiJ9.eyJ1c2"
    }
```

A successful response body will contain the new access token.

```
    {
        "token": "J1c2VyX2lkIjoiZjMu_1...YWxriYX7qryl08ZEp86"
    }
```

### Logging Out

Use `/biome/logout` to log a user out. This action removes the access tokens
associated with the user.

The request header must contain the user's current access token, and the request
body is empty. For example:

```
    POST /biome/logout
    Authorization: bearer eyJ0eXAiOikZjBjOGE0I...aXNzIjoic2PEUXY70Ehc
    {}
```

A successful response contains a message.

```
    {

        "message": "User successfully logged out"
    }
```

## Reference Information

### REST API Endpoints for Biome

The `splinterd` REST API exposes the following Biome-specific endpoints.

<table>
  <tr>
   <td><code>/biome/keys</code>
   </td>
   <td>Adds a new key, changes a key's display name, and lists all keys.
   </td>
  </tr>
  <tr>
   <td><code>/biome/keys/{public-key}</code>
   </td>
   <td>Fetches information for a given key or deletes the key.
   </td>
  </tr>
  <tr>
   <td><code>/biome/login</code>
   </td>
   <td>Authenticates a user with username and password credentials. A successful
       login returns a unique user ID (UUID), an access token, and a refresh
       token.
   </td>
  </tr>
  <tr>
   <td><code>/biome/logout</code>
   </td>
   <td>Logs a user out by removing the access tokens associated with the user.
   </td>
  </tr>
  <tr>
   <td><code>/biome/register</code>
   </td>
   <td>Creates a new user by providing a username and password credentials.
   </td>
  </tr>
  <tr>
   <td><code>/biome/token</code>
   </td>
   <td>Issues a new access token for the user with the given refresh token.
   </td>
  </tr>
  <tr>
   <td><code>/biome/users</code>
   </td>
   <td>Lists all users.
   </td>
  </tr>
  <tr>
   <td><code>/biome/users/{user-id}</code>
   </td>
   <td>Fetches the given user's information, changes their password, and deletes
       a user.
   </td>
  </tr>
  <tr>
   <td><code>/biome/verify</code>
   </td>
   <td>Verifies that a user's password credentials and associated access token
       are correct.
   </td>
  </tr>
</table>

<br>
For more information, see the `biome` routes in the [splinterd REST API
Reference](https://www.splinter.dev/docs/0.4/api/).

### Biome Database Tables

The following diagram shows the structure of the Biome database tables.

<img alt="Biome database schema" width="500" height="756" src="../images/biome_database_schema.svg">
