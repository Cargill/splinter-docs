# Gameroom Technical Walkthrough

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

***NOTE:*** This document is a work in progress! We are updating the
walkthrough with details for Splinter 0.4 and converting it to Markdown. For
a complete version of the document, see the [Gameroom Technical Walkthrough
PDF](https://files.splinter.dev/docs/Gameroom_Walkthrough-Splinter_v0.3.4.pdf).

## Introduction

Distributed ledger technologies have the potential to revolutionize how businesses
communicate and transact. At Cargill, we are leading the revolution with
involvement in several open-source projects, including Hyperledger Sawtooth,
Hyperledger Transact, and Splinter. This document outlines an example application,
Gameroom, that uses technologies from each of these projects to demonstrate our
vision of using smart contracts to enhance business and customer relationships.

Privacy and confidentiality between trading partners are important capabilities
for (almost) all multi-party interactions. These capabilities are especially
critical in distributed applications. As a result, the technology stack behind
Gameroom differs from a common "shared-everything" blockchain design; instead,
it sculpts the underlying blockchain-like distributed ledger technology into a
sophisticated architecture that shares data only between the appropriate
participants. Parts of this walkthrough are written as a script, in several acts,
for which we recommend a dramatic reading (as if performed on stage by very
amateur actors). Each act is followed by a "behind the scenes" chapter that
describes the complex underlying technology and explains what really happens
when running the deceptively simple Gameroom application. A glossary at the end
defines the terms used by Splinter and the Gameroom application.

**Note**: This document is based on Splinter version 0.4. As Splinter matures,
some details may change (such as the exact format of messages).

## The Cast

**Alice**, an employee at Acme Corporation

**Bob**, a project leader at Bubba Bakery

**Yoda**, a VP at Yoyodyne Systems

**Zixi**, head of IT at Zymogen Industries

## The Setting
Two Splinter nodes are set up, one at Acme Corporation and one at Bubba Bakery.
Alice and Bob have each registered as a Gameroom user with an email address, a
private key, and a password. The Prequel explains the details of node setup and
user registration.

## Prologue: An Initial Conversation
<div class="gameroom-script-container">
<em>ALICE, sitting in an office chair at a desk. MACBOOK PRO. Aging
desk PHONE. Alice picks up the receiver. Dials a phone number.
</em>
<p class="gameroom-script-label">ALICE</p>

<p class="gameroom-script-quote">
Hi Bob.
</p>
<em>
Long pause. Alice rolls her eyes.
</em>
<p class="gameroom-script-label">ALICE</p>

<p class="gameroom-script-quote">
Anyway, we need to get moving on setup -- yeah --
sure, it is a bit silly, but we need to prove how our
companies can use this new technology. We'll use the
gameroom to play a few games of --
</p>

<em>
Another pause. Alice sighs.
</em>
<p class="gameroom-script-label">ALICE</p>

<p class="gameroom-script-quote">
Yes, we have to show that we can create a private and
secure connection between our two companies.
How about I send you -- right, I'll create the
gameroom and you'll see my invitation in your app.
</p>

<em>
Alice logs into her Mac. Starts up the BROWSER and clicks on
the ACME GAMEROOM bookmark. Browser displays a network error.
</em>

<p class="gameroom-script-label">ALICE</p>

<p class="gameroom-script-quote">
One second; I got this Mac from IT but it doesn’t
have access to the corporate network -- yeah, I know.
Actually, just let me know if you don't get my
invitation in a few minutes -- Fine. OK, bye.
</p>

<em>
Alice hangs up the phone.

Alice pushes the Macbook aside. Reaches into her bag and heaves
out a Windows notebook. It looks old. Alice opens it up. Logs
in. Starts up the BROWSER and clicks on the ACME GAMEROOM
bookmark. The app starts to load.
</em>
</div>


## Act I: Alice and Bob Create a Gameroom

### Scene 1: Alice logs into Acme's Gameroom application

Alice looks at the GAMEROOM APP LOGIN SCREEN in her browser.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/acme_gameroom_login_screen.svg %}
"Gameroom app Acme login screen")

Alice enters her EMAIL and PASSWORD. Clicks LOG IN.

Success. The browser now displays the ACME GAMEROOM HOME SCREEN.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/acme_gameroom_home_screen.svg %}
"Gameroom app Acme home screen")

### Scene 2: Alice creates a new gameroom

Alice sees an empty MY GAMEROOMS sidebar (no gamerooms exist yet). Alice creates
a new gameroom by clicking on the **+** button next to My Gamerooms.

![]({% link docs/0.4/examples/gameroom/walkthrough/images/scene2_1.svg %}
"Gamerooms sidebar")

Alice sees the NEW GAMEROOM DIALOG.

![]({% link docs/0.4/examples/gameroom/walkthrough/images/scene2_2.svg %}
"New Gameroom dialog")

Alice looks at the OTHER ORGANIZATION pulldown list. She
selects BUBBA BAKERY.

![]({% link docs/0.4/examples/gameroom/walkthrough/images/scene2_3.svg %}
"New Gameroom dialog organization pulldown list")

Next, she enters a NAME for the new gameroom: Acme + Bubba.

![]({% link docs/0.4/examples/gameroom/walkthrough/images/scene2_4.svg %}
"New Gameroom dialog completed")

Alice clicks SEND.

The New Gameroom dialog is replaced with the Acme Gameroom home
screen. A TOAST NOTIFICATION tells Alice that her invitation
has been sent to Bubba Bakery.

![]({% link docs/0.4/examples/gameroom/walkthrough/images/scene2_5.svg %}
"Invitation successfully sent notification")

### INTERMISSION

Live performances should include an intermission at this point,
because there is a lot that just happened (see
<a href="#gameroom_behind">"Behind the
Scenes: A Look at Act 1"</a>).

### Scene 3: Bob logs into Bubba Bakery's Gameroom application

BOB, muttering to himself, opens a BROWSER and searches for "tic tac toe". Gets
distracted by Wikipedia's list of games. Plays Quantum Tic Tac Toe Online for
20 minutes. Eventually hunts through his email for the right link and starts
the BUBBA BAKERY GAMEROOM APP.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene3_1.png %}
"Bubba Bakery login screen")

Bob logs in with his EMAIL and PASSWORD.

Success. The browser now displays the BUBBA BAKERY GAMEROOM HOME SCREEN.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene3_2.png %}
"Bubba Bakery home screen")

### Scene 4: Bob checks his notifications

Bob sees that he has a notification and clicks on the NOTIFICATION ICON. The
NOTIFICATION PANE shows an INVITATION from Alice.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene4_1.png %}
"Bubba Bakery home screen with notification from Alice")

### Scene 5: Bob accepts Alice's gameroom invitation

Time passes.
Eventually, Bob clicks the notification. The notifications pane
disappears and the INVITATIONS TAB is shown. Bob clicks the
`ACCEPT` button on Alice's invitation.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene5_1.png %}
"Bubba Bakery invitations")

### Scene 6: Alice sees that Bob accepted her invitation

Alice notices that she has a notification and clicks on the notification icon.
The NOTIFICATIONS PANE appears, with the happy news that Bob has accepted her
invitation and that the new Acme + Bubba gameroom has been created.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene6_1.png %}
"Acme notifications")

Alice clicks on the notification. The Notifications pane closes and Alice is
redirected to the ACME + BUBBA GAMEROOM SCREEN.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene6_2.png %}
"ACME + BUBBA GAMEROOM SCREEN")

Alice and Bob’s gameroom is ready. They can now play games.

<h2 class="gameroom_behind">
Behind the Scenes: A Look at Act I, Alice and Bob Create a Gameroom
</h2>

### I-1. Behind scene 1: Alice logs into Acme's Gameroom UI

Gameroom uses Biome for user management, including authentication. For more
information, check out the
[Biome overview]({% link docs/0.4/concepts/biome_user_management.md %}).

When a user logs in, the user interface (UI) component of the Gameroom client
application works with the Gameroom REST API to check the user's email address
and password and to ensure the user has a public and private key pair. Each
Gameroom client communicates with a Gameroom daemon, using the Gameroom REST API
in order to authenticate a Gameroom user. The Gameroom REST API uses the Biome
REST API to authenticate the user credentials and to fetch key pairs associated
with the user. Biome is a part of the Acme Splinter daemon. Each Splinter daemon
stores the user credentials and keys in a local PostgreSQL database; user
passwords are hashed by the Gameroom client so that they remain secret.

#### I-1.1. Acme UI sends authorization request to Gameroom REST API

![]({% link docs/0.4/examples/gameroom/walkthrough/images/auth_login_acme1.svg %}
"Gameroom daemon receives auth request")

When Alice clicks Log in, the Acme Gameroom UI hashes the password, then sends
an authorization request to the Acme Gameroom daemon, gameroomd. The Gameroom
daemon then makes several requests to the Biome REST API to verify the user.

The following request is sent to Acme's Gameroom daemon:

```
POST /users/authenticate
{
  "email": "alice@acme.com",
  "hashedPassword": "8e066d41...d99ada0d"
}
```

The UI does not reveal the user's password to the REST API because the password
is used to encrypt signing keys (as described in section I-2.3, step 5).

#### I-1.2. Gameroom daemon uses Biome REST API to verify password

![]({% link docs/0.4/examples/gameroom/walkthrough/images/auth_login_acme2.svg %}
"Gameroom daemon forwards auth request")

Once the Gameroom daemon receives the authentication request, the actual
authentication is handled by the Biome REST API. This authentication request
is sent from the Acme Gameroom daemon to the Biome REST API.

```
POST /biome/login
{
  "username": "alice@acme.com",
  "hashed_password": "56ec82cb...480cad32"
}
```

When the Biome REST API receives the authorization request for Alice, it fetches
the entry from the Acme Splinter daemon's local database associated with the
username and verifies the hashed password sent in the request.


![]({% link docs/0.4/examples/gameroom/walkthrough/images/auth_login_acme3.svg %}
"Splinter daemon verifies Alice's credentials")


The `user_credentials` table in the Splinter database has the following schema:

``` sql
CREATE TABLE IF NOT EXISTS user_credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
);
```

The Splinter database has the following entry in the `user_credentials` table:

| `user_id` | `username` | `password` |
| :--- | :--- | :--- |
| `06ff2de0...9243ae2cf3` | `alice@acme.com` | `56ec82cb...480cad32` |


If the hashed password from the authentication request passes verification,
the Biome REST API will respond with a success response. This response includes
JSON Web Tokens, which enable the Gameroom REST API to make authorized requests
to the Biome REST API, without requiring the user to enter their password.
The refresh token included in the success response allows a new access token to
be issued, if the refresh token has not expired, when the original token issued
has expired. Each refresh token issued is saved to the `refresh_tokens` table in
the Splinter daemon database, with an associated user ID.

The `refresh_tokens` table in the Splinter database has the following schema:

``` sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
);
```

The Splinter database has the following entry in the `refresh_tokens` table:

| `id` | `user_id` | `token` |
| :--- | :--- | :--- |
| `1` | `06ff2de0...9243ae2cf3` | `zeFgbILi...opBrt4ic` |

If the credentials are verified, the Biome REST API will respond with the
following success response:

```
{
  "message": "Successful login",
  "user_id": "06ff2de0...9243ae2cf3",
  "token": "eyJhbGci...adQssw5c",
  "refresh_token": "zeFgbILi...opBrt4ic",
}
```

#### I-1.3. Gameroom daemon uses Biome REST API to request Alice's key pairs

![]({% link docs/0.4/examples/gameroom/walkthrough/images/auth_login_acme4.svg %}
"Gameroom daemon requests Alice's keys")

Once the Gameroom daemon has verified Alice's password, it must then verify that
Alice has a public and private key pair. Alice's public and private key pair was
added to the Acme Splinter database during registration (see The Prequel,
section P.2).

The request to list Alice's associated keys is made to the Biome REST API.

```
GET /biome/keys
```

The request to the Biome REST API's keys endpoint holds Alice's
JSON Web Token in an `Authorization` header, which will enable the Splinter
daemon to authorize access to the user's key information, as well as extract the
user ID from the token to fetch the keys from the Splinter daemon's database.


![]({% link docs/0.4/examples/gameroom/walkthrough/images/auth_login_acme5.svg %}
"Splinter daemon retrieves Alice's keys")


The `keys` table in the Splinter database has the following schema:

``` sql
CREATE TABLE IF NOT EXISTS keys (
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    PRIMARY KEY(public_key, user_id)
);
```

Using the unique `user_id` from the access token, the keys associated with Alice
are fetched from the Splinter daemon's database.

The Splinter database has the following entry in the `keys` table:

| `display_name` | `user_id` | `public_key` | `encrypted_private_key` |
| :--- | :--- | :--- | :--- |
|`alice@acme.com`|`06ff2de0...9243ae2cf3`|`0384781f...5a7e4998`|`{\"iv\":...cgXrm\"}`|


If the associated entry is found in the Splinter database `keys` table, a success
response with the list of key information is sent back to the Gameroom daemon.

```
{
  "data": [
    {
      "public_key": "0384781f...5a7e4998",
      "user_id": "06ff2de0...9243ae2cf3",
      "display_name": "alice@acme.com",
      "encrypted_private_key": "{\"iv\":\"...cgXrm\"}"
    }
  ]
}
```

#### I-1.4. Gameroom REST API returns login success response

If the Gameroom REST API gets a successful response from both requests sent to
the Biome REST API to verify the user, then the authentication was successful.

The Gameroom REST API sends a response to the Acme UI that contains Alice's
public key and encrypted private key.

```
{
  "email": "alice@acme.com",
  "public_key": "0384781f...5a7e4998",
  "encrypted_private_key": "{\"iv\":\"...cgXrm\"}",
}
```

Next, the UI must gather the information for the Acme Gameroom home screen that
Alice will see after logging in.

#### I-1.5. Acme UI requests a list of gamerooms

After a user has been authenticated, the UI gathers user-specific information for
the home screen. First, it requests the list of existing gamerooms for that user.
(At this point, no gamerooms exist.) Later, this walkthrough will describe what
happens when there are gamerooms for the UI to display.

1. When Alice logs in, the Acme UI makes a call to the Gameroom REST API for the
list of gamerooms.

```
GET /gamerooms
```

2. This call returns an empty list, since there are no gamerooms in the Acme
Gameroom's PostgreSQL database.

```
{
  "data": [],
  "paging": {
    "current": "/gamerooms?limit=100&offset=0",
    "offset": 0,
    "limit": 100,
    "total": 0,
    "first": "/gamerooms?limit=100&offset=0",
    "prev": "/gamerooms?limit=100&offset=0",
    "next": "/gamerooms?limit=100&offset=0",
    "last": "/gamerooms?limit=100&offset=0"
  }
}
```

#### I-1.6. Acme UI requests a list of invitations
Next, the Acme Gameroom UI requests the list of gameroom invitations. In this
scenario, Alice has no invitations, so the list is empty. Later, the walkthrough
will show what happens when a user has unaccepted invitations.

1. When Alice logs in, the UI makes a call to the Gameroom REST API for the list
of invitations (also called _circuit proposals_).

```
GET /proposals
```

2. Because Alice has no invitations, the Gameroom REST API returns an empty list.

```
{
  "data": [],
  "paging": {
    "current": "/proposals?limit=100&offset=0",
    "offset": 0,
    "limit": 100,
    "total": 0,
    "first": "/proposals?limit=100&offset=0",
    "prev": "/proposals?limit=100&offset=0",
    "next": "/proposals?limit=100&offset=0",
    "last": "/proposals?limit=100&offset=0"
  }
}
```

At this point, Alice sees the Acme Gameroom home screen with no existing
gamerooms or invitations.

### I-2. Behind scene 2: Alice creates a new gameroom

The Gameroom home screen includes a button to create a new gameroom. When a user
clicks it, the UI requests the member list (possible other nodes) to use in the
next dialog.

After the Acme UI has the member list, it displays the "New
Gameroom" dialog, where Alice can use the members list to select her opponent
(called _Other organization_ in the dialog), and enter a name for the new
gameroom. When she clicks **Send**, the Acme UI starts the process of sending
Bob an invitation to the new gameroom.

A gameroom is enabled by a Splinter _circuit_ that connects two or more systems,
or _nodes_. A _registry_ stores a list of nodes that can participate in a
circuit; the Splinter daemon, `splinterd`, can provide this list of nodes upon
request. (The Gameroom example creates a registry that includes the Acme and
Bubba Bakery nodes.) Splinter uses the term _members_ for the nodes that can be
connected (or are connected) on a circuit.

A gameroom invitation is also called a circuit proposal. Each gameroom proposal
requires a vote (an _approval_) from each member, which is handled by two-phase
commit consensus and a _consensus proposal_. When Alice creates a new gameroom,
her action automatically includes a vote from her organization (Acme Corporation)
that approves the creation of that gameroom. Her invitation to Bob, at Bubba's
Bakery, is actually a request for his organization's vote to approve the new
circuit.

#### I-2.1. Acme UI loads members list for New Gameroom dialog

First, the Acme Gameroom UI must load the list of members for the "New Gameroom"
dialog. The general process looks like this:

![]({% link docs/0.4/examples/gameroom/walkthrough/images/get_nodes_diagram.svg %}
"Splinter daemon loads member list")

1. The UI makes this REST API call to the Gameroom REST API.

    ```GET /nodes```

2. The Gameroom REST API sends a GET request to the `/registry/nodes` endpoint
   in the Splinter REST API asking for the list of nodes.

3. The Splinter daemon, `splinterd`, fetches the list of nodes from the registry
   and sends a response to the Gameroom REST API that includes the requested
   data. The "list of nodes" response looks like this:

    ```
    {
      "data": [
      {
        "identity": "bubba-node-000",
        "display_name": "Bubba Bakery",
        "endpoints": [
          "tcps://splinterd-node-bubba:8044",
        ],
        "metadata": {
          "organization": "Bubba Bakery",
        },
        "keys": [
          "b1834871...2914a7f4",
        ],
      },
      {
        "identity": "acme-node-000",
        "display_name": "ACME Corporation",
        "endpoints": [
          "tcps://splinterd-node-acme:8044",
        ],
        "metadata": {
          "organization": "ACME Corporation",
        }
        "keys": [
          "0384781f...5a7e4998",
        ],
      }
      ],
      "paging": {
        "current": "/registry/nodes?limit=100&offset=0",
        "offset": 0,
        "limit": 100,
        "total": 2,
        "first": "/registry/nodes?limit=100&offset=0",
        "prev": "/registry/nodes?limit=100&offset=0",
        "next": "/registry/nodes?limit=100&offset=0",
        "last": "/registry/nodes?limit=100&offset=0"
      }
    }
    ```

4. The Gameroom REST API forwards the response to the Acme Gameroom UI, which
   uses the list of nodes to build the members list in the New Gameroom dialog.

#### I-2.2. Acme UI sends new Gameroom proposal to Gameroom REST API

1. In the New Gameroom dialog, Alice enters a unique name for the gameroom
   (Acme + Bubba) and selects Bubba Bakery from the **Other Organizations** list.
   Then she clicks **Send** to forward her invitation to Bob.

     When Alice clicks on the **Send** button, the general process looks like
     this:

    ![]({% link
    docs/0.4/examples/gameroom/walkthrough/images/create_gameroom_diagram.svg %}
    "Create Gameroom proposal sent")

    The UI sends a "create new gameroom" request to the Gameroom REST API that
    includes the gameroom name (also called an _alias_) and list of other
    members, besides the requesting node, in the proposed gameroom. Member
    entries only include the node ID, as gameroomd fetches the necessary member information
    from the Splinter registry.

    The request (also called a _proposal_) looks like this:

    ```
    POST /gamerooms/propose
    {
      "alias": "Acme + Bubba",
      "members": [
        "bubba-node-000",
      ],
    }
    ```

2. The Gameroom REST API sends a GET request to the `/registry/nodes` endpoint
   in the Splinter REST API asking for the details of the proposed Gameroom
   member, using the node ID from the Acme UI "create new gameroom" request.

   This information is then used to complete the `CircuitManagementPayload`
   in the next step.

#### I-2.3. Gameroom REST API sends a `CircuitManagementPayload`

When the Acme Gameroom REST API receives the proposal request, it uses that
information to create a `​CircuitManagementPayload​`, which will eventually be sent
to the Acme Splinter daemon. Before sending the proposal request, the Gameroom
REST API asks the Gameroom UI to sign it with Alice's information.

1. The Gameroom daemon uses the information from the "create new gameroom"
   request and the response from the `/registry/nodes` endpoint to create a new
   `​CircuitManagementPayload​`.

    The following example shows a YAML representation of the
    `CircuitManagementPayload​`.

    ***Application metadata​***:
    ``` yaml
    alias: Acme + Bubba ​// Gameroom name chosen by Alice
    scabbard_admin_keys:
      - <acme gameroomd public key>
    ```

    ***Circuit definition​***:
    ``` yaml
    circuit_id: 01234-ABCDE
    authorization_type: Trust
    members:
      - node_id: acme-node-000
        endpoints: [
          - tcps://splinterd-node-acme:8044
        ]
      - node_id: bubba-node-000
        endpoints: [
          - tcps://splinterd-node-bubba:8044
        ]
    roster:
      - service_id: gr00
        service_type: scabbard
        allowed_nodes:
          - acme-node-000
        arguments:
          - peer_services:
              - gr01
            admin_keys:
              - <acme gameroomd public key>
      - service_id: gr01
        service_type: scabbard
        allowed_nodes:
          - bubba-node-000
        arguments:
          - peer_services:
              - gr00
            admin_keys:
              - <acme gameroomd public key>
    circuit_management_type: gameroom
    application_metadata: <bytes of the application metadata described above>
    persistence: Any
    durability: None
    routes: Any
    ```

    **Header​**:
    ``` yaml
    Action: CIRCUIT_CREATE_REQUEST
    requester: <public key of requester> ​// left empty by the REST API
    payload_sha512: <sha512 hash of the circuit definition described above>
    requester_node_id: acme-node-000
    ```

    **`CircuitManagementPayload​`**:
    ``` yaml
    header: <bytes of header described above>
    circuit_create_request: <circuit definition described above>
    signature: <signature of bytes of the header> ​// left empty by the​ ​REST API
    ```

    Note​ that the Gameroom REST API does not fill in the ​requester​ field in the
    header or the signature in the `​CircuitManagementPayload​`.

2. Before the payload can be sent, the Acme UI must sign the bytes of the
   `CircuitManagementPayload` ​header. The Acme Gameroom REST API serializes the
   payload and sends the bytes as a response to the UI.

    ```
    {
      "data": {
        "payload_bytes": <bytes of the CircuitManagementPayload>
      }
    }
    ```

3. After receiving the response from the Gameroom REST API, the Acme UI
   deserializes the `CircuitManagementPayload​`. It adds the requester’s public
   key to the header (in this case, Alice is the requester), serializes the
   header, signs the header bytes, and adds the signature to the payload.
   Finally, the UI serializes the complete payload.

4. The Acme UI submits the bytes of the signed payload to the Gameroom REST API.

    ```
    POST /submit
    Content-Type: application/octet-stream

    <bytes of the signed CircuitManagementPayload>
    ```

5. The Acme Gameroom REST API forwards the payload to the Acme Splinter REST API.

    ```
    POST /admin/submit
    Content-Type: application/octet-stream

    <bytes of the signed CircuitManagementPayload>
    ```

6. The Acme Splinter REST API calls the Acme admin service to forward the
   proposed payload, a `​CircuitManagementPayload​` (described in the next
   section).

    The protobuf is represented in YAML format:
    ``` yaml
    CircuitManagementPayload:
      header: <bytes of header described above>
      circuit_create_request:
        circuit:
          01234-ABCDE:
            auth: trust
            members:
              acme-node-000:
                endpoints:
                  - tcps://splinterd-node-acme:8044
              bubba-node-000:
                endpoints:
                  - tcps://splinterd-node-bubba:8044
            roster:
              gr00:
                service_type: scabbard
                allowed_nodes:
                  - acme-node-000
                arguments:
                  - peer_services:
                      - gr01
                    admin_keys:
                      - <acme gameroomd public key>
              gr01:
                service_type: scabbard
                allowed_nodes:
                  - bubba-node-000
                arguments:
                  - peer_services:
                      - gr00
                    admin_keys:
                      - <acme gameroomd public key>
            persistence: any
            durability: none
            routes: require_direct
            circuit_management_type: gameroom
      signature: <signature of bytes of requested circuit definition>
    ```

7. The Acme admin service checks that the `​CircuitManagementPayload​` signature
   is valid by comparing it against the header bytes and the requester public
   key stored in the header.

8. Because the Acme and Bubba Bakery nodes are not yet peered (do not have an
   authorized connection on the Splinter network), the ​`CircuitManagementPayload​`
   is placed in the "unpeered payloads" queue for unpeered nodes.

#### I-2.4. Acme node peers with Bubba Bakery node

Before the `​CircuitManagementPayload​` message can be validated, every member of
the circuit must be connected (peered).

The admin service on the Acme Splinter node (which has the service ID
`admin::acme-node-000​`) is able to send requests using a `PeerManagerConnector`
to request the creation of a peer. The admin service also can use the
`PeerManagerConnector` to subscribe to notifications of the status of a peering
request. The `PeerManagerConnector` sends requests to the `PeerManager`. Peering
requests are counted by the `PeerManager` to ensure connections remain only as
long as they are needed.

1. Acme's admin service uses the `PeerManagerConnector.add_peer_ref` with the
   node ID and the endpoints listed in the proposed circuit to begin the peering
   process.

2. `PeerManagerConnector.add_peer_ref` sends a message,
   `PeerManagerRequest::AddPeer` including the `peer_id` and `endpoints`, is
   sent to the `PeerManager`. A `PeerRef` is returned to the admin service that
   represents the incremented count for peer requests to ensure the connection
   is maintained for as long as it is needed. The admin service must hold on to
   this `PeerRef` for as long as the peer is used.

3. The `PeerManager` receives the `PeerManagerRequest` message and uses
   `PeerManager.add_peer` to create the connection.

4. After the connection has been created, a message exchange starts for peer
   authorization (described in ​Appendix A​).

5. If the connection is authorized, the connection is added to the Splinter
   network. The `PeerManager` then sends a `Connected` message to its
   subscribers.

6. Once the admin service has received the `Connected` message, the
   `​CircuitManagementPayload​` is removed from the `unpeered_payloads` queue
   and moved to `pending_protocol_payloads` queue. Peers' admin services with
   payloads in this list have yet to agree on a protocol version. Protocol
   versions are required to ensure the peers are running compatible versions of
   Splinter. This agreement must occur before any circuit management payloads
   can be handled. If these versions are not compatible, the payload will be
   dropped.

   The connecting admin service, Acme's admin service, sends a request which
   specifies the minimum and maximum protocol versions that it can support.
   Bubba's admin service responds with its highest supported version in the
   connecting service's range. If the admin service's agree on the protocol
   version, the admin service continues to process the payload.

7. Once Acme's and Bubba's admin services have agreed on a protocol version,
   the `CircuitManagementPayload` is moved to from `pending_protocol_payloads`
   to `pending_circuit_payloads`. The payload is now ready to go through
   consensus.

#### I-2.5. Splinter daemons use consensus to process the circuit request

At this point, the circuit proposal is ready to be validated and approved (voted
on with two-phase commit consensus), as described in ​Appendix B.​

During this process, the admin services on both nodes (`​admin::acme-node-000​`
and `admin::bubba-node-000​`) must agree that the `​CircuitManagementPayload​`,
which includes `CircuitCreateRequest​`, is a valid request. Consensus manages
each node's approval of the proposal.

##### I-2.5.1. Acme node validates the CircuitManagementPayload

1. The Acme admin service verifies that the `​CircuitManagementPayload​` and the
   included `CircuitCreateRequest​` are valid.

    a. A `​CircuitManagementPayload​` request is valid if the following things are
       true:

      * The `​CircuitManagementPayload​` must contain a header and signature in
        bytes.

      * The header in the payload must contain an action enum value, the public
        key of the requester, and hash of the action associated with the payload.

      * The action in the `​CircuitManagementPayload​` must match the enum action
        in the payload.

      * The signature must be valid for the bytes of the header and the requester
        public key stored in the header.

    b. The provided payload (a `​CircuitCreateRequest​`) is valid if the following
       things are true:

      * The new circuit has a unique name (the node is not part of an existing
        circuit with that name). Circuit names do not need to be unique across
        all Splinter nodes. Two sets of nodes can use the same circuit name if
        there is no overlap in members in the circuit.

      * The circuit definition includes the node ID in the circuit member list.

      * For each service, every node in the service's allowed node list is also
        present in the circuit member list.

      * There is no other pending proposal for a circuit with the same name.

      * The requester is registered for the Splinter node whose ID is in the
        `requester_node_id​` field of the `​CircuitManagementPayload​` header. The
        requester is identified by the public key of the person who requested
        the new gameroom (in this example, Alice).

      * The requester has permission to submit circuit proposals from that
        Splinter node.

      To verify the node's public key and proposal permission, the admin service
      checks the Splinter registry and key permissions manager.

      * The Splinter registry provides a way to look up details about a node,
        including registered public keys. The registry will be used to verify
        the public key used to sign a circuit proposal: the requester node ID,
        (which should be associated with the "home node" in order for the
        request to be valid).

      * The key permissions manager checks that a public key is authorized in a
        specific role. In the case of "create circuit" requests, the signing
        public key must be authorized for the "proposal" role.

2. If the request is valid, the Acme admin service creates a
   `CircuitProposalContext` and stores it in the ​
   `AdminServiceShared.pending_changes` field. The `CircuitProposalContext`
   includes the the proposed circuit, represented in a `CircuitProposal` struct,
   also the `CircuitManagementPayload` action and the signer's public key. The
   protobuf for the `CircuitProposal` is represented in YAML format.

    ``` yaml
    CircuitProposal:
      proposal_type: CREATE
      circuit_id: 01234-ABCDE
      circuit_hash: <hash of circuit>
      circuit_proposal:
        circuit:
          01234-ABCDE:
            auth: trust
            members:
              acme-node-000:
                endpoints:
                  - tcps://splinterd-node-acme:8044
              bubba-node-000:
                endpoints:
                  - tcps://splinterd-node-bubba:8044
            roster:
              gr00:
                service_type: scabbard
                allowed_nodes:
                  - acme-node-000
                arguments:
                  - peer_services:
                      - gr01
                    admin_keys:
                      - <acme gameroomd public key>
              gr01:
                service_type: scabbard
                allowed_nodes:
                  - acme-node-000
                arguments:
                  - peer_services:
                      - gr00
                    admin_keys:
                      - <acme gameroomd public key>
            persistence: any
            durability: none
            routes: require_direct
      votes: []
      requester: <public key of requester>
      requester_node_id: acme-node-000
    ```

3. The Acme admin service creates a consensus proposal (a `​Proposal​` struct)
  with the following contents:

   * Proposal ID: the expected hash of the `​CircuitManagementPayload​` bytes

   * Summary: bytes of the created `​CircuitProposal`

   * List of required verifiers

    An admin service running on a Splinter node does not have a fixed (static)
    list of required verifiers (services that must agree on a proposal through
    consensus). Instead, the admin service specifies the required verifiers as a
    list of admin service IDs that belong to the members of the proposed circuit,
    using a protobuf message called `​RequiredVerifiers​`. This list is stored in
    the consensus data of the consensus proposal.

    The following protobuf, which is represented in YAML format, shows the
    consensus proposal.

    ``` yaml
    required_verifiers:
      verifiers:
        - <admin::acme-node-000 as bytes>
        - <admin::bubba-node-000 as bytes>

    proposal:
       id: <hash of `CircuitManagementPayload` bytes>
       summary: <bytes of the create `CircuitProposal`>
       consensus_data: <bytes of required verifiers>
    ```

##### I-2.5.2. Acme node sends Circuit Create request to Bubba Bakery node

After the Acme node creates the `​CircuitProposal​`, the `​CircuitManagementPayload​`
is sent to the other members defined in the circuit. In this case, the only
member is the admin service on the Bubba Bakery node.

1. First, the Acme admin service wraps `​CircuitManagementPayload​` in a series of
   messages to prepare it for sending across the Splinter network.

    a. The payload is wrapped in an `​AdminMessage​`, which is a service-level
       message. The protobuf is represented in YAML format.

    ``` yaml
    admin_message:
      message_type: PROPOSED_CIRCUIT,
      propose_circuit:
        circuit_payload: <circuit_managment_payload>
        expected_hash: <expected hash of CircuitProposal generated by payload>
        required_verifiers: <bytes of the required verifiers from proposal>
    ```

    b. The `​AdminMessage` ​is then wrapped in an `​AdminDirectMessage​`, which
       enables the message to be sent over the Splinter network from Acme's
       admin service to the Bubba Bakery admin service (which has the service ID
       `​admin::bubba-node-000​`).

    ``` yaml
    admin_direct_message:
      circuit: admin
      sender: admin::acme-node-000
      recipient: admin::bubba-node-000
      payload: <serialized admin message>
      correlation_id: 6f04e471-f33a-4f9f-ad6f-5f80ab627133
    ```

    c. Next, the `​AdminDirectMessage​` is wrapped in a `​CircuitMessage​`, which
       is the envelope that wraps all circuit-specific messages, such as direct
       messages and service connections.

    ``` yaml
    circuit_message:
      message_type: ADMIN_DIRECT_MESSAGE
      payload: <serialized admin_direct_message>
    ```

    d. In order to hide circuits from the network layer, which can be used without
       circuits, the `CircuitMessage​` is wrapped in a `​NetworkMessage​`.

    ``` yaml
    network_message:
      message_type: CIRCUIT
      payload: <serialized circuit_message>
    ```

2. The Acme admin service sends this message over the admin circuit to the Bubba
   Bakery Splinter node.

##### I-2.5.3. Bubba Bakery node receives Circuit Create request from Acme node

The Bubba Bakery Splinter node receives the network message from the Acme node
and starts the process of "unwrapping" the message with a series of dispatchers.

1. A dispatcher takes the message and passes it to the correct message handler
   based on the message type of the message. Each dispatcher either handles the
   message or forwards the message onto the next dispatcher.

    a. The Bubba Bakery Splinter node passes the `​NetworkMessage​` to the network
       dispatcher.

    b. The network dispatcher unwraps the `​NetworkMessage​` to get the
       `CircuitMessage​`, then sends it to the circuit dispatcher.

    c. The circuit dispatcher unwraps the `​CircuitMessage​` to get the
       `AdminDirectMessage​`, then passes it to the circuit handler for this type
       of message, `​AdminDirectMessageHandler​`.

2. The `​AdminDirectMessageHandler​` checks whether the `​AdminDirectMessage​` is
   valid. An `​AdminDirectMessage​` message is valid if both the sender and the
   recipients of the message are admin services (the service ID of each is of
   the form `​admin::<node_id>`​).

3. If the `​AdminDirectMessage​` message is valid, the `A​dminDirectMessageHandler​`
   forwards it to the Bubba Bakery admin service.

4. The Bubba Bakery admin service takes the `​AdminMessage​` out of the
   `​AdminDirectMessage` and inspects the `​AdminMessage​` to see if it contains
   `​AdminMessage::ProposedCircuit​`.

    If so, the admin service takes the `​CircuitManagementPayload​` out of the
    `​ProposedCircuit` message and passes it to
    `​AdminServiceShared.pending_circuit_payloads`.

##### I-2.5.4. Bubba Bakery node validates CircuitManagementPayload

The Bubba Bakery admin service validates the `​CircuitManagementPayload​` using the
same steps as in ​section I-2.5.1​.

1. The admin service verifies that the `​CircuitManagementPayload​` and the
   included `CircuitCreateRequest​` are valid. (For details, see ​section I-2.5.1,
   step 1​.)

2. If the request is valid, the admin service creates a `​CircuitProposal​` and
   stores it in the `AdminServiceShared.pending_changes​` field (see ​section
   I-2.5.1, step 2​).

3. The admin service creates a consensus proposal (a `​Proposal​` struct) with the
   proposal ID, summary, and the list of required verifiers. For more
   information, see ​section I-2.5.1, step 3​.

##### I-2.5.5. Acme and Bubba Bakery reach consensus

When the admin services have validated the proposal and consensus has reached
agreement, consensus will notify the admin services to commit the proposal. See ​
Appendix B​ for more information about consensus.

#### I-2.6. Admin services commit pending circuit proposal

After the consensus notification, both admin services commit the
`​CircuitProposal​`. Now the new circuit is officially pending, which means that
the `​CircuitProposal​` is stored in the admin services' state but the circuit is
not yet available for communication. A pending circuit proposal is also called
an "open circuit proposal".

In the Gameroom example, the pending circuit ID is an 11-character string composed
of two 5-character base-62 numbers separated by a dash, '-'. In this walkthrough,
we'll use this example circuit ID:

`01234-ABCDE`

#### I-2.7. Admin services notify authorization handler of pending circuit proposal

1. After the circuit proposal has been committed, the admin service on each node
   checks if there are any registered application authorization handlers for the
   circuit management type in the proposed circuit
   (​`01234-ABCDE`​). See The Prequel,
   section P.3​, for more information on the registration process.

   An application authorization handler manages the voting strategy for the
   application and notifies the application of any events received from the
   admin service of the local Splinter node. This handler registers with an
   admin service for a specific circuit management type (also described in
   ​The Prequel, section P.3​).

2. If there are any registered application authorization handlers for the
   proposed circuit management type, each admin service forwards the request
   to the local connected Gameroom application authorization handler.

   The notification is sent on a WebSocket connection.

```
{
"eventType": "ProposalSubmitted",
"message": {
  "proposal_type": "Create",
  "circuit_id": "01234-ABCDE",
  "circuit_hash": "...",
  "circuit": {
    "circuit_id":"01234-ABCDE",
    "authorization_type": "Trust",
    "members": [{
      "node_id": "acme-node-000",
      "endpoints": [
          "tcps://splinterd-node-acme:8044",
        ],
      },
    {
      "node_id": "bubba-node-000",
      "endpoints": [
          "tcps://splinterd-node-bubba:8044",
        ],
      }
    ],
    "roster": [{
      "service_id": "gr00",
      "service_type": "scabbard",
      "allowed_nodes": [ "acme-node-000" ],
      "arguments": {
        "peer_services": [ "gr01" ],
        "admin_keys": [
          <acme gameroomd public key>
          ]
        }
      },
      {
        "service_id": "gr01",
        "service_type": "scabbard",
        "allowed_nodes": [ "bubba-node-000" ],
        "arguments": {
          "peer_services": [ "gr00" ],
          "admin_keys": [
            <acme gameroomd public key>
            ]
          }
        }
      ],
      "circuit_management_type": "gameroom",
      "application_metadata":​ <metadata bytes defined by the application>​,
      "persistence": "Any",
      "durability": "None",
      "routes": "Any",
    },
    "vote_record": [{}],
    "requester": "public_key_of_requester",
    "requester_node_id": "acme-node-000"
  }
}
```

#### I-2.8. Gameroom daemons write notification to Gameroom database

When each Gameroom application authorization handler receives the gameroom
proposal on the WebSocket connection, it parses the information and adds it to
several tables in the Gameroom daemon's local database: `​gameroom​`, ​
`gameroom_member​`, `​gameroom_service​`, `gameroom_proposal​`, and
`​gameroom_notification​`.

##### I-2.8.1. New `gameroom` table entry

First, the Gameroom application authorization handler adds a new entry to the
​gameroom​ table. This table contains the information about the circuit
definition, including the data that was passed in the ​application_metadata​ field.

``` sql
CREATE TABLE IF NOT EXISTS  gameroom (
  circuit_id TEXT PRIMARY KEY,
  authorization_type TEXT NOT NULL,
  persistence TEXT NOT NULL,
  routes TEXT NOT NULL,
  durability TEXT NOT NULL,
  circuit_management_type TEXT NOT NULL,
  alias TEXT NOT NULL,
  status TEXT NOT NULL,
  created_time TIMESTAMP NOT NULL,
  updated_time TIMESTAMP NOT NULL,
);
```

* `circuit_id`, `authorization_type`, `persistence`, `routes`, `durability`,​ and
  `circuit_management_type` ​are extracted directly from the circuit proposal
  message that is received from the Splinter daemon.

* `alias​​` is extracted by deserializing the application metadata in the circuit
  proposal message. The _alias_ is the gameroom name that Alice entered when
  creating the gameroom in the Acme UI.

* `status​` identifies the current status of the gameroom. In this case, it is
  set to ​pending because the proposal to create this gameroom has not yet been
  accepted.

* `created_time` is when the gameroom entry was introduced in the table.

* `updated_time` is when the gameroom entry was last updated.

At the end of the operation, the `​gameroom​` table looks like this:

<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>circuit_id</code></th>
    <th><code>authorization_type</code></th>
    <th><code>persistence</code></th>
    <th><code>routes</code></th>
    <th><code>durability</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td><code>01234-ABCDE</code></td>
    <td><code>Trust</code></td>
    <td><code>Any</code></td>
    <td><code>Any</code></td>
    <td><code>None</code></td>
  </tr>
  <tr>
    <th><code>circuit_management_type</code></th>
    <th><code>alias</code></th>
    <th><code>status</code></th>
    <th><code>created_time</code></th>
    <th><code>updated_time</code></th>
  </tr>
  <tr>
    <td><code>gameroom</code></td>
    <td><code>Acme + Bubba</code></td>
    <td><code>pending</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
    <td class="gameroom_placeholder"><code>time entry was updated</code></td>
  </tr>
</table>

##### I-2.8.2. New `gameroom_member` table entry

Next, the Gameroom application authorization handler adds a new entry to the
`gameroom_member​` table. This table contains the information about the members
of the circuit.

``` sql
CREATE TABLE IF NOT EXISTS  gameroom_member (
  id BIGSERIAL PRIMARY KEY,
  circuit_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  endpoint TEXT[] NOT NULL,
  status TEXT NOT NULL,
  created_time TEXT NOT NULL,
  updated_time TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (circuit_id) REFERENCES gameroom(circuit_id) ON DELETE CASCADE
);
```

* `circuit_id`, `node_id`,​ and `e​ndpoint` ​are extracted directly from the
  circuit proposal message received from the Splinter daemon.

* `status` identifies the current status of the member. In this case, it is set
  to `pending` because the proposal to create the gameroom has not yet been
  accepted.

* `created_time` is when the gameroom member entry was introduced in the table.

* `updated_time` is when the gameroom member entry was last updated.

At the end of the operation, the `​gameroom_member​` table looks like this:

<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>id</code></th>
    <th><code>circuit_id</code></th>
    <th><code>node_id</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>01234-ABCDE</code></td>
    <td><code>acme-node-000</code></td>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>01234-ABCDE</code></td>
    <td><code>bubba-node-000</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>endpoint</code></th>
    <th><code>status</code></th>
    <th><code>created_time</code></th>
  </tr>
  <tr>
    <td><code>tcps://splinterd-node-acme:8044</code></td>
    <td><code>pending</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
  </tr>
  <tr>
    <td><code>tcps://splinterd-node-bubba:8044</code></td>
    <td><code>pending</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>updated_time</code></th>
  </tr>
  <tr>
    <td class="gameroom_placeholder"><code>time entry was updated</code></td>
  </tr>
  <tr>
    <td class="gameroom_placeholder"><code>time entry was updated</code></td>
  </tr>
</table>

##### I-2.8.3. New `gameroom_service` table entry

The Gameroom application authorization handler adds a new entry to the
`​gameroom_service` table, which contains the information about the services of
the circuit.

``` sql
CREATE TABLE IF NOT EXISTS  gameroom_service (
  id BIGSERIAL PRIMARY KEY,
  circuit_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  allowed_nodes TEXT[][] NOT NULL,
  arguments JSON [] NOT NULL,
  status TEXT NOT NULL,
  last_event TEXT NOT NULL,
  created_time TIMESTAMP NOT NULL,
  updated_time TIMESTAMP NOT NULL,
  FOREIGN KEY (circuit_id) REFERENCES gameroom(circuit_id) ON DELETE CASCADE
);
```

* `circuit_id`, `service_id`, `service_type`, `arguments` and `allowed_nodes`
  are extracted directly from the circuit proposal message received from the
  Splinter daemon.

* `status` identifies the current status of the service. In this case, it is set
  to `pending` because the proposal to create the gameroom has not yet been
  accepted.

* `last_event` identifies the last state change event the gameroom daemon
  received. This allows for the node to catch-up to current state change events
  if it has been stopped and restarted.

* `created_time` is when the gameroom service entry was introduced in the table.

* `updated_time` is when the gameroom service entry was last updated.

At the end of the operation, the `gameroom_service` table looks like this:

<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>id</code></th>
    <th><code>circuit_id</code></th>
    <th><code>service_type</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>01234-ABCDE</code></td>
    <td><code>scabbard</code></td>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>01234-ABCDE</code></td>
    <td><code>scabbard</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>service_id</code></th>
    <th><code>allowed_nodes</code></th>
    <th><code>arguments</code></th>
  </tr>
  <tr>
    <td><code>gr00</code></td>
    <td><code>{"acme-node-000"}</code></td>
    <td><code>"peer_services": [ "gr01" ], "admin_keys": ....</code></td>
  </tr>
  <tr>
    <td><code>gr00</code></td>
    <td><code>{"bubba-node-000"}</code></td>
    <td><code>"peer_services": [ "gr00" ], "admin_keys": ....</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>status</code></th>
    <th><code>last_event</code></th>
    <th><code>created_time</code></th>
  </tr>
  <tr>
    <td><code>pending</code></td>
    <td class="gameroom_placeholder"><code>last state change event</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
  </tr>
  <tr>
    <td><code>pending</code></td>
    <td class="gameroom_placeholder"><code>last state change event</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>updated_time</code></th>
  </tr>
  <tr>
    <td class="gameroom_placeholder"><code>time entry was updated</code></td>
  </tr>
  <tr>
    <td class="gameroom_placeholder"><code>time entry was updated</code></td>
  </tr>
</table>

##### I-2.8.4. New `gamerooom_proposal` table entry

The Gameroom application authorization handler adds a new entry to the
`gameroom_proposal` table, which contains the information about the gameroom
proposal.

``` sql
CREATE TABLE IF NOT EXISTS  gameroom_proposal (
  id BIGSERIAL PRIMARY KEY,
  proposal_type TEXT NOT NULL,
  circuit_id TEXT NOT NULL,
  circuit_hash TEXT NOT NULL,
  requester TEXT NOT NULL,
  requester_node_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_time TIMESTAMP NOT NULL,
  updated_time TIMESTAMP NOT NULL,
  FOREIGN KEY (circuit_id) REFERENCES gameroom(circuit_id) ON DELETE CASCADE
);
```

* `circuit_id`, `proposal_type`, `circuit_hash`, `requester` and
  `requester_node_id` are extracted directly from the circuit proposal message
  received from the Splinter daemon.

* `status` identifies the current status of the proposal. In this case, it is
  set to `pending` because the proposal to create the gameroom has not yet been
  accepted.

* `created_time` is when the gameroom proposal entry was introduced in the table.

* `updated_time` is when the gameroom proposal entry was last updated.

At the end of the operation, the `​gameroom_proposal​` table looks like this:


<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>id</code></th>
    <th><code>circuit_id</code></th>
    <th><code>proposal_type</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>01234-ABCDE</code></td>
    <td><code>Create</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>circuit_hash</code></th>
    <th><code>requester</code></th>
    <th><code>requester_node_id</code></th>
  </tr>
  <tr>
    <td class="gameroom_placeholder"><code>hash of circuit definition</code></td>
    <td class="gameroom_placeholder"><code>public key of requester</code></td>
    <td><code>acme-node-000</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>status</code></th>
    <th><code>created_time</code></th>
    <th><code>updated_time</code></th>
  </tr>
  <tr>
    <td><code>pending</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
    <td class="gameroom_placeholder"><code>time entry was updated</code></td>
  </tr>
</table>

##### I-2.8.5. New `gameroom_notification` table entry

Finally, the Gameroom application authorization handler adds a new entry to the
`gameroom_notification​` table. This table contains information about events that
the UI would like to notify the users about.

``` sql
CREATE TABLE IF NOT EXISTS  gameroom_notification (
  id BIGSERIAL PRIMARY KEY,
  notification_type TEXT NOT NULL,
  requester TEXT NOT NULL,
  requester_node_id TEXT NOT NULL,
  target TEXT NOT NULL,
  created_time TIMESTAMP NOT NULL,
  read BOOLEAN NOT NULL,
);
```

* `notification_type` identifies the type of event that generated this
  notification (in this case, a `gameroom_proposal` event).

* `requester` identifies the public key of the user that generated the event
  (in this case, Alice's public key).

* `target` is the identifier for the resource that was affected by the event
  (in this case, the `circuit_id`).

* `created_time` is when the notification entry was introduced in the table.

* `updated_time` is when the notification entry was last updated.

At the end of the operation, the `gameroom_notification` table looks like this:


<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>id</code></th>
    <th><code>notification_type</code></th>
    <th><code>requester</code></th>
    <th><code>requester_node_id</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>gameroom_proposal</code></td>
    <td class="gameroom_placeholder"><code>Alice's public key</code></td>
    <td><code>acme-node-000</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>target</code></th>
    <th><code>created_time</code></th>
    <th><code>read</code></th>
  </tr>
  <tr>
    <td><code>01234-ABCDE</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
    <td><code>f</code></td>
  </tr>
</table>

#### I-2.9. Alice sees notification that gameroom invitation was sent

1. After the Acme Gameroom application authorization handler fills in the
   `gameroom_notification​` table, the Acme Gameroom REST API uses a WebSocket
   connection to tell the Acme UI about the new notification.

    ```
    {
      "namespace": "notifications",
      "action": "listNotifications"
    }
    ```

2. When the Acme UI receives that message, it sends a request to the Gameroom
   REST API to fetch a list of unread notifications from the database tables.

    `GET /notifications`

3. The Acme Gameroom REST API responds with the list of unread notifications.

    ```
    {
      "data": [
        {
          "id": <auto generated id>,
          "notification_type": "gameroom_proposal",
          "requester": <Alice’s public key>,
          "node_id": "acme-node-000",
          "target": "01234-ABCDE",
          "timestamp": <time entry was created>,
          "read": false
        }
      ],
      "paging": {
        "current": "api/notifications?limit=100&offset=0",
        "offset": 0,
        "limit": 100,
        "total": 1,
        "first": "api/notifications?limit=100&offset=0",
        "prev": "api/notifications?limit=100&offset=0",
        "next": "api/notifications?limit=100&offset=0",
        "last": "api/notifications?limit=100&offset=0"
      }
    }
    ```

4. The Acme UI updates its internal store with the new list of notifications.
   The notification that the user sees depends on whether they're the requester
   or an invitee.

    * For the requester (Alice), the Acme UI displays a toast notification
      saying that the invitation has been sent.

    * An invitee sees a bell notification icon with number (a red badge that
      shows the number of unread notifications). If an invitee is not logged in,
      the notification will appear on the Gameroom home screen when the user
      logs in. For example, when Bob logs in, the Bubba Bakery UI will request
      the list so it can display the notification icon and the number on the
      home screen.

### I-3. Behind scene 3: Bob logs into Bubba Bakery's Gameroom application

When Bob logs in, the Bubba Bakery UI works with `gameroomd`, `splinterd`, and
both the Splinter and Gameroom REST API to check his user credentials and build
the Bubba Bakery Gameroom home page. This process is almost identical to Alice's
login process. The only difference is that the Bubba Bakery Gameroom home page
will display a notification about his invitation from Alice.

#### I-3.1. Bubba Bakery UI sends authorization request to Gameroom REST API

This process is the same as the Acme process in [section
Ⅰ-1.1](#i-11-acme-ui-sends-authorization-request-to-gameroom-rest-api).
For Bob, the general process looks like this:

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/auth_login_bubba_1.svg %}
"Gameroom daemon receives auth request")

When Bob clicks `Log in`, the Bubba Bakery Gameroom UI hashes the password,
then sends an authorization request to the Bubba Bakery Gameroom daemon,
`gameroomd`. Then, the Gameroom daemon makes some requests to the Biome REST
API to verify the user.

```
POST /users/authenticate
{
  "email": "bob@bubbabakery.com",
  "hashedPassword": "2b944c69...c11fcf9c"
}
```

As mentioned earlier, the UI does not reveal the user's password to the REST
API because the password is used to encrypt signing keys.

#### I-3.2. Gameroom daemon uses Biome REST API to verify password

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/auth_login_bubba_2.svg %}
"Gameroom daemon retrieves user credentials")

After the Gameroom daemon has received the authentication request, the
authentication is handled by the Biome REST API. The authentication request
is sent from the Bubba Bakery Gameroom daemon to the Biome REST API.

```
POST /biome/login
{
  "username": "bob@bubbabakery.com",
  "hashed_password": "2b944c69...c11fcf9c",
}
```

When the Biome REST API receives the authorization request for Bob, it fetches
the entry from the Bubba Bakery Splinter daemon's local database associated with
the username and verifies the hashed password sent in the request.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/auth_login_bubba_3.svg %}
"Splinter daemon verifies Bob's credentials")

The `user_credentials` table in the Splinter database has the same schema as
described earlier in
[section I-1.2](#i-12-gameroom-daemon-uses-biome-rest-api-to-verify-password).
For Bob, the Splinter database has the following entry in the `user_credentials`
table:

<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>user_id</code></th>
    <th><code>username</code></th>
    <th><code>password</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td><code>9g3rmce0...9823citbg5</code></td>
    <td><code>bob@bubbabakery.com</code></td>
    <td><code>2b944c69...c11fcf9c</code></td>
  </tr>
</table>

If the hashed password from the authentication request passes verification,
the Biome REST API will respond with a success response. This response includes
JSON Web Tokens, which enable the Gameroom REST API to make authorized requests
to the Biome REST API, without requiring the user to enter their password.
The refresh token included in the success response allows a new access token to
be issued, if the refresh token has not expired, when the original token issued
has expired. Each refresh token issued is saved to the `refresh_tokens` table in
the Splinter daemon database, with an associated user ID.

The `refresh_tokens` table in the Splinter database has the same schema as
described in section
[section I-1.2](#i-12-gameroom-daemon-uses-biome-rest-api-to-verify-password).
Once Bob has logged in, the Splinter database has the following entry in the
`refresh_tokens` table:

<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>id</code></th>
    <th><code>user_id</code></th>
    <th><code>token</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td><code>1</code></td>
    <td><code>9g3rmce0...9823citbg5</code></td>
    <td><code>gy9ubMNu...tyV87rco</code></td>
  </tr>
</table>

If Bob's credentials are verified, the Biome REST API will respond with the
following success response:

```
{
  "message": "Successful login",
  "user_id": "9g3rmce0...9823citbg5",
  "token": "ihGhBIxc...923bby17",
  "refresh_token": "gy9ubMNu...tyV87rco",
}
```

#### I-3.3. Gameroom daemon uses Biome REST API to request Bob's key pairs

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/auth_login_bubba_4.svg %}
"Gameroom daemon requests Bob's keys")

Once the Gameroom daemon has verified Bob's password, it must then verify that
Bob has an associated public and private key pair. Bob's public and private key
pair was added to the Bubba Bakery Splinter database during registration (see The
Prequel, section P.2).

The request to list Bob's associated keys is made to the Biome REST API.

```
GET /biome/keys
```

The request made to the Biome REST API holds Bob's JSON Web Token in an
`Authorization` header, which enables the Splinter daemon to authorize access to
the user's key information, as well as extract the user ID from the token to
fetch the keys from the Splinter daemon's database.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/auth_login_bubba_5.svg %}
"Splinter daemon retrieves Bob's keys")

The `keys` table schema in the Splinter database has the schema as described in
section
[section I-1.3](#i-13-gameroom-daemon-uses-biome-rest-api-to-request-alice's-key-pairs).
Using the unique `user_id` extracted from the access token, the public/private
key pair associated with Bob is fetched from the Splinter daemon's database.

The Splinter database has the following entry in the `keys` table:

<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>display_name</code></th>
    <th><code>user_id</code></th>
    <th><code>public_key</code></th>
    <th><code>encrypted_private_key</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td><code>bob@bubbabakery.com</code></td>
    <td><code>9g3rmce0...9823citbg5</code></td>
    <td><code>b1834871...2914a7f4</code></td>
    <td><code>{\"iv\":...goPek\"}</code></td>
  </tr>
</table>

If Bob's public/private key pair is found in the Splinter database `keys` table,
a success response with the list of key information is sent back to Bubba Bakery's
Gameroom daemon with Bob's associated keys.

```
{
  "data": [
    {
      "public_key": "b1834871...2914a7f4",
      "user_id": "9g3rmce0...9823citbg5",
      "display_name": "bob@bubbabakery.com",
      "encrypted_private_key": "{\"iv\":\"...goPek\"}"
    }
  ]
}
```

#### I-3.4. Gameroom REST API returns login success response

If Bubba Bakery's Gameroom REST API receives a successful response from the
requests made to verify Bob's credentials and keys, then the entire authentication
process was successful. Therefore, the Gameroom REST API is then able to send
a response to the Bubba Bakery UI that contains Bob's public/private key pair.

```
{
  "email": "bob@bubbabakery.com",
  "public_key": "b1834871...2914a7f4",
  "encrypted_private_key": "{\"iv\":\"...goPek\"}",
}
```

Next, the UI must gather the information for the Bubba Bakery  Gameroom home
screen that Bob will see after logging in.

#### I-3.5. Bubba Bakery UI requests list of existing gamerooms

As part of building the Bubba Bakery home screen for Bob, the UI requests the
list of Bob's gamerooms. This process is the same as the Acme process in
[section Ⅰ-1.4](#i-14-gameroom-rest-api-returns-login-success-response).

1. The Bubba Bakery UI makes a call to the Gameroom REST API for the list of
   existing gamerooms.

    ```
    GET /gamerooms
    ```

2. The Bubba Bakery Gameroom REST API returns an empty list, because there are
   no existing gamerooms in the Bubba Bakery Gameroom's PostgreSQL database.

    ```
    {
        "data": [],
        "paging": {
               "current": "/gamerooms?limit=100&offset=0",
               "offset": 0,
               "limit": 100,
               "total": 0,
               "first": "/gamerooms?limit=100&offset=0",
               "prev": "/gamerooms?limit=100&offset=0",
               "next": "/gamerooms?limit=100&offset=0",
               "last": "/gamerooms?limit=100&offset=0"
        }
    }
    ```

#### I-3.6. Bubba Bakery UI requests list of gameroom invitations

As part of building the Bubba Bakery home screen for Bob, the UI requests the
list of Bob's invitations. This process is different from the Acme process in
[section Ⅰ-1.5](#i-15-acme-ui-requests-a-list-of-gamerooms),
because Bob has a new invitation from Alice.

1. The Bubba Bakery UI makes a call to the Gameroom REST API for Bob's list of
   invitations (also called _circuit proposals_).

    ```
    GET /proposals
    ```

2. The Bubba Bakery Gameroom REST API returns a list that includes Alice's
   invitation.

    ```
    {
        "data": [
            {
               "proposal_id": <auto-generated id>,
               "circuit_id": "01234-ABCDE",
               "circuit_hash": <hash of circuit definition>,
               "members": [
                   {
                       "node_id": "acme-node-000",
                       "endpoints": [
                        "tcps://splinterd-node-acme:8044",
                       ],
                   },
                   {
                       "node_id": "bubba-node-000",
                       "endpoints": [
                        "tcps://splinterd-node-bubba:8044"
                       ]
                   }
               ],
               "requester": <Alice's public key>,
               "requester_node_id": acme-node-000,
               "created_time": <time entry was created>,
               "updated_time": <time entry was updated>
            }
        ],
               "paging": {
                      "current": "/proposals?limit=100&offset=0",
                      "offset": 0,
                      "limit": 100,
                      "total": 1,
                      "first": "/proposals?limit=100&offset=0",
                      "prev": "/proposals?limit=100&offset=0",
                      "next": "/proposals?limit=100&offset=0",
                      "last": "/proposals?limit=100&offset=0"
               }
        }
    ```

#### I-3.7. Bubba Bakery UI queries for unread notifications

While building the Bubba Bakery home screen, the UI also requests the list of
Bob's unread notifications.

When the circuit proposal (Alice's invitation) was created, the Bubba Bakery
admin service stored Bob's notification information in the Gameroom database,
with the `read` field set to "false". For the details of how the Gameroom
tables were updated during circuit creation, see [section
Ⅰ-2.8](#i-28-gameroom-daemons-write-notification-to-gameroom-database)
and [section
Ⅰ-2.9](#i-29-alice-sees-notification-that-gameroom-invitation-was-sent).

1. The Bubba Bakery UI makes a call to the Bubba Bakery Gameroom REST API for
   the list of Bob's unread notifications.

    ```
    GET /notifications
    ```

2. The Gameroom REST API queries the `gameroom_notification` table and sends
   Bob's notifications to the Bubba Bakery UI. The notification for Alice's
   invitation looks like this:

    ```
    {
        "data": [
               {
                   "id": <auto-generated id>,
                   "notification_type": "gameroom_proposal",
                   "org": "",
                   "requester": <Alice's public key>,
                   "node_id": "acme-node-000",
                   "target": "01234-ABCDE",
                   "timestamp": <time entry was created>,
                   "read": <boolean; false means not read>,
               }
        ],
        "paging": {
                   "current": "api/notifications?limit=100&offset=0",
                   "offset": 0,
                   "limit": 100,
                   "total": 1,
                   "first": "api/notifications?limit=100&offset=0",
                   "prev": "api/notifications?limit=100&offset=0",
                   "next": "api/notifications?limit=100&offset=0",
                   "last": "api/notifications?limit=100&offset=0"
        },
    }
    ```

At this point, the Bubba Bakery Gameroom UI has the information it needs to
display Bob's home screen.

### I-4. Behind scene 4: Bob checks his notification

On Bob's Bubba Bakery home screen, the UI displays Bob's existing gamerooms on
the left (none, at this point) and notifications in the upper right (as a bell
icon). Bob's public key is not listed as the requester on the gameroom_proposal
notification, so the Bubba Bakery UI displays the notification icon with a red
badge that indicates an unread notification.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene4_2.png %}
"Bubba Bakery home screen with notification")

1. When Bob clicks the bell icon, the UI shows his unread notifications.

  ![]({% link
  docs/0.4/examples/gameroom/walkthrough/images/scene4_1.png %}
  "Bob's notification details")


2. When Bob clicks on his notification, the Bubba Bakery UI calls the Bubba
   Bakery Gameroom REST API to update the selected notification (to show that Bob
   has read it). After the update, this notification will no longer show up as a
   new notification in the UI.

  ```
  PATCH /notifications/{notification_id}/read
  ```

  This call updates the notification’s entry read field in the Bubba Bakery
  database’s gameroom_notification table from false to true. For more information
  on this table, see [section I-2.8.5](#i-285-new-gameroom_notification-table-entry).

3. After successfully updating the notification, the Bubba Bakery Gameroom REST
   API responds with the entire notification object.

  ```
  {
    "data": [
      {
        "id": <auto generated id>,
        "notification_type": "gameroom_proposal",
        "requester": <Alice’s public key>,
        “requester_node_id”: “acme-node-000”,
        "target": "01234-ABCDE",
        "timestamp": <time entry was created>,
        "read": true
      }
    ]
  }
  ```

### I-5. Behind scene 5: Bob accepts Alice's invitation

When Bob accepts Alice's invitation, the Bubba Bakery UI sends his "yes" vote to
the Gameroom REST API, which forwards it to Splinter REST API. After the vote is
validated, the admin service creates the circuit in Splinter state and tells the
Gameroom daemon that the circuit is available.

Next, the Bubba Bakery admin service notifies the Acme node that it's ready to
create services. After the Acme node responds (described in "Behind Scene 6"),
the Bubba Bakery admin service initializes its scabbard service for the new
gameroom. Scabbard is the Splinter service for Gameroom that includes the
[Sawtooth Sabre](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/sabre_transaction_family.html)
transaction handler and [Hyperledger Transact](https://crates.io/crates/transact),
using two-phase commit consensus to agree on state. Gameroom uses this service
to store the XO smart contract and manage XO state. Finally, the Gameroom daemon
updates the gameroom status in its local database from "Accepted" to "Ready".

#### I-5.1. Bubba Bakery UI submits Accept Invitation request to Gameroom REST API

When Bob clicks on the Accept button, the Bubba Bakery Gameroom UI sends a vote
(also called a "circuit vote request") to the Gameroom REST API.

```
POST /proposals/vote
  {
    "circuit_id": "gameroom::acme-node-000::bubba-node-000::<UUIDv4>",
    "circuit_hash": "8cd2bfcf3f4259b9785a723e19b4bb4d5cc0206e",
    "vote": "Accept"
  }
```

#### I-5.2. Gameroom REST API submits Proposal Accept request to Splinter REST API

1. When the Bubba Bakery Gameroom REST API receives the vote request, it uses
   that information to create a `CircuitManagementPayload`, which will eventually
   be sent to the Bubba Bakery Splinter daemon.

2. Before the payload can be sent, the Bubba Bakery UI must sign the bytes of
   the `CircuitManagementPayload` header.

    The following example shows a YAML representation of the
    `CircuitManagementPayload` that the Gameroom REST API creates.

    **Circuit proposal vote**:
    ```
    circuit_id: gameroom::acme-node-000::bubba-node-000::<UUIDv4>
    circuit_hash: <sha256 hash of the circuit definition of the proposed circuit>
    vote: Accept
    ```

    **Header**:
    ```
    Action: CIRCUIT_PROPOSAL_VOTE
    requester: <public key of requester> // left empty by the REST API
    payload_sha512: <sha512 hash of the circuit proposal vote described above>
    requester_id: <ID of the Splinter node that the requester is registered to>
    ```

    **`CircuitManagementPayload`**:
    ```
    header: <bytes of header described above>
    circuit_proposal_vote: <circuit proposal vote described above>
    signature: <signature of bytes of the header> // left empty by the REST API
    ```

    Note that the Gameroom REST API does not fill in the requester field in the
    header or the signature field in the `CircuitManagementPayload`.

3. The Bubba Bakery Gameroom REST API serializes the payload and sends the bytes
   as a response to the UI.

    ```
    {
      "data": { “payload_bytes”: <bytes of the CircuitManagementPayload> }
    }
    ```

4. After receiving the response from the Gameroom REST API, the Bubba Bakery UI
   deserializes the `CircuitManagementPayload`. It adds the requester's public
   key to the header (in this case, Alice is the requester), serializes the
   header, signs the header bytes, and adds the signature to the payload.
   Finally, the UI serializes the complete payload.

5. The Bubba Bakery UI submits the bytes of the signed payload to the Gameroom
   REST API.

    ```
    POST /submit
    Content-Type: application/octet-stream
    <bytes of the signed CircuitManagementPayload>
    ```

6. The Bubba Bakery Gameroom REST API forwards the payload to the Bubba Bakery
   Splinter daemon.

    ```
    POST /submit
    Content-Type: application/octet-stream
    <bytes of the signed CircuitManagementPayload>
    ```

7. The Splinter REST API responds with the status "202 Accepted" and the Bubba
   Bakery admin service processes the vote.

8. The Bubba Bakery REST API forwards the "202 Accepted" response to the Bubba
   Bakery UI.

#### I-5.3. Bubba Bakery node votes "yes" (validates the vote)

1. The Bubba Bakery admin service (`admin::bubba-node-000`) receives the
   `CircuitManagementPayload` containing a `CircuitProposalVote` from the Splinter
   REST API, and adds it to its pending circuit payloads queue.

    ```
    CircuitProposalVote:
    circuit_id: gameroom::acme-node-000::bubba-node-000::<UUIDv4>
    circuit_hash: <hash of circuit>
    vote: ACCEPT
    ```

2. The Bubba Bakery admin service validates `CircuitManagementPayload` using the
   same validation process described earlier (see
   [section I-2.5.1](#i-251-acme-node-validates-the-circuitmanagementpayload),
   step 1). It also validates the provided payload (a `CircuitProposalVote`)
   using vote-specific validation rules. `CircuitProposalVote` is valid if the
   following things are true:

    * There is a pending `CircuitProposal` in admin state with the same circuit
      ID as in the `CircuitProposalVote`

    * The hash of the stored pending `CircuitProposal` is the same as the
      `circuit_hash` in `CircuitProposalVote`

    * `CircuitProposalVote` vote field is set to either the Vote enum `ACCEPT` or
      `REJECT`

    * The public key belongs to a node in the circuit, and that node is allowed
      to submit the vote (see below).

    * `CircuitProposal` does not already contain a vote from that node.
      To verify the node's public key and voting permission, the admin service
      checks the key registry and key permissions manager.

    * The key registry provides a way to look up details about a public key used
      to sign a circuit proposal: the requester node ID (the "home node" of the
      requester and location of that user's public key) and arbitrary metadata
      (represented as key/value string pairs).

    * The key permissions manager checks that a public key is authorized in a
      specific role. In the case of circuit proposal votes, the signing public
      key must be authorized for the role "voter".

3. If the request is valid, the admin service makes a copy of the existing
   `CircuitProposal`, adds a vote record to it, and stores it in
   `AdminServiceShared.pending_changes`. The protobuf is represented in YAML
   format.

    ```
    CircuitProposal:
      proposal_type: CREATE
      circuit_id: gameroom::acme-node-000::bubba-node-000::<UUIDv4>:
      circuit_hash: <hash of circuit>
      circuit_proposal:
        circuit:
          gameroom::acme-node-000::bubba-node-000::<UUIDv4>:
            auth: trust
            members:
              acme-node-000:
                endpoints:
                  - tls://splinterd-node-acme:8044
              bubba-node-000:
                endpoints:
                  - tls://splinterd-node-bubba:8044
            roster:
              gameroom_acme-node-000:
                service_type: scabbard
                allowed_nodes:
                  - acme-node-000
                arguments:
                  - peer_services:
                      - gameroom_bubba-node-000
                    admin_keys:
                      - <acme gameroomd public key>

              gameroom_bubba-node-000:
                service_type: scabbard
                allowed_nodes:
                  - acme-node-000
                arguments:
                  - peer_services:
                      - gameroom_acme-node-000
                    admin_keys:
                      - <acme gameroomd public key>

            persistence: any
            durability: none
            routes: require_direct
            circuit_management_type: gameroom
      votes:
        - public_key: <voter’s public key>
          vote: ACCEPT
          voter_node_id: bubba-node-000
      requester: <public key of requester>
      requester_node_id: acme-node-000
    ```

4. The admin service creates a new consensus `Proposal` for the updated
   `CircuitProposal`. (See
    [section I-2.5.1](#i-251-acme-node-validates-the-circuitmanagmentpayload),
    step 3, for the `Proposal` description.)

#### I-5.4. Bubba Bakery node sends proposal accept vote to Acme node

1. After the Bubba node creates the updated `CircuitProposal`, the
   `CircuitManagementPayload` is sent to the other members defined in the circuit
   -- specifically, the admin service on the Acme node (`admin::acme-node-000`).

2. The Acme admin service receives the `CircuitMangementPayload` containing the
   `CircuitProposalVote` (as described in
   [section I-5.3](#i-53-bubba-bakery-node-votes-yes-validates-the-vote),
   step 1), validates the payload (see
   [section I-5.3](#i-53-bubba-bakery-node-votes-yes-validates-the-vote),
   step 2), and creates an updated `CircuitProposal` (see
   [section I-5.3](#i-53-bubba-bakery-node-votes-yes-validates-the-vote),
   step 3).

3. The nodes use consensus to agree to accept or reject the circuit proposal.
   See Appendix B for more information on consensus agreement.

4. After consensus has completed its agreement on the proposal, it notifies the
   Bubba Bakery admin service that both nodes have accepted the proposal. The
   Bubba Bakery admin service then commits the updated `CircuitProposal`.

#### I-5.5. Bubba Bakery admin service checks for approval and creates a circuit

1. When the `CircuitProposal` is committed, the Bubba Bakery admin service checks
   to see if it contains the required number of `ACCEPT` votes to be added to
   Splinter state (the `SplinterState` struct), where active circuits are stored.

   The `CircuitProposal` must have a `VoteRecord` with a vote of `ACCEPT` from
   every member of the proposed circuit definition, except for the requester
   (because submitting a circuit proposal counts as an accept vote).

2. If a vote exists for every member, the Bubba Bakery admin service adds the
   circuit defined in the CircuitProposal to Splinter state. Once in Splinter
   state, the circuit is ready to accept service connections and be used for
   communication.

3. After the circuit has been created, the Bubba Bakery admin service creates
   the scabbard service using the service orchestrator (described in
   [section I-5.8](#i-58-bubba-bakery-admin-service-initializes-scabbard-service)).

#### I-5.6. Bubba Bakery admin service notifies Gameroom daemon of new circuit

1. The Bubba Bakery admin service notifies the Bubba Bakery application
   authorization handler that the circuit has been accepted.
    ```
    {
      “eventType”: “ProposalAccepted”,
      “message”: {
        “proposal_type”: “Create”,
        “circuit_id”: “gameroom::acme-node-000::bubba-node-000::<UUIDv4>”,
        “circuit_hash”: “...”,
        “circuit”: {
          "circuit_id": "gameroom::acme-node-000::bubba-node-000::<UUIDv4>",
          "authorization_type": "Trust",
          "members": [{
            "node_id": "acme-node-000",
            "endpoint": "tls://splinterd-node-acme:8044"
            },
            {
            "node_id": "bubba-node-000",
            "endpoint": "tls://splinterd-node-bubba:8044"
            }
          ],
          "roster": [{
            "service_id": "gameroom_acme-node-000",
            "service_type": "scabbard",
            "allowed_nodes": [ "acme-node-000"]
            "arguments": {
                "peer_services": [ "gameroom_bubba-node-000" ]
                "admin_keys": [ "<acme gameroomd public key>" ]
              }
            },
            {
            "service_id": "gameroom_bubba-node-000",
            "service_type": "scabbard",
            "allowed_nodes": [ "bubba-node-000"]
            "arguments": {
                "peer_services": [ "gameroom_acme-node-000" ]
                "admin_keys": [ "<acme gameroomd public key>" ]
              }
            }
          ],
          "circuit_management_type": "gameroom",
          "application_metadata": [...],
          "persistence": "Any",
          "durability": "None",
          "routes": "Any"
        },
        “vote_record”: [{
          “public_key”: “<public key of voter>”,
          “vote”: “Accepted”
          "voter_node_id": “bubba-node-000”
        }],
        “requester”: “<public key of requester>”
        “requester_node_id”: “acme-node-000”
      }
    }
    ```

2. When the application authorization handler receives this message, it updates
   the database to change the status of the proposal, gameroom, members and
   services from “Pending” to “Accepted”.

   At the end of the database transaction, the gameroom database has the
   following updates:

    * `gameroom` table:

    <table class ="gameroom_db_table" border="1">

      <tr class="gameroom_db_headers">
        <th><code>circuit_id</code></th>
        <th><code>authorization_type</code></th>
        <th><code>persistence</code></th>
        <th><code>routes</code></th>
        <th><code>durability</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code> gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
        <td><code>Trust</code></td>
        <td><code>Any</code></td>
        <td><code>Any</code></td>
        <td><code>None</code></td>
      </tr>
      <tr class="gameroom_db_headers">
        <th><code>circuit_management_type</code></th>
        <th><code>alias</code></th>
        <th><code>status</code></th>
        <th><code>created_time</code></th>
        <th><code>updated_time</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>gameroom</code></td>
        <td><code>Acme + Bubba</code></td>
        <td><code>accepted</code></td>
        <td><code>&lt;time status was updated&gt;</code></td>
        <td><code>&lt;time entry was created&gt;</code></td>
      </tr>

    </table>

    * `gameroom_member` table

    <table class ="gameroom_db_table" border="1">
      <tr class="gameroom_db_headers">
        <th><code>id</code></th>
        <th><code>circuit_id</code></th>
        <th><code>node_id</code></th>
        <th><code>endpoint</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;auto generated id&gt;</code></td>
        <td><code>gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
        <td><code>acme-node-000</code></td>
        <td><code>tls://splinterd-node-acme:8044</code></td>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;auto generated id&gt;</code></td>
        <td><code>gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
        <td><code>bubba-node-000</code></td>
        <td><code>tls://splinterd-node-bubba:8044</code></td>
      </tr>
      <tr class="gameroom_db_headers">
        <th><code>status</code></th>
        <th><code>created_time</code></th>
        <th><code>updated_time</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>accepted</code></td>
        <td><code>&lt;time status was updated&gt;</code></td>
        <td><code>&lt;time entry was created&gt;</code></td>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>accepted</code></td>
        <td><code>&lt;time status was updated&gt;</code></td>
        <td><code>&lt;time entry was created&gt;</code></td>
      </tr>
    </table>

    * `gameroom_service` table:

    <table class ="gameroom_db_table" border="1">
      <tr class="gameroom_db_headers">
        <th><code>id</code></th>
        <th><code>circuit_id</code></th>
        <th><code>service_id</code></th>
        <th><code>service_type</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;auto generated id&gt;</code></td>
        <td><code>gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
        <td><code>gameroom_acme-node-000</code></td>
        <td><code>scabbard</code></td>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;auto generated id&gt;</code></td>
        <td><code>gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
        <td><code>gameroom_bubba-node-000</code></td>
        <td><code>scabbard</code></td>
      </tr>
      <tr class="gameroom_db_headers">
        <th><code>allowed_nodes</code></th>
        <th><code>arguments</code></th>
        <th><code>status</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>{"acme-node-000"}</code></td>
        <td><code>"peer_services": ["gameroom_bubba-node-000"], "admin_keys": ...</code></td>
        <td><code>accepted</code></td>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>{"bubba-node-000"}</code></td>
        <td><code>"peer_services": ["gameroom_acme-node-000"], "admin_keys": ...</code></td>
        <td><code>accepted</code></td>
      </tr>
      <tr class="gameroom_db_headers">
        <th><code>created_time</code></th>
        <th><code>updated_time</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;time entry was created&gt;</code></td>
        <td><code>&lt;time status was updated&gt;</code></td>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;time entry was created&gt;</code></td>
        <td><code>&lt;time status was updated&gt;</code></td>
      </tr>
    </table>

    * `gameroom_proposal` table:

    <table class ="gameroom_db_table" border="1">
      <tr class="gameroom_db_headers">
        <th><code>id</code></th>
        <th><code>circuit_id</code></th>
        <th><code>proposal_type</code></th>
        <th><code>circuit_hash</code></th>
      </tr>
      <tr class="gameroom_db_data">
        <td><code>&lt;auto generated id&gt;</code></td>
        <td><code>gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
        <td><code>Create</code></td>
        <td><code>&lt;hash of circuit definition&gt;</code></td>
      </tr>
    </table>

3. Finally, the application authorization handler updates the
   `gameroom_notification` table to tell the UI that the gameroom proposal has
   been accepted.

   <table class ="gameroom_db_table" border="1">
     <tr class="gameroom_db_headers">
       <th><code>id</code></th>
       <th><code>notification_type</code></th>
       <th><code>requester</code></th>
       <th><code>requester_node_id</code></th>
     </tr>
     <tr class="gameroom_db_data">
       <td><code>&lt;auto generated id&gt;</code></td>
       <td><code>proposal_accepted</code></td>
       <td><code>&lt;Bob's public key&gt;</code></td>
       <td><code>bubba-node-000</code></td>
     </tr>
     <tr class="gameroom_db_headers">
       <th><code>target</code></th>
       <th><code>created_time</code></th>
       <th><code>read</code></th>
     </tr>
     <tr class="gameroom_db_data">
       <td><code>gameroom::acme-node-000::bubba-node-000::&lt;UUIDv4&gt;</code></td>
       <td><code>&lt;time entry was created&gt;</code></td>
       <td><code>false</code></td>
     </tr>
   </table>

#### I-5.7. Bubba Bakery admin service sends "ready to create services" to Acme

Before the Bubba Bakery admin service can initialize its scabbard service on the
new circuit, it needs to know that the Acme Splinter node has also created the
circuit on the Acme side (added the circuit that is defined in the
`CircuitProposal` to Splinter state). The Acme process will be described in the
next chapter (section I-6).

This information is required because when a Splinter service connects to its own
Splinter node (the node that it is allowed to connect to), that Splinter node
sends a message to the other connected Splinter nodes on the new circuit that
the service is available. This message cannot be sent until the Splinter node
(in this case, the Acme node) has created the circuit.

If the circuit was not yet created on the other Splinter node (or nodes), the
message would be dropped. This node would not be able to communicate with the
other node's service after the circuit is created, because it wouldn't know
where that service exists.

1. To notify the Acme admin service that the Bubba Bakery node is ready to
   initialize its service, the Bubba Bakery admin service sends an `AdminMessage`
   with the message type `MEMBER_READY` and a "member ready" message that
   contains the circuit ID and Bubba Bakery's node ID.

    ```
    admin_message:
    message_type: MEMBER_READY,
    member_ready:
      circuit_id: gameroom::acme-node-000::bubba-node-000::<UUIDv4>
      member_node_id: bubba-node-000
    ```

2. The Bubba Bakery admin service waits for Acme to respond with a "member
   ready" message. (The next section describes how the Bubba Bakery node
   initializes its services.)

#### I-5.8. Bubba Bakery admin service initializes scabbard service

After the circuit is created (described in
[section I-5.5](#i-55-acme-and-bubba-bakery-reach-consensus)) and all members are
ready to create services (covered in
[section I-5.7](#i-57-bubba-bakery-admin-service-sends-ready-to-create-services-to-acme)),
the Bubba Bakery admin service makes a call to the service orchestrator to
initialize the scabbard service for the new gameroom. As described above,
scabbard is the Splinter service for Gameroom that includes the
[Sawtooth Sabre](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/sabre_transaction_family.html)
transaction handler and [Hyperledger Transact](https://crates.io/crates/transact),
using two-phase commit consensus to agree on state. Gameroom uses this service
to store the XO smart contract and manage XO state.

1. The Bubba Bakery admin service checks which services are allowed to run on
   its node. In this case, the Bubba Bakery node (`bubba-node-000`) is allowed to
   run the scabbard service with service ID `gameroom_bubba-node-000`.

2. The admin service creates a ServiceDefinition for `gameroom_bubba-node-000`,
   which is the scabbard service on the Bubba Bakery Splinter node.

    ```
    ServiceDefinition {
      circuit: "gameroom::acme-node-000::bubba-node-000::<UUIDv4>",
      service_id: "gameroom_bubba-node-000",
      service_type: "scabbard",
    }
    ```

3. The admin service passes the service definition, along with the arguments
   defined in the `CircuitProposal` for that service, to the service
   orchestrator’s `initialize_service` method to initialize the scabbard service.

4. `ServiceOrchestrator` uses structs that implement the `ServiceFactory` trait
   to create new services. An orchestrator can have multiple factories. First,
   the orchestrator must determine which factory can create a scabbard service
   (in this case, the `ScabbardFactory`). Then the orchestrator creates a new
   instance of the scabbard service using that factory, the service definition,
   and the service arguments.

5. After the scabbard service has been created, the orchestrator starts the
   service and adds it to its internally managed list of services. When starting
   the service, the orchestrator creates a `StandardServiceNetworkRegistry`
   (used to register the service with the node) and passes it to the service;
   the scabbard service then registers, which provides it with a
   `StandardServiceNetworkSender` that it will use to send direct messages to
   other services.

#### I-5.9. Bubba Bakery Gameroom daemon updates gameroom status in database

At this point, the new service is running and ready to receive smart contracts.

1. The Bubba Bakery admin service sends a `CircuitReady` notification to the
   Gameroom daemon's application authorization handler to let it know that the
   circuit is created and its services are ready.

    ```
    {
      “eventType”: "CircuitReady",
      “message”: {
        “proposal_type”: “Create”,
        “circuit_id”: “gameroom::acme-node-000::bubba-node-000::<UUIDv4>”,
        “circuit_hash”: “...”,
        “circuit”: {
          "circuit_id": "gameroom::acme-node-000::bubba-node-000::<UUIDv4>",
          "authorization_type": "Trust",
          "members": [{
            "node_id": "acme-node-000",
            "endpoint": "tls://splinterd-node-acme:8044"
            },
            {
            "node_id": "bubba-node-000",
            "endpoint": "tls://splinterd-node-bubba:8044"
            }
          ],
          "roster": [{
            "service_id": "gameroom_acme-node-000",
            "service_type": "scabbard",
            "allowed_nodes": [ "acme-node-000"]
            "arguments": {
                "peer_services": [ "gameroom_bubba-node-000" ]
                "admin_keys": [ "<acme gameroomd public key>" ]
              }
            },
            {
            "service_id": "gameroom_bubba-node-000",
            "service_type": "scabbard",
            "allowed_nodes": [ "bubba-node-000"]
            "arguments": {
                "peer_services": [ "gameroom_acme-node-000" ]
                "admin_keys": [ "<acme gameroomd public key>" ]
              }
            }
          ],
          "circuit_management_type": "gameroom",
          "application_metadata": [...],
          "persistence": "Any",
          "durability": "None",
          "routes": "Any"
        },
        “vote_record”: [{
          “public_key”: “<public key of voter>”,
          “vote”: “Accepted”
          "voter_node_id": “bubba-node-000”
        }],
        “requester”: “<public key of requester>”
        “requester_node_id”: “acme-node-000”
      }
    }
    ```

2. When the authorization handler receives the `CircuitReady` message, it
   changes the status of the gameroom in the database from “Accepted” to “Ready”.

3. The authorization handler creates a new `WebSocket` to listen for events from
   the scabbard service. These events are then captured, parsed, and uploaded
   into the gameroom database. The process of reading state-change updates from
   Splinter and uploading them to a local database is called "state delta export"
   and is done by the `XoStateDeltaProcessor`. The `XoStateDeltaProcessor`
   consumes `StateChangeEvent` payloads, such as this example:
    ```
    {
      “type”: “Set”,
      “message”: {
        “key”: “<xo_address>”
        “value” [<bytes>]
      }
    }
    ```

    The bytes in value field are deserialized into the following CSV-format
    representation of the XO game state:

    `“<game-name>,<game-board>,<game-state>,<player1-key>,<player2-key>”`

    For more information on the XO game state, see Appendix D.

At this point, the circuit (Alice and Bob's gameroom) is ready. Next, the Acme
Gameroom daemon must submit the XO smart contract, which is the last step before
the gameroom is ready for Alice and Bob to play games. See section I-6.6 for an
explanation of this process.

### I-6. Behind scene 6: Bob accepts Alice's invitation

Most of the steps in this scene are similar to the Bubba Bakery steps described
earlier. However, one activity is unique — because the Acme node (Alice's node)
requested the new circuit, it is responsible for submitting the XO smart
contract that will allow Alice and Bob to play tic tac toe in the new gameroom.

#### Ⅰ-6.1. Acme admin service receives `CircuitProposalVote` from Bubba Bakery

When the Acme Splinter node receives the `CircuitManagementPayload` network
message containing the Bubba Bakery `CircuitProposalVote` (sent in
[section 5.4](#i-54-bubba-bakery-node-sends-proposal-accept-vote-to-acme-node)),
it "unwraps" the message with a series of dispatchers. See section 2.7 for the
details of this process.

As described in [section 5.4](#i-54-bubba-bakery-node-sends-proposal-accept-vote-to-acme-node),
step 3, both nodes use consensus to agree on the circuit proposal, After they
agree, the Acme node commits the CircuitProposal.

#### Ⅰ-6.2 Acme admin service checks for approval and creates circuit

When the CircuitProposal is committed, the Acme admin service checks that the
Bubba Bakery node has voted "yes" (see
[section 5.3](#i-53-bubba-bakery-node-votes-yes-validates-the-vote),
then creates the circuit (adds the new circuit to Splinter state). For the
details of this process, see
[section I-5.5](#i-55-bubba-bakery-admin-service-checks-for-approval-and-creates-a-circuit).

#### Ⅰ-6.3. Acme admin service notifies Acme Gameroom daemon of new circuit

Once the circuit has been created, the Acme admin service tells the Acme
application authorization handler that the circuit has been accepted. When the
application authorization handler receives this message, it updates the
database to change the status of the proposal, gameroom, members and services
from “Pending” to “Accepted”. See [section I-5.6](#i-56-bubba-bakery-admin-service-notifies-gameroom-daemon-of-new-circuit)
for the details of this process.

#### Ⅰ-6.4. Acme admin service tells Bubba Bakery that it is ready to create services

The Acme node notifies the Bubba Bakery node that it is ready to initialize the
Acme scabbard service by sending an an `AdminMessage` with the message type
`MEMBER_READY` and a "member ready" message that contains the circuit ID and
Acme's Splinter node ID.

The Acme node waits for all members to report a "member ready" message before
proceeding. For the details, see [section I-5.7](#i-57-bubba-bakery-admin-service-sends-ready-to-create-services-to-acme).

#### Ⅰ-6.5. Acme admin service creates scabbard service via service orchestration

After the Acme node learns that all members are ready to create services, the
Acme admin service makes a call to the service orchestrator to initialize the
scabbard service for the new gameroom. See [section I-5.8](#i-58-bubba-bakery-admin-service-initializes-scabbard-service)
for the details of this process.

#### Ⅰ-6.6. Acme Gameroom daemon submits Sabre transactions to add XO smart contract

The Acme Gameroom daemon submits the XO smart contract by using the scabbard
REST API that is exposed by the Splinter daemon, `splinterd`.

When the Acme Gameroom daemon’s application authorization handler receives the
`CircuitReady` notification from the admin service, it subscribes to scabbard
and starts listening for scabbard events. See Appendix C for the registration
(event subscription) process.

```
GET <circuit_id>/<service_id>/ws/subscribe
```

After a connection has been established, the application authorization handler
prepares the XO (tic tac toe) business logic by submitting the XO smart
contract to the Acme scabbard service.

The Acme gameroom daemon gets the following information from the
`CircuitProposal` that was just accepted (as described in
[section I-5.9](#i-59-bubba-bakery-gameroom-daemon-updates-gameroom-status-in-database)):

`circuit_id`: unique ID of the new circuit that includes a version 4 UUID, such
as `gameroom::acme-node-000::bubba-node-000::<UUIDv4>`

`service_id`: ID of the scabbard service that is running on the local Splinter
node; for example: `gameroom_acme-node-000`

`scabbard_admin_keys`: scabbard admin keys that are stored in the circuit
proposal’s application metadata

The scabbard admin keys in Gameroom’s application metadata specify who is
allowed to add or modify smart contracts. When the circuit is initially defined
(see [section I-2.3](#i-23-gameroom-rest-api-sends-a-circuitmanagementpayload)),
the Gameroom daemon that creates the circuit definition (in this case, Acme's
`gameroomd`) specifies its own public key as the scabbard admin. Since the Acme
Gameroom daemon has the only key that’s authorized to add smart contracts, it
is responsible for adding the XO smart contract.

To add the XO smart contract, the Acme Gameroom daemon creates a series of
transactions to set the permissions surrounding the smart contract and to
submit the smart contract itself. For more information, see the
[Sawtooth Sabre](https://sawtooth.hyperledger.org/docs/sabre/nightly/master/sabre_transaction_family.html)
documentation.

The Acme Gameroom daemon bundles these transactions into a batch, serializes
the batch, and submits the serialized batch to the scabbard service on its
local Splinter node:

```
	POST /scabbard/<circuit_id>/<service_id>/batches
  <serialized batch>
```

For more information about batches, see "Transactions and Batches" in the
[Sawtooth Architecture](https://sawtooth.hyperledger.org/docs/core/releases/latest/architecture/transactions_and_batches.html)
documentation.

When the Acme scabbard service receives this batch, it must agree with the
Bubba Bakery scabbard service to submit the smart contract. The Acme scabbard
service performs the following steps:

a. Deserializes the batch: Shares the batch with the other scabbard services in
   the circuit (in this case, the Bubba Bakery scabbard service)

b. Creates a consensus proposal to send to the admin services of the other
   nodes (in this case, Bubba Bakery's scabbard service) to agree on the batch

c. Waits for consensus to agree on the batch, then commits it to scabbard
   state. For information on consensus, see Appendix B: Consensus.

d. After the scabbard services on both nodes have committed the smart contract,
   the Acme Splinter node is done setting up the gameroom.

#### Ⅰ-6.7. Both Gameroom daemons update gameroom status in database

The application authorization handler listens for scabbard events using its
state delta processor, `XoStateDeltaProcessor`. When the state delta processor
receives an event with the address of the uploaded XO contract it then sets the
status of the gameroom to “circuit_active”

```
StateChangeEvent containing contact address
{
  “type”: “Set”,
  “message”: {
    “key”: “<xo_contract_address>”
    “value” [..]
  }
}
```

At this point, the state delta processor will begin listening for
XO game state changes (defined in Appendix D).

#### Ⅰ-6.8. Acme Gameroom daemon notifies Acme UI

After the state delta processor sets the status of the gameroom to
“circuit_active”, the Acme Gameroom application authorization handler adds a
new entry to the `gameroom_notification` table:


<table class ="gameroom_db_table" border="1">
  <tr class="gameroom_db_headers">
    <th><code>id</code></th>
    <th><code>notification_type</code></th>
    <th><code>requester</code></th>
    <th><code>requester_node_id</code></th>
  </tr>
  <tr class="gameroom_db_data">
    <td class="gameroom_placeholder"><code>auto generated id</code></td>
    <td><code>gameroom_proposal</code></td>
    <td class="gameroom_placeholder"><code>Alice's public key</code></td>
    <td><code>acme-node-000</code></td>
  </tr>
  <tr class="gameroom_db_headers">
    <th><code>target</code></th>
    <th><code>created_time</code></th>
    <th><code>read</code></th>
  </tr>
  <tr>
    <td><code>01234-ABCDE</code></td>
    <td class="gameroom_placeholder"><code>time entry was created</code></td>
    <td><code>f</code></td>
  </tr>
</table>


This notification is pushed to the Acme UI in the same way as the
“gameroom_proposal” notification. (See [section I-2.8.4](#i-284-new-gameroom-proposal-table-entry))

#### Ⅰ-6.9. Alice sees notification that new gameroom is ready

After the notification is pushed to the Acme UI, Alice sees a new notification.
The new gameroom also appears on the dashboard menu.

![]({% link
docs/0.4/examples/gameroom/walkthrough/images/scene6_3.png %}
"Acme gameroom homescreen")

When Alice clicks on the notification, she sees the details page for the new
gameroom. (See [Behind Scene 4, Bob Checks his Notifications](#i-4-behind-scene-4-bob-checks-his-notification))
