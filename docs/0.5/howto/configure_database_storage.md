## Configuring Splinter Daemon Database 

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Much of the runtime data maintained by a splinter daemon is persisted in a
database instance.  This includes things like circuit state and node registry
information. 

Splinter supports both [SQLite](https://sqlite.org) and
[PostgreSQL](https://www.postgresql.org) databases. The former is useful for
development situations, or very small testing deployments. The latter is
well-suited for production deployments.

Services, such as scabbard, are responsible for managing their own state
persistence. As a result, these are not necessarily stored in the same database.

### Requirements

#### SQLite

Splinter supports SQLite version 3.6.8 or newer.

#### PostgreSQL

Splinter supports Postgres version 9.5 and above

### Connection Strings

Connections to databases are established via a string appropriate for the
database target.  

For postgres, this string is a standard URI format

```
postgres://username:password@postgres-hostname/databasename
```

For SQLite, this format follows the basic connection string format, specifying
either a file path, or memory only. For example:

* `splinter_state.db` (the default SQLite database)
* `/var/lib/splinter/my_splinter.db`
* `:memory:`

### Running Migrations

Over the lifetime of a Splinter node, the database schema may change across
releases. The `splinter` CLI tool provides a command for running database
migrations, in order to upgrade the installation.

This example command updates a PostgreSQL database:

```
$ splinter database migrate \
    -C postgres://admin:my_password@postgres-host/splinter
```

Running this command without a specific connection string will apply the
migrations to the default database at `$SPLINTER_STATE_DIR/splinter_state.db`

### Splinter Daemon Configuration

The Splinter daemon can be configured to connect to a specific database via a
configuration option.  This option can be set in several ways.

* Configure the database connection via the `--database` option on the `splinterd`
  command:

  ```
  $ splinterd \
      --database postgres://admin:my_password@postgres-host/splinter
  ```

* Configure the database via the toml configuration file:

  ```toml
  database = "postgres://admin:my_password@postgres-host/splinter"
  ```

* For SQLite databases, configure the location of the database file via an
  environment variable.

  Either:

  ```
  $ export SPLINTER_HOME=/my_splinter_home
  ```

  where the resulting SQLite database files will be found in
  `/my_splinter_home/data`.

  Alternatively:

  ```
  $ export SPLINTER_DATA_DIR=/my_splinter_data
  ```

  where the resulting SQLite database files will be found in
  `/my_splinter_data`.

  In either case, the database file itself can be customized specified using the
  `--database` option.

  ```
  $ splinterd --database my_splinter_state.db
  ```

  If no `--database` option is provided, the default value of
  `splinter_state.db` will be used.
