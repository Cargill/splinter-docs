# Application Authorization

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Registering Applications to receive admin service events

Applications need to receive notifications for events so that they
can react appropriately to circuit proposal events and other admin events.

To see these events, an application must register an application authorization
handler for circuits with a specific circuit management type. This handler
manages the voting strategy for the application and notifies the application of
any events received from the admin service on the local Splinter node.

As part of the event registration, the application authorization handler must
specify the circuit management type. The `circuit_management_type` string in
the circuit definition briefly describes the purpose of the circuit. For
example, the Grid application uses the type `grid` for its circuits.

When an event occurs (such as a new circuit proposal or vote), each admin
service uses a WebSocket connection to notify its application authorization
handlers about the event. In order to receive WebSocket notifications, each
application authorization handler must send a registration request to its
Splinter node’s REST API.

For example, the Grid daemon would send this registration request:

```
GET /ws/admin/register/grid
```

## Admin Service Events

A registered application authorization handler receives messages (via a
WebSocket connection) about circuit proposal events.

1. The application authorization handler sends a request to the Splinter REST
   API. The request is a WebSocket handshake request that looks like this:

    ```
    HttpRequest HTTP/1.1 GET:/ws/admin/register/grid
      headers:
        "SplinterProtocolVersion": "2"
        "upgrade": "websocket"
        "connection": "Upgrade"
        "sec-websocket-key": "13"
        "sec-websocket-version": "13"
        "authorization": "Bearer Cylinder:CYLINDER_JWT"
      ```

    SplinterProtocolVersion can be set to "1" to receive Splinter 0.4 compatible
    AdminEvents. If not supplied, defaults to "2".

2. If the request is successful, the server sends a response indicating that
   the protocol will change from HTTP to WebSocket. The response looks like
   this:

    ```
    Response HTTP/1.1 101 Switching Protocols
      headers:
        "upgrade": "websocket"
        "transfer-encoding": "chunked"
        "sec-websocket-accept": "qRuMdykMYGEyIrjwimgOGL79D68="
      body: Stream
    ```

3. After the protocol has been upgraded, the handler receives messages (via the
   WebSocket connection) about admin service events related to the Grid
   application. The event types include:

    - `ProposalSubmitted`
    - `ProposalVote`
    - `ProposalRejected`
    - `ProposalAccepted`
    - `CircuitReady`
    - `CircuitDisbanded`

These event messages are serialized JSON.

### `ProposalSubmitted` event

The serialized JSON message for a `ProposalSubmitted` event looks like this:

```
{
  "timestamp": 1636139918642,
  "eventType": "ProposalSubmitted",
  "message": {
    "proposal_type": "Create",
    "circuit_id": "blLHA-eDHvC",
    "circuit_hash": "c939e0cd15c1ccec1dc1d2360658598db3bf3e63d3a0cc094f72939cf6c0af6b",
    "circuit": {
      "circuit_id": "blLHA-eDHvC",
      "roster": [
        {
          "service_id": "a000",
          "service_type": "scabbard",
          "allowed_nodes": [
            "n20959"
          ],
          "arguments": [
            [
              "admin_keys",
              "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
            ],
            [
              "version",
              "2"
            ],
            [
              "peer_services",
              "[\"b000\"]"
            ]
          ]
        },
        {
          "service_id": "b000",
          "service_type": "scabbard",
          "allowed_nodes": [
            "n8198"
          ],
          "arguments": [
            [
              "admin_keys",
              "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
            [
              "version",
              "2"
            ],
            [
              "peer_services",
              "[\"a000\"]"
            ]
          ]
        }
      ],
      "members": [
        {
          "node_id": "n20959",
          "endpoints": [
            "tcp://127.0.0.1:18044"
          ],
          "public_key": null
        },
        {
          "node_id": "n8198",
          "endpoints": [
            "tcp://127.0.0.1:28044"
          ],
          "public_key": null
        }
      ],
      "authorization_type": "Challenge",
      "persistence": "Any",
      "durability": "NoDurability",
      "routes": "Any",
      "circuit_management_type": "grid",
      "application_metadata": "",
      "comments": null,
      "display_name": "circuit01",
      "circuit_version": 1,
      "circuit_status": "Active"
    },
    "votes": [],
    "requester": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
    "requester_node_id": "n20959"
  },
  "event_id": 4
}
```

### `ProposalVote` event

The serialized JSON message for a `ProposalVote` event looks like this:

```
{
  "timestamp": 1636141093695,
  "eventType": "ProposalVote",
  "message": [
    {
      "proposal_type": "Create",
      "circuit_id": "GUKtC-8q3x0",
      "circuit_hash": "46283320452466eeb42c823673e01fcca36e99fe720ee11c90ccc580150235f4",
      "circuit": {
        "circuit_id": "GUKtC-8q3x0",
        "roster": [
          {
            "service_id": "a000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n20959"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"b000\", \"c000\"]"
              ]
            ]
          },
          {
            "service_id": "b000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n8198"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"a000\", \"c000\"]"
              ]
            ]
          },
          {
            "service_id": "c000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n3198"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"a000\", \"b000\"]"
              ]
            ]
          }
        ],
        "members": [
          {
            "node_id": "n20959",
            "endpoints": [
              "tcp://127.0.0.1:18044"
            ],
            "public_key": [3, ..,  221]
          },
          {
            "node_id": "n8198",
            "endpoints": [
              "tcp://127.0.0.1:28044"
            ],
            "public_key": [2, .., 164]
          },
          {
            "node_id": "n3198",
            "endpoints": [
              "tcp://127.0.0.1:38044"
            ],
            "public_key": [ 2, .., 194]
          }
        ],
        "authorization_type": "Challenge",
        "persistence": "Any",
        "durability": "NoDurability",
        "routes": "Any",
        "circuit_management_type": "grid",
        "application_metadata": "",
        "comments": null,
        "display_name": "circuit01",
        "circuit_version": 2,
        "circuit_status": "Active"
      },
      "votes": [
        {
          "public_key": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
          "vote": "Accept",
          "voter_node_id": "n8198"
        }
      ],
      "requester": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
      "requester_node_id": "n20959"
    },
    [3, .., 3]
  ],
  "event_id": 16
}
```


### `ProposalRejected` event

The serialized JSON message for a `ProposalRejected` event looks like this:

```
{
  "timestamp": 1636140441149,
  "eventType": "ProposalRejected",
  "message": [
    {
      "proposal_type": "Create",
      "circuit_id": "V9704-1UBvL",
      "circuit_hash": "567b65c6eb1a4443f49a1b881a4b8b4fa3fa3e4df0974b842978e6f500975dd3",
      "circuit": {
        "circuit_id": "V9704-1UBvL",
        "roster": [
          {
            "service_id": "a000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n20959"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"b000\"]"
              ]
            ]
          },
          {
            "service_id": "b000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n8198"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"a000\"]"
              ]
            ]
          }
        ],
        "members": [
          {
            "node_id": "n20959",
            "endpoints": [
              "tcp://127.0.0.1:18044"
            ],
            "public_key": [3, .., 221]
          },
          {
            "node_id": "n8198",
            "endpoints": [
              "tcp://127.0.0.1:28044"
            ],
            "public_key": [2, .., 164]
          }
        ],
        "authorization_type": "Challenge",
        "persistence": "Any",
        "durability": "NoDurability",
        "routes": "Any",
        "circuit_management_type": "grid",
        "application_metadata": "",
        "comments": null,
        "display_name": "circuit01",
        "circuit_version": 2,
        "circuit_status": "Active"
      },
      "votes": [
        {
          "public_key": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
          "vote": "Reject",
          "voter_node_id": "n8198"
        }
      ],
      "requester": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
      "requester_node_id": "n20959"
    },
    [3, .., 3]
  ],
  "event_id": 12
}
```

### `ProposalAccepted` event

The serialized JSON message for a `ProposalAccepted` event looks like this:

```
{
  "timestamp": 1636140018589,
  "eventType": "ProposalAccepted",
  "message": [
    {
      "proposal_type": "Create",
      "circuit_id": "blLHA-eDHvC",
      "circuit_hash": "c939e0cd15c1ccec1dc1d2360658598db3bf3e63d3a0cc094f72939cf6c0af6b",
      "circuit": {
        "circuit_id": "blLHA-eDHvC",
        "roster": [
          {
            "service_id": "a000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n20959"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"b000\"]"
              ]
            ]
          },
          {
            "service_id": "b000",
            "service_type": "scabbard",
            "allowed_nodes": [
              "n8198"
            ],
            "arguments": [
              [
                "admin_keys",
                "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
              ],
              [
                "version",
                "2"
              ],
              [
                "peer_services",
                "[\"a000\"]"
              ]
            ]
          }
        ],
        "members": [
          {
            "node_id": "n20959",
            "endpoints": [
              "tcp://127.0.0.1:18044"
            ],
            "public_key": [3, .., 221]
          },
          {
            "node_id": "n8198",
            "endpoints": [
              "tcp://127.0.0.1:28044"
            ],
            "public_key": [2, .., 164]
          }
        ],
        "authorization_type": "Challenge",
        "persistence": "Any",
        "durability": "NoDurability",
        "routes": "Any",
        "circuit_management_type": "grid",
        "application_metadata": "",
        "comments": null,
        "display_name": "circuit01",
        "circuit_version": 2,
        "circuit_status": "Active"
      },
      "votes": [
        {
          "public_key": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
          "vote": "Accept",
          "voter_node_id": "n8198"
        }
      ],
      "requester": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
      "requester_node_id": "n20959"
    },
    [3, .., 3]
  ],
  "event_id": 5
}
```

### `CircuitReady` event

The serialized JSON message for a `CircuitReady` event looks like this:

```
{
  "timestamp": 1636140018602,
  "eventType": "CircuitReady",
  "message": {
    "proposal_type": "Create",
    "circuit_id": "blLHA-eDHvC",
    "circuit_hash": "c939e0cd15c1ccec1dc1d2360658598db3bf3e63d3a0cc094f72939cf6c0af6b",
    "circuit": {
      "circuit_id": "blLHA-eDHvC",
      "roster": [
        {
          "service_id": "a000",
          "service_type": "scabbard",
          "allowed_nodes": [
            "n20959"
          ],
          "arguments": [
            [
              "admin_keys",
              "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
            ],
            [
              "version",
              "2"
            ],
            [
              "peer_services",
              "[\"b000\"]"
            ]
          ]
        },
        {
          "service_id": "b000",
          "service_type": "scabbard",
          "allowed_nodes": [
            "n8198"
          ],
          "arguments": [
            [
              "admin_keys",
              "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
            ],
            [
              "version",
              "2"
            ],
            [
              "peer_services",
              "[\"a000\"]"
            ]
          ]
        }
      ],
      "members": [
        {
          "node_id": "n20959",
          "endpoints": [
            "tcp://127.0.0.1:18044"
          ],
          "public_key": [ 3, .., 221]
        },
        {
          "node_id": "n8198",
          "endpoints": [
            "tcp://127.0.0.1:28044"
          ],
          "public_key": [2, .., 164]
        }
      ],
      "authorization_type": "Challenge",
      "persistence": "Any",
      "durability": "NoDurability",
      "routes": "Any",
      "circuit_management_type": "grid",
      "application_metadata": "",
      "comments": null,
      "display_name": "circuit01",
      "circuit_version": 2,
      "circuit_status": "Active"
    },
    "votes": [
      {
        "public_key": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
        "vote": "Accept",
        "voter_node_id": "n8198"
      }
    ],
    "requester": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
    "requester_node_id": "n20959"
  },
  "event_id": 6
}
```

### `CircuitDisbanded` event

The serialized JSON message for a `CircuitDisbanded` event looks like this:

```
{
  "timestamp": 1636140320112,
  "eventType": "CircuitDisbanded",
  "message": {
    "proposal_type": "Disband",
    "circuit_id": "blLHA-eDHvC",
    "circuit_hash": "89675159f2e5c0cd48d08f33ae63d446e26cbcd6c93d74eb6d449e24af7f8744",
    "circuit": {
      "circuit_id": "blLHA-eDHvC",
      "roster": [
        {
          "service_id": "a000",
          "service_type": "scabbard",
          "allowed_nodes": [
            "n20959"
          ],
          "arguments": [
            [
              "admin_keys",
              "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03,038684ef88607ca0e5175fe31b7d94f65b30dc27ef838845f0496eb9c1126c8c82"
            ],
            [
              "version",
              "2"
            ],
            [
              "peer_services",
              "[\"b000\"]"
            ]
          ]
        },
        {
          "service_id": "b000",
          "service_type": "scabbard",
          "allowed_nodes": [
            "n8198"
          ],
          "arguments": [
            [
              "admin_keys",
              "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
            ],
            [
              "version",
              "2"
            ],
            [
              "peer_services",
              "[\"a000\"]"
            ]
          ]
        }
      ],
      "members": [
        {
          "node_id": "n20959",
          "endpoints": [
            "tcp://127.0.0.1:18044"
          ],
          "public_key": [3, .., 221]
        },
        {
          "node_id": "n8198",
          "endpoints": [
            "tcp://127.0.0.1:28044"
          ],
          "public_key": [ 2, .., 164]
        }
      ],
      "authorization_type": "Challenge",
      "persistence": "Any",
      "durability": "NoDurability",
      "routes": "Any",
      "circuit_management_type": "grid",
      "application_metadata": "",
      "comments": null,
      "display_name": "circuit01",
      "circuit_version": 2,
      "circuit_status": "Disbanded"
    },
    "votes": [
      {
        "public_key": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
        "vote": "Accept",
        "voter_node_id": "n20959"
      }
    ],
    "requester": "03f91f722329b99234be43f962e7ce33bbd4f2e72634a1a68f12ad908ca5693f03",
    "requester_node_id": "n8198"
  },
  "event_id": 9
}
```
