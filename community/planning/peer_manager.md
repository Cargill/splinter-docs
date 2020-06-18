# Peer Manager
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
The `PeerManager` is the component of the system that knows about peers. It
has a `Connector` to the `ConnectionManager` and requests the creation and
removal of connections that are associated with a peer. The `PeerManager`
keeps track of reference counts of the peers, as well as metadata such as its
ID, a list of endpoints and which endpoint is currently active.

## Dependencies

![]({% link images/peer_manager_dep.svg %} "PeerManager Dependency Diagram")

## Sequence Diagrams

### Connecting to a new Peer
The `PeerManagerConnector` can be used by other components to request a
connection to a peer. For example, the `AdminService` can request a connection
is created to a peer that is a member of a received circuit proposal.

![]({% link images/peer_manager_connection.svg %}
    "Connecting to new peer sequence diagram")

1. The Splinter REST API receives a circuit proposal that includes a peer that
  is not connected.
2. The `AdminService` requests a `PeerRef` for that peer using the
  `PeerManagerConnector`. The `PeerRef` is held on to by the `AdminService`.
3. The `PeerManager` requests a connection is created for the peer’s endpoint
  using the connection manager `Connector`.
4. A `PeerRef` for the requested peer is returned from the
  `PeerManagerConnector`.
5. The connection is successful and is passed to the `Authorizer`.
6. The peer completes authorization.
7. After authorization the connection is passed to the `ConnectionMatrix` by the
  `ConnectionManager` by using the `ConnectionMatrixLifecycle`.
8. The `ConnectionManager` sends a Connected notification for the endpoint to
  the subscribers.
9. The `PeerManager` handles the notification by updating the peer’s status to
  `PeerStatus::Connected` in the `PeerMap` and sends a Connected notification
  for the peer to subscribers.
10. The `AdminService` receives the Connected notification. At this point the
  peer can be treated as connected. The `AdminService` can start sending
  messages to the peer with a `NetworkSender`, starting with agreeing on the
  protocol version.


### Reconnecting to Peer
The `PeerManager` also monitors notifications from the `ConnectionManager`. If a
connection disconnects, the `PeerManager` will wait for a specified number of
reconnection attempts and if the connection does not reconnect the peers other
endpoints are tried. If successful, the peers active endpoint is replaced.
There is only ever one connection per peer active at a time.

#### Reconnecting to Peer's active endpoint

![]({% link images/peer_manager_reconnection.svg %}
    "Reconnecting to peer sequence")

1. `ConnectionManager` sends a heartbeat message to its managed connections.
2. If the heartbeat fails, the failed connection’s state is set to reconnecting.
3. The `ConnectionManager` sends a Disconnected endpoint notification to
  subscribers.
4. The `PeerManager` updates the associated peer’s status to
  `PeerStatus::Disconnected`.
5. The `PeerManager` sends a Disconnected peer notification to subscribers.
6. The `AdminService` removes the peer's agreed upon protocol version and resets
  any pending proposals that includes that peer.
7. The `ConnectionManager` retries to reconnect to the disconnected connection’s
  endpoint.
8.  If the reconnection fails, the `ConnectionManager` sends a
  NonFatalConnectionError to subscribers with the number of failed attempts.
9. Once the connection is successful, the connection must reauthorize.
10. The `ConnectionMatrix` updates the old connection.
11. The Connection Manager sends an endpoint Connected notification out to
  subscribers.
12. The `PeerManager` updates the associated peer’s status to
  `PeerStatus::Connected`.
13. The `PeerManager` sends a peer Connected notification to subscribers.
14. The `AdminService` can now send messages and restart protocol version
  agreement.

#### Reconnecting to peer with a new endpoint

![]({% link images/peer_manager_reconnection_endpoint.svg %}
  "Reconnecting to peer with new endpoint sequence")

1. `ConnectionManager` sends a heartbeat to its managed connection.
2. If the heartbeat fails, the connection’s state is set to reconnecting.
3. The `ConnectionManager` sends a disconnected endpoint notification to
  subscribers.
4. The `PeerManager` updates the associated peer’s status to
  `PeerStatus::Disconnected`.
5. The `PeerManager` sends a disconnected peer notification to subscribers.
6. The `AdminService` removes the peers agreed upon protocol version and resets
  any pending proposal.
7. The `ConnectionManager` retries to reconnect to the disconnected connection’s
  endpoint
8.  If the reconnection fails, the `ConnectionManager` sends
  NonFatalConnectionError to subscribers with the number of failed attempts.
9. Once the connection for a peer has reached the max number of retries and the
  peer has other possible endpoint, the `PeerManager` will request a connection
  is created for a different endpoint.
10. The connection is successful and passed to the `Authorizers`.
11. The peer completes authorization.
12. After authorization the connection is passed to the `ConnectionMatrix`.
13. A Connected notification is sent to subscribers for the endpoint.
14. PeerManager handles the notification by updating the peer’s active endpoint
  and status to `PeerStatus::Connected` in the `PeerMap`.
15. The `PeerManager` requests that the peers old connection is removed.
16. The `PeerManager` sends a peer Connected notification to subscribers.
17. The `AdminService` can now send messages and restart protocol version
  agreement.
