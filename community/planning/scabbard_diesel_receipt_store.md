# Scabbard Diesel Backed Receipt Store
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document provides information on the use of a Diesel backed receipt store
in scabbard. This move away from the current implementation, a LMDB backed
receipt store, is part of a larger effort to make Splinter cloud compatible.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

### Migrations

Migrations for the receipt store tables run with the `splinter database migrate`
command. Running the receipt store migrations with this command does not require
any additional flags or options, the migrations will be run for the database
connection specified or the default if none is specified.

### Scabbard

When the appropriate features are enabled the splinter daemon will create the
scabbard factory with the connection URL for the Splinter data stores. The
scabbard service will then create the Diesel backed receipt store using this
connection.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Migrations

The `MigrateAction`'s `run` function determines the connection type,
runs the Splinter database migrations, and then uses the same connection pool to
run the sawtooth migrations using the appropriate method,
`run_sqlite_migrations` or `run_postgres_migrations`. The receipt store tables
are then created in the same PostgreSQL or SQLite instance that contains the
database tables for the other Splinter data stores.

### Scabbard

A new diesel backed receipt store is created by passing a sqlite or postgres
connection pool to the `DieselReceiptStore`'s `new` method. The PostgreSQL or
SQLite connection string passed to the `ScabbardFactoryBuilder` via the
`with_receipt_db_url` is used to create a `ScabbardFactoryStorageConfig` which
is used in creating the diesel backed receipt store. In scabbard the diesel
backed receipt store is created slightly differently depending on whether or not
"database-support" feature is enabled.

When "database-support" is enabled, the `ScabbardFactory` has a
`store_factory_config` field with type `ScabbardFactoryStorageConfig`.
`ScabbardFactoryStorageConfig` has variants `Postgres` and `Sqlite`
which each contain a connection pool. The connection pool is used to create a
diesel receipt store as shown below.

When "database-support" is not enabled, the `ScabbardFactory` has a
`receipt_store_factory_config` field which has the type
`ScabbardFactoryStorageConfig`. When "database-support" is not enabled the
definition of `ScabbardFactoryStorageConfig` still has the `Postgres` and
`Sqlite` variants but also includes a `Lmdb` variant. The connection pool from
the `Sqlite` or `Postgres` variant is used to create a new diesel receipt store
as shown below.

`DieselReceiptStore`'s `new` method also has an optional `service_id` argument.
Including a service ID will scope the receipt store to that specified ID. In
scabbard this ID is the combined circuit ID and service ID formatted as
circuit_id::service_id.

```
Arc::new(RwLock::new(DieselReceiptStore::new(pool.clone(), format!("{}::{}", circuit_id, service_id))))
```

Including a service ID when creating the `DieselReceiptStore` allows for
receipts to be isolated to a specific circuit and service, this is an important
distinction to have when a node has multiple circuits.

## Prior art
[prior-art]: #prior-art

The use of `circuit_id` and `service_id` to create an isolation ID for different
instances of the Diesel backed receipt store is based on the Diesel backed
commit hash store in scabbard.
