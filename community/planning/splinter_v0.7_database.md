---
tags: [Mermaid]
mermaid: true
---

# Splinter v0.7 Database Design

## Scabbard v3

<div class="mermaid">
erDiagram
    scabbard_service {
        Text circuit_id PK
        Text service_id PK
        Text status
        Text consensus
    }

    scabbard_alarm {
        Text circuit_id PK
        Text service_id PK
        Text alarm_type PK
        BigInt alarm
    }

    scabbard_alarm }o--|| scabbard_service: contains

    scabbard_peer {
        Text circuit_id PK
        Text service_id PK
        Text peer_service_id PK
    }

    scabbard_peer }o--|| scabbard_service: contains
</div>

### scabbard_alarm

#### Diesel

```rust
table! {
    scabbard_alarm (circuit_id, service_id, alarm_type) {
        circuit_id -> Text,
        service_id -> Text,
        alarm_type -> Text,
        alarm -> BigInt,
    }
}
```

#### PostgreSQL

```
              Table "public.scabbard_alarm"
   Column   |    Type    | Collation | Nullable | Default
------------+------------+-----------+----------+---------
 circuit_id | text       |           | not null |
 service_id | text       |           | not null |
 alarm_type | alarm_type |           | not null |
 alarm      | bigint     |           | not null |
Indexes:
    "scabbard_alarm_pkey" PRIMARY KEY, btree (circuit_id, service_id, alarm_type)
Foreign-key constraints:
    "scabbard_alarm_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE scabbard_alarm (
    circuit_id                TEXT NOT NULL,
    service_id                TEXT NOT NULL,
    alarm_type                TEXT NOT NULL
    CHECK ( alarm_type IN ('TWO_PHASE_COMMIT')),
    alarm                     BIGINT NOT NULL,
    FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id) ON DELETE CASCADE,
    PRIMARY KEY (circuit_id, service_id, alarm_type)
);
```

### scabbard_peer

#### Diesel

```rust
table! {
    scabbard_peer (circuit_id, service_id, peer_service_id) {
        circuit_id  -> Text,
        service_id  -> Text,
        peer_service_id  -> Text,
    }
}
```

#### PostgreSQL

```
              Table "public.scabbard_peer"
     Column      | Type | Collation | Nullable | Default
-----------------+------+-----------+----------+---------
 circuit_id      | text |           | not null |
 service_id      | text |           | not null |
 peer_service_id | text |           | not null |
Indexes:
    "scabbard_peer_pkey" PRIMARY KEY, btree (circuit_id, service_id, peer_service_id)
Foreign-key constraints:
    "scabbard_peer_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
```

#### SQLite

```sql
CREATE TABLE scabbard_peer (
    circuit_id       TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    peer_service_id  TEXT,
    PRIMARY KEY(circuit_id, service_id, peer_service_id),
    FOREIGN KEY(circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
);
```

### scabbard_service

#### Diesel

```rust
table! {
    scabbard_service (circuit_id, service_id) {
        circuit_id  -> Text,
        service_id  -> Text,
        consensus -> Text,
        status -> Text,
    }
}
```

#### PostgreSQL

```
                               Table "public.scabbard_service"
   Column   |             Type             | Collation | Nullable |          Default
------------+------------------------------+-----------+----------+---------------------------
 circuit_id | text                         |           | not null |
 service_id | text                         |           | not null |
 status     | scabbard_service_status_type |           | not null |
 consensus  | scabbard_consensus           |           | not null | '2PC'::scabbard_consensus
Indexes:
    "scabbard_service_pkey" PRIMARY KEY, btree (circuit_id, service_id)
```

#### SQLite

```sql
CREATE TABLE scabbard_service (
    circuit_id       TEXT NOT NULL,
    service_id       TEXT NOT NULL,
    status           TEXT NOT NULL
    CHECK ( status IN ('PREPARED', 'FINALIZED', 'RETIRED') )
, consensus Text NOT NULL DEFAULT '2PC'
  CHECK ( consensus IN ('2PC') ),
  PRIMARY KEY(circuit_id, service_id)
);
```

### scabbard_v3_commit_history

#### Diesel Schema

```rust
table! {
    scabbard_v3_commit_history (circuit_id, service_id, epoch) {
        circuit_id  -> Text,
        service_id  -> Text,
        epoch -> BigInt,
        value -> VarChar,
        decision -> Nullable<Text>,
    }
}
```

## Scabbard v3: 2PC Consensus

### Context

A consensus context contains current information maintained by the consensus
algorithm in use (for example, 2PC).

These tables persist specific Augrim data structures.

<div class="mermaid">
erDiagram
    consensus_2pc_context {
        Text circuit_id PK
        Text service_id PK
        Text coordinator
        BigInt epoch
        BigInt last_commit_epoch
        Text state
        BigInt vote_timer_start
        Boolean vote
        BigInt decision_timeout_start
    }
    consensus_2pc_context_participant {
        Text circuit_id PK
        Text service_id PK
        Text process PK
        BigInt epoch
        Boolean vote
        Boolean decision_ack
    }
    consensus_2pc_context }o--|| scabbard_service: contains
    consensus_2pc_context_participant }o--|| scabbard_service: contains
</div>

### Actions

A consensus action is the result of processing an event with a consensus
algorithm, and represents work which must be performed.

<div class="mermaid">
erDiagram
    consensus_2pc_action {
        INTEGER id PK
        TEXT circuit_id FK
        TEXT service_id FK
        TIMESTAMP created_at
        BIGINT executed_at
        TEXT action_type
    }
    consensus_2pc_action }o--|| scabbard_service: contains

    consensus_2pc_update_context_action {
        Int8 action_id PK
        Text coordinator
        BigInt epoch
        BigInt last_commit_epoch
        Text state
        BigInt vote_timeout_start
        Boolean vote
        BigInt decision_timeout_start
        BigInt action_alarm
    }
    consensus_2pc_action ||--o| consensus_2pc_update_context_action: is

    consensus_2pc_send_message_action {
        Int8 action_id PK
        BigInt epoch
        Text receiver_service_id
        Text message_type
        Boolean vote_response
        Binary vote_request
    }

    consensus_2pc_action ||--o| consensus_2pc_send_message_action: is

    consensus_2pc_notification_action {
        Int8 action_id PK
        Text notification_type
        Text dropped_message
        Binary request_for_vote_value
    }

    consensus_2pc_action ||--o| consensus_2pc_notification_action: is

    consensus_2pc_update_context_action_participant {
        Int8 action_id PK
        Text process
        Boolean vote
        Boolean decision_ack
    }

consensus_2pc_action ||--o| consensus_2pc_update_context_action_participant: is
</div>

### Events

A consensus event is input into the consensus algorithm.

<div class="mermaid">
erDiagram
    consensus_2pc_event {
         Int8 id PK
         Text circuit_id FK
         Text service_id FK
         Timestamp created_at
         BigInt executed_at
         Text event_type
         BigInt executed_epoch
    }

    consensus_2pc_event }o--|| scabbard_service: contains

    consensus_2pc_deliver_event {
        Int8 event_id PK
        BigInt epoch
        Text receiver_service_id
        Text message_type
        Boolean vote_response
        Binary vote_request
    }

    consensus_2pc_event ||--o| consensus_2pc_deliver_event: is

    consensus_2pc_start_event {
        Int8 event_id PK
        Binary value
    }

    consensus_2pc_event ||--o| consensus_2pc_start_event: is

    consensus_2pc_vote_event {
        Int8 event_id PK
        Boolean vote
    }

    consensus_2pc_event ||--o| consensus_2pc_vote_event: is
</div>

### consensus_2pc_action

#### Diesel

```rust
table! {
    consensus_2pc_action (id) {
        id -> Int8,
        circuit_id -> Text,
        service_id -> Text,
        created_at -> Timestamp,
        executed_at -> Nullable<BigInt>,
        action_type -> Text,
        event_id -> Int8,
    }
}
```

#### PostgreSQL

```
                                         Table "public.consensus_2pc_action"
   Column    |            Type             | Collation | Nullable |                     Default
-------------+-----------------------------+-----------+----------+--------------------------------------------------
 id          | bigint                      |           | not null | nextval('consensus_2pc_action_id_seq'::regclass)
 circuit_id  | text                        |           | not null |
 service_id  | text                        |           | not null |
 created_at  | timestamp without time zone |           | not null | CURRENT_TIMESTAMP
 executed_at | bigint                      |           |          |
 action_type | text                        |           | not null |
 event_id    | bigint                      |           | not null |
Indexes:
    "consensus_2pc_action_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "consensus_2pc_action_circuit_id_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
    "consensus_2pc_action_event_id_fkey" FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id)
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_action (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    circuit_id                TEXT NOT NULL,
    service_id                TEXT NOT NULL,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    executed_at               BIGINT,
    action_type               TEXT,
    event_id                  INTEGER NOT NULL,
    FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
    FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id)
);
```

### consensus_2pc_context

#### Diesel

```rust
table! {
    consensus_2pc_context (circuit_id, service_id) {
        circuit_id -> Text,
        service_id -> Text,
        coordinator -> Text,
        epoch -> BigInt,
        last_commit_epoch -> Nullable<BigInt>,
        state -> Text,
        vote_timeout_start -> Nullable<BigInt>,
        vote -> Nullable<Bool>,
        decision_timeout_start -> Nullable<BigInt>,
    }
}
```

#### PostgreSQL

```
                  Table "public.consensus_2pc_context"
         Column         |     Type      | Collation | Nullable | Default
------------------------+---------------+-----------+----------+---------
 circuit_id             | text          |           | not null |
 service_id             | text          |           | not null |
 coordinator            | text          |           | not null |
 epoch                  | bigint        |           | not null |
 last_commit_epoch      | bigint        |           |          |
 state                  | context_state |           | not null |
 vote_timeout_start     | bigint        |           |          |
 vote                   | boolean       |           |          |
 decision_timeout_start | bigint        |           |          |
Indexes:
    "consensus_2pc_context_pkey" PRIMARY KEY, btree (circuit_id, service_id)
Check constraints:
    "consensus_2pc_context_check" CHECK (vote_timeout_start IS NOT NULL OR state <> 'VOTING'::context_state)
    "consensus_2pc_context_check1" CHECK (vote IS NOT NULL OR state <> 'VOTED'::context_state)
    "consensus_2pc_context_check2" CHECK (decision_timeout_start IS NOT NULL OR state <> 'VOTED'::context_state)
Foreign-key constraints:
    "consensus_2pc_context_circuit_id_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_context (
    circuit_id                TEXT NOT NULL,
    service_id                TEXT NOT NULL,
    coordinator               TEXT NOT NULL,
    epoch                     BIGINT NOT NULL,
    last_commit_epoch         BIGINT,
    state                     TEXT NOT NULL
    CHECK ( state IN ( 'WAITING_FOR_START', 'VOTING', 'WAITING_FOR_VOTE', 'ABORT', 'COMMIT', 'WAITING_FOR_VOTE_REQUEST', 'VOTED', 'WAITING_FOR_DECISION_ACK') ),
    vote_timeout_start        BIGINT
    CHECK ( (vote_timeout_start IS NOT NULL) OR ( state != 'VOTING') ),
    vote                      NUMERIC
    CHECK ( (vote IS NOT NULL) OR ( state != 'VOTED') ),
    decision_timeout_start    BIGINT
    CHECK ( (decision_timeout_start IS NOT NULL) OR ( state != 'VOTED') ),
    PRIMARY KEY(circuit_id, service_id),
    FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
);
```

### consensus_2pc_context_participant

#### Diesel

```rust
table! {
    consensus_2pc_context_participant (circuit_id, service_id, process) {
        circuit_id -> Text,
        service_id -> Text,
        epoch -> BigInt,
        process -> Text,
        vote -> Nullable<Bool>,
        decision_ack -> Bool,
    }
}
```

#### PostgreSQL

```
   Table "public.consensus_2pc_context_participant"
    Column    |  Type   | Collation | Nullable | Default
--------------+---------+-----------+----------+---------
 circuit_id   | text    |           | not null |
 service_id   | text    |           | not null |
 epoch        | bigint  |           | not null |
 process      | text    |           | not null |
 vote         | boolean |           |          |
 decision_ack | boolean |           | not null | false
Indexes:
    "consensus_2pc_context_participant_pkey" PRIMARY KEY, btree (circuit_id, service_id, process)
Foreign-key constraints:
    "consensus_2pc_context_participant_circuit_id_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_context_participant (
    circuit_id                TEXT NOT NULL,
    service_id                TEXT NOT NULL,
    epoch                     BIGINT NOT NULL,
    process                   TEXT NOT NULL,
    vote                      NUMERIC,
    decision_ack              NUMERIC NOT NULL DEFAULT 0,
    PRIMARY KEY (circuit_id, service_id, process),
    FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
);
```

### consensus_2pc_deliver_event

#### Diesel

```rust
table! {
    consensus_2pc_deliver_event (event_id) {
        event_id -> Int8,
        epoch -> BigInt,
        receiver_service_id -> Text,
        message_type -> Text,
        vote_response -> Nullable<Bool>,
        vote_request -> Nullable<Binary>,
    }
}
```

#### PostgreSQL

```
                    Table "public.consensus_2pc_deliver_event"
       Column        |            Type            | Collation | Nullable | Default
---------------------+----------------------------+-----------+----------+---------
 event_id            | integer                    |           | not null |
 epoch               | bigint                     |           | not null |
 receiver_service_id | text                       |           | not null |
 message_type        | deliver_event_message_type |           | not null |
 vote_response       | boolean                    |           |          |
 vote_request        | bytea                      |           |          |
Indexes:
    "consensus_2pc_deliver_event_pkey" PRIMARY KEY, btree (event_id)
Check constraints:
    "consensus_2pc_deliver_event_check" CHECK ((vote_response IS NOT NULL) OR message_type <> 'VOTE_RESPONSE'::deliver_event_message_type)
    "consensus_2pc_deliver_event_check1" CHECK (vote_request IS NOT NULL OR message_type <> 'VOTE_REQUEST'::deliver_event_message_type)
Foreign-key constraints:
    "consensus_2pc_deliver_event_event_id_fkey" FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_deliver_event (
    event_id                  INTEGER PRIMARY KEY,
    epoch                     BIGINT NOT NULL,
    receiver_service_id       TEXT NOT NULL,
    message_type              TEXT NOT NULL
    CHECK ( message_type IN ('VOTE_RESPONSE', 'DECISION_REQUEST', 'VOTE_REQUEST', 'COMMIT', 'ABORT', 'DECISION_ACK') ),
    vote_response             NUMERIC
    CHECK ( (vote_response IS NOT NULL) OR (message_type != 'VOTE_RESPONSE') ),
    vote_request              BINARY
    CHECK ( (vote_request IS NOT NULL) OR (message_type != 'VOTE_REQUEST') ),
    FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id) ON DELETE CASCADE
);
```

### consensus_2pc_event

#### Diesel

```rust
table! {
    consensus_2pc_event (id) {
        id -> Int8,
        circuit_id -> Text,
        service_id -> Text,
        created_at -> Timestamp,
        executed_at -> Nullable<BigInt>,
        event_type -> Text,
        executed_epoch -> Nullable<BigInt>,
    }
}
```

#### PostgreSQL

```
                                         Table "public.consensus_2pc_event"
   Column       |            Type             | Collation | Nullable |                     Default
----------------+-----------------------------+-----------+----------+-------------------------------------------------
 id             | bigint                      |           | not null | nextval('consensus_2pc_event_id_seq'::regclass)
 circuit_id     | text                        |           | not null |
 service_id     | text                        |           | not null |
 created_at     | timestamp without time zone |           | not null | CURRENT_TIMESTAMP
 executed_at    | bigint                      |           |          |
 event_type     | event_type                  |           | not null |
 executed_epoch | bigint                      |           |          |
Indexes:
    "consensus_2pc_event_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "consensus_2pc_event_circuit_id_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_event (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    circuit_id                TEXT NOT NULL,
    service_id                TEXT NOT NULL,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    executed_at               BIGINT,
    event_type                TEXT NOT NULL
    CHECK ( event_type IN ('ALARM', 'DELIVER', 'START', 'VOTE') ),
    executed_epoch            BIGINT,
    FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id)
);
```

### consensus_2pc_notification_action

#### Diesel

```rust
table! {
    consensus_2pc_notification_action (action_id) {
        action_id -> Int8,
        notification_type -> Text,
        dropped_message -> Nullable<Text>,
        request_for_vote_value -> Nullable<Binary>,
    }
}
```

#### PostgreSQL

```
              Table "public.consensus_2pc_notification_action"
         Column         |       Type        | Collation | Nullable | Default
------------------------+-------------------+-----------+----------+---------
 action_id              | integer           |           | not null |
 notification_type      | notification_type |           | not null |
 dropped_message        | text              |           |          |
 request_for_vote_value | bytea             |           |          |
Indexes:
    "consensus_2pc_notification_action_pkey" PRIMARY KEY, btree (action_id)
Check constraints:
    "consensus_2pc_notification_action_check" CHECK (dropped_message IS NOT NULL OR notification_type <> 'MESSAGE_DROPPED'::notification_type)
    "consensus_2pc_notification_action_check1" CHECK (request_for_vote_value IS NOT NULL OR notification_type <> 'PARTICIPANT_REQUEST_FOR_VOTE'::notification_type)
Foreign-key constraints:
    "consensus_2pc_notification_action_action_id_fkey" FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_notification_action (
    action_id                 INTEGER PRIMARY KEY,
    notification_type         TEXT NOT NULL
    CHECK ( notification_type IN ('REQUEST_FOR_START', 'COORDINATOR_REQUEST_FOR_VOTE', 'PARTICIPANT_REQUEST_FOR_VOTE', 'COMMIT', 'ABORT', 'MESSAGE_DROPPED') ),
    dropped_message           TEXT
    CHECK ( (dropped_message IS NOT NULL) OR (notification_type != 'MESSAGE_DROPPED') ),
    request_for_vote_value    BINARY
    CHECK ( (request_for_vote_value IS NOT NULL) OR (notification_type != 'PARTICIPANT_REQUEST_FOR_VOTE') ),
    FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
);
```

### consensus_2pc_send_message_action

#### Diesel

```rust
table! {
    consensus_2pc_send_message_action (action_id) {
        action_id -> Int8,
        epoch -> BigInt,
        receiver_service_id -> Text,
        message_type -> Text,
        vote_response -> Nullable<Bool>,
        vote_request -> Nullable<Binary>,
    }
}
```

#### PostgreSQL

```
          Table "public.consensus_2pc_send_message_action"
       Column        |     Type     | Collation | Nullable | Default
---------------------+--------------+-----------+----------+---------
 action_id           | integer      |           | not null |
 epoch               | bigint       |           | not null |
 receiver_service_id | text         |           | not null |
 message_type        | message_type |           | not null |
 vote_response       | boolean      |           |          |
 vote_request        | bytea        |           |          |
Indexes:
    "consensus_2pc_send_message_action_pkey" PRIMARY KEY, btree (action_id)
Check constraints:
    "consensus_2pc_send_message_action_check" CHECK ((vote_response IS NOT NULL) OR message_type <> 'VOTE_RESPONSE'::message_type)
    "consensus_2pc_send_message_action_check1" CHECK (vote_request IS NOT NULL OR message_type <> 'VOTE_REQUEST'::message_type)
Foreign-key constraints:
    "consensus_2pc_send_message_action_action_id_fkey" FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_send_message_action (
    action_id                 INTEGER PRIMARY KEY,
    epoch                     BIGINT NOT NULL,
    receiver_service_id       TEXT NOT NULL,
    message_type              TEXT NOT NULL
    CHECK ( message_type IN ('VOTE_RESPONSE', 'DECISION_REQUEST', 'VOTE_REQUEST', 'COMMIT', 'ABORT', 'DECISION_ACK') ),
    vote_response             NUMERIC
    CHECK ( (vote_response IS NOT NULL) OR (message_type != 'VOTE_RESPONSE') ),
    vote_request              BINARY
    CHECK ( (vote_request IS NOT NULL) OR (message_type != 'VOTE_REQUEST') ),
    FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
);
```

### consensus_2pc_start_event

#### Diesel

```rust
table! {
    consensus_2pc_start_event (event_id) {
        event_id -> Int8,
        value -> Binary,
    }
}
```

#### PostgreSQL

```
       Table "public.consensus_2pc_start_event"
   Column   |  Type   | Collation | Nullable | Default
------------+---------+-----------+----------+---------
 event_id   | integer |           | not null |
 value      | bytea   |           |          |
Indexes:
    "consensus_2pc_start_event_pkey" PRIMARY KEY, btree (event_id)
Foreign-key constraints:
    "consensus_2pc_start_event_event_id_fkey" FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_start_event (
    event_id                  INTEGER PRIMARY KEY,
    value                     BINARY,
    FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id) ON DELETE CASCADE
);
```

### consensus_2pc_update_context_action

#### Diesel

```rust
table! {
    consensus_2pc_update_context_action (action_id) {
        action_id -> Int8,
        coordinator -> Text,
        epoch -> BigInt,
        last_commit_epoch -> Nullable<BigInt>,
        state -> Text,
        vote_timeout_start -> Nullable<BigInt>,
        vote -> Nullable<Bool>,
        decision_timeout_start -> Nullable<BigInt>,
        action_alarm -> Nullable<BigInt>,
    }
}
```

#### PostgreSQL

```
           Table "public.consensus_2pc_update_context_action"
         Column         |     Type      | Collation | Nullable | Default
------------------------+---------------+-----------+----------+---------
 action_id              | integer       |           | not null |
 coordinator            | text          |           | not null |
 epoch                  | bigint        |           | not null |
 last_commit_epoch      | bigint        |           |          |
 state                  | context_state |           | not null |
 vote_timeout_start     | bigint        |           |          |
 vote                   | boolean       |           |          |
 decision_timeout_start | bigint        |           |          |
 action_alarm           | bigint        |           |          |
Indexes:
    "consensus_2pc_update_context_action_pkey" PRIMARY KEY, btree (action_id)
Check constraints:
    "consensus_2pc_update_context_action_check" CHECK (vote_timeout_start IS NOT NULL OR state <> 'VOTING'::context_state)
    "consensus_2pc_update_context_action_check1" CHECK ((vote IS NOT NULL) OR state <> 'VOTED'::context_state)
    "consensus_2pc_update_context_action_check2" CHECK (decision_timeout_start IS NOT NULL OR state <> 'VOTED'::context_state)
Foreign-key constraints:
    "consensus_2pc_update_context_action_action_id_fkey" FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_update_context_action (
    action_id                 INTEGER PRIMARY KEY,
    coordinator               TEXT NOT NULL,
    epoch                     BIGINT NOT NULL,
    last_commit_epoch         BIGINT,
    state                     TEXT NOT NULL
    CHECK ( state IN ( 'WAITING_FOR_START', 'VOTING', 'WAITING_FOR_VOTE', 'ABORT', 'COMMIT', 'WAITING_FOR_VOTE_REQUEST', 'VOTED', 'WAITING_FOR_DECISION_ACK') ),
    vote_timeout_start        BIGINT
    CHECK ( (vote_timeout_start IS NOT NULL) OR ( state != 'VOTING') ),
    vote                      NUMERIC
    CHECK ( (vote IS NOT NULL) OR ( state != 'VOTED') ),
    decision_timeout_start    BIGINT
    CHECK ( (decision_timeout_start IS NOT NULL) OR ( state != 'VOTED') ),
    action_alarm  BIGINT,
    FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
);
```

### consensus_2pc_update_context_action_participant

#### Diesel

```rust
table! {
    consensus_2pc_update_context_action_participant (action_id) {
        action_id -> Int8,
        process -> Text,
        vote -> Nullable<Bool>,
        decision_ack -> Bool,
    }
}
```

#### PostgreSQL

```
Table "public.consensus_2pc_update_context_action_participant"
    Column    |  Type   | Collation | Nullable | Default
--------------+---------+-----------+----------+---------
 action_id    | integer |           | not null |
 process      | text    |           | not null |
 vote         | boolean |           |          |
 decision_ack | boolean |           | not null | false
Indexes:
    "consensus_2pc_update_context_action_participant_pkey" PRIMARY KEY, btree (action_id)
Foreign-key constraints:
    "consensus_2pc_update_context_action_participant_action_id_fkey" FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
    "consensus_2pc_update_context_action_participant_action_id_fkey1" FOREIGN KEY (action_id) REFERENCES consensus_2pc_update_context_action(action_id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_update_context_action_participant (
    action_id                 INTEGER PRIMARY KEY,
    process                   TEXT NOT NULL,
    vote                      NUMERIC,
    decision_ack              NUMERIC NOT NULL DEFAULT 0,
    FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES consensus_2pc_update_context_action(action_id) ON DELETE CASCADE
);
```

### consensus_2pc_vote_event

#### Diesel

```rust
table! {
    consensus_2pc_vote_event (event_id) {
        event_id -> Int8,
        vote -> Bool,
    }
}
```

#### PostgreSQL

```
        Table "public.consensus_2pc_vote_event"
   Column   |  Type   | Collation | Nullable | Default
------------+---------+-----------+----------+---------
 event_id   | integer |           | not null |
 vote       | boolean |           | not null |
Indexes:
    "consensus_2pc_vote_event_pkey" PRIMARY KEY, btree (event_id)
Foreign-key constraints:
    "consensus_2pc_vote_event_event_id_fkey" FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id) ON DELETE CASCADE
```

#### SQLite

```sql
CREATE TABLE consensus_2pc_vote_event (
    event_id                  INTEGER PRIMARY KEY,
    vote                      NUMERIC NOT NULL,
    FOREIGN KEY (event_id) REFERENCES consensus_2pc_event(id) ON DELETE CASCADE
);
```

### Example Queries

#### Listing all actions

```sql
SELECT id,
       action_type,
       consensus_2pc_action.circuit_id,
       consensus_2pc_action.service_id,
       consensus_2pc_action.event_id,
       consensus_2pc_notification_action.notification_type as n_notification_type,
       consensus_2pc_notification_action.dropped_message as n_dropped_message,
       consensus_2pc_notification_action.request_for_vote_value as n_request_for_vote_value,
       consensus_2pc_send_message_action.epoch as s_epoch,
       consensus_2pc_send_message_action.receiver_service_id as s_receiver_service_id,
       consensus_2pc_send_message_action.message_type as s_message_type,
       consensus_2pc_send_message_action.vote_response as s_vote_response,
       consensus_2pc_send_message_action.vote_request as s_vote_request,
       consensus_2pc_update_context_action.coordinator as uc_coordinator,
       consensus_2pc_update_context_action.epoch as uc_epoch,
       consensus_2pc_update_context_action.last_commit_epoch as uc_last_commit_epoch,
       consensus_2pc_update_context_action.state as uc_state,
       consensus_2pc_update_context_action.vote_timeout_start as uc_vote_timeout_start,
       consensus_2pc_update_context_action.vote as uc_vote,
       consensus_2pc_update_context_action.decision_timeout_start as uc_decision_timeout_start,
       consensus_2pc_update_context_action.action_alarm as uc_action_alarm,
       consensus_2pc_update_context_action.ack_timeout_start as uc_ack_timeout_start,
       consensus_2pc_update_context_action_participant.process as ucp_process,
       consensus_2pc_update_context_action_participant.vote as ucp_vote,
       consensus_2pc_update_context_action_participant.decision_ack as ucp_decision_ack,
       created_at,
       executed_at,
FROM consensus_2pc_action
LEFT JOIN consensus_2pc_notification_action ON consensus_2pc_action.id=consensus_2pc_notification_action.action_id
LEFT JOIN consensus_2pc_send_message_action ON consensus_2pc_action.id=consensus_2pc_send_message_action.action_id
LEFT JOIN consensus_2pc_update_context_action ON consensus_2pc_action.id=consensus_2pc_update_context_action.action_id
LEFT JOIN consensus_2pc_update_context_action_participant ON consensus_2pc_action.id=consensus_2pc_update_context_action_participant.action_id
ORDER BY id;
```

## Scabbard v3: Supervisor

<div class="mermaid">
erDiagram
    scabbard_services {
    }

    supervisor_notification {
        BigInt id PK
        Text service_id FK
        Text circuit_id FK
        BigInt action_id FK
        Text notification_type
        Binary request_for_vote_value
        Timestamp created_at
        Timestamp executed_at
    }
    scabbard_services ||--o{ supervisor_notification: contains

    consensus_2pc_action {
        BitInt id PK
        Text circuit_id FK
        Text service_id FK
        Text action_type
        Timestamp created_at
        Timestamp executed_at
    }
    consensus_2pc_action ||--o| supervisor_notification: contains
    consensus_2pc_action }o--|| scabbard_services: contains

    consensus_2pc_notification_action {
        Int8 action_id PK
        Text notification_type
        Text dropped_message
        Binary request_for_vote_value
    }
    consensus_2pc_action ||--o| consensus_2pc_notification_action: is
</div>

### supervisor_notfication

#### Diesel

```rust
table! {
    supervisor_notification (id) {
        id -> Int8,
        circuit_id -> Text,
        service_id -> Text,
        action_id -> Int8,
        notification_type -> Text,
        request_for_vote_value -> Nullable<Binary>,
        created_at -> Timestamp,
        executed_at -> Nullable<Timestamp>,
    }
}
```

#### PostgreSQL

```
Table "public.supervisor_notification"
         Column         |             Type             | Collation | Nullable |                       Default
------------------------+------------------------------+-----------+----------+-----------------------------------------------------
 id                     | bigint                       |           | not null | nextval('supervisor_notification_id_seq'::regclass)
 circuit_id             | text                         |           | not null |
 service_id             | text                         |           | not null |
 action_id              | bigint                       |           | not null |
 notification_type      | supervisgor_notification_type|           | not null |
 request_for_vote_value | bytea                        |           |          |
 created_at             | timestamp without time zone  |           | not null | CURRENT_TIMESTAMP
 executed_at            | timestamp without time zone  |           |          | 
Indexes:
    "supervisor_notification_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "supervisor_notification_action_id_fkey" FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
    "supervisor_notification_circuit_id_service_id_fkey" FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id) ON DELETE CASCADE

```


#### SQLite

```sql

CREATE TABLE IF NOT EXISTS supervisor_notification (
  id                            INTEGER PRIMARY KEY AUTOINCREMENT,
  circuit_id                    TEXT NOT NULL,
  service_id                    TEXT NOT NULL,
  action_id                     INTEGER NOT NULL,
  notification_type             TEXT NOT NULL
  CHECK ( notification_type IN (
      'ABORT',
      'COMMIT',
      'REQUEST_FOR_START',
      'COORDINATOR_REQUEST_FOR_VOTE',
      'PARTICIPANT_REQUEST_FOR_VOTE'
    )
  ),
  request_for_vote_value        BINARY,
  created_at                    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')) NOT NULL,
  executed_at                   TEXT,

  FOREIGN KEY (circuit_id, service_id) REFERENCES scabbard_service(circuit_id, service_id) ON DELETE CASCADE,
  FOREIGN KEY (action_id) REFERENCES consensus_2pc_action(id) ON DELETE CASCADE
);

```
