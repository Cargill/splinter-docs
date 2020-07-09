# Admin Service Store
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document proposes a set of enhancements to admin service's persisted data
(such as circuit state) and its relationship with internal components of the
Splinter daemon and admin service. Goals include a flexible approach to
implementing different backends for persisting the data (file-based, PostgreSQL,
Sqlite, etc.), clear ownership of the persisted data by the admin service, and
a well-defined separation between the admin service and message routing.

The Splinter daemon stores circuit state in a YAML file on the file
system. This has several limitations:
  - in kubernetes environments, it is desirable to have persisted data stored in
    a managed database instance to avoid allocating persistent filesystem
    storage for the container
  - in environments with established database backup procedures, database
    backups can be safer than file system backups due to the lack of
    checkpointing on the filesystem
  - in unit test and some integration test environments, memory-backed storage
    is preferable to reduce  interaction with the external environment

In addition to solving the above limitations, flexibility is also important for
HA (high-availability) purposes. For example, PostgreSQL has existing HA support
which can be leveraged, as opposed to implementing similar complexity inside the
admin service itself.

In the existing implementation, it is not possible to update both circuit state
and circuit proposal state as an atomic operation, because they are stored in
separate files. This could possibly lead to inconsistency in some edge cases
such as the filesystem filling up during the process of saving the files. This
design is influenced by this issue, so that it can be addressed.

The admin service provides the circuit information used for routing messages,
which in the current implementation creates a strong coupling between the admin
service and message routing. For example, it requires that the admin service be
compiled into the daemon (which may not be desirable in the future for HA
purposes). The tight coupling is also inefficient in terms of locking
contention. Thus, it is desirable to loosely-couple the admin service and
message routing implementation.

This design describes a trait for consolidating circuit and circuit proposal
state into the admin service. This trait will enable implementing multiple
backends, with `SQLite`, `PostgreSQL` and  `YAML` being planned implementations.

This design also includes an in memory routing table that can be used by other
components of the Splinter daemon to route messages based on circuit state.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

This design introduces new concepts: `AdminServiceStore` trait definition, an
in memory `RoutingTable` struct and `RoutingTableWriter` and
`RoutingTableReader` trait. It also includes combining circuit state and circuit
proposal state into a single location.

![]({% link images/admin_store_routing.svg %} "Admin Store and Routing Table")


### Admin Service Store

The admin service store is a trait that provides the API to store and retrieve
circuits and circuit proposal state. The admin service will be in charge of
of updating circuit state as well as loading existing circuits from state and
updating the in memory routing table used by message handlers.

Using a trait for the store allows for multiple back-ends to be implemented for
different use cases. The following are planned:
  - PostgreSQL: to run an external admin service and enable HA support
  - SQLite: to run more complicated integration tests with `cargo test` and for
    development environments
  - YAML: for backward compatibility

### Routing Table

With the consolidation of the circuit and circuit proposal state into the admin
service, the dispatcher handler will need some way to access the routing
information in a circuit definition. Instead of a locked copy of circuit state,
the handlers will take an in-memory routing table.

Along with the routing table struct, there are traits for writing and reading the
routing table. These traits will allow for updating the routing table from
within the same process or from an external connection. The admin service will
use an implementation of the writer to populate the routing table on start and
when a circuit proposal is approved. The message handlers will use an
implementation of the reading trait when routing messages.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Admin Service Store

The admin service store trait defines methods for CRUD operations for fetching
and listing circuits, proposals, nodes, and services without defining a storage
strategy.

Implementations of this trait will replace `libsplinter::storage` and
`SplinterState` used in the Splinter daemon, and `OpenProposals` in the admin
service.

```
  pub trait AdminServiceStore: Send + Sync {
      /// Adds a circuit proposal to the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `proposal` - The proposal to be added
      ///
      ///  Returns an error if a `CircuitProposal` with the same ID already exists
      fn add_proposal(&self, proposal: CircuitProposal) -> Result<(), AdminServiceStoreError>;

      /// Updates a circuit proposal in the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `proposal` - The proposal with the updated information
      ///
      ///  Returns an error if a `CircuitProposal` with the same ID does not exist
      fn update_proposal(&self, proposal: CircuitProposal) -> Result<(), AdminServiceStoreError>;

      /// Removes a circuit proposal from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `proposal_id` - The unique ID of the circuit proposal to be removed
      ///
      ///  Returns an error if a `CircuitProposal` with specified ID does not exist
      fn remove_proposal(&self, proposal_id: &str) -> Result<(), AdminServiceStoreError>;

      /// Fetches a circuit proposal from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `proposal_id` - The unique ID of the circuit proposal to be returned
      fn fetch_proposal(&self, proposal_id: &str) -> Result<Option<CircuitProposal>, AdminServiceStoreError>;

      /// List circuit proposals from the underlying storage
      ///
      /// The proposals returned can be filtered by provided CircuitPredicate. This enables   
      /// filtering by management type and members.
      fn list_proposal(&self, predicates: &[CircuitPredicate],) -> Result<Box<dyn ExactSizeIterator<Item =CircuitProposal>>, AdminServiceStoreError>;

      /// Adds a circuit to the underlying storage. Also includes the associated Services and
      /// Nodes
      ///
      /// # Arguments
      ///
      ///  * `circuit` - The user to be added
      ///
      ///  Returns an error if a `Circuit` with the same ID already exists
      fn add_circuit(&self, circuit: Circuit) -> Result<(), AdminServiceStoreError>;

      /// Updates a circuit in the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `circuit` - The circuit with the updated information
      ///
      ///  Returns an error if a `CircuitProposal` with the same ID does not exist
      fn update_circuit(&self, circuit: Circuit) -> Result<(), AdminServiceStoreError>;

      /// Removes a circuit from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `circuit_id` - The unique ID of the circuit to be removed
      ///
      ///  Returns an error if a `Circuit` with the specified ID does not exist
      fn remove_circuit(&self, circuit_id: &str) -> Result<(), AdminServiceStoreError>;

      /// Fetches a circuit from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `circuit_id` - The unique ID of the circuit to be returned
      fn fetch_circuit(&self, circuit_id: &str) -> Result<Option<Circuit>, AdminServiceStoreError>;

      /// List all circuits from the underlying storage
      ///
      /// The proposals returned can be filtered by provided CircuitPredicate. This enables   
      /// filtering by management type and members.
      fn list_circuits(&self,  predicates: &[CircuitPredicate]) -> Result<Box<dyn ExactSizeIterator<Item =Circuit>>, AdminServiceStoreError>;

      /// Adds a circuit to the underlying storage based on the proposal that is already in state..
      /// Also includes the associated Services and Nodes. The associated circuit proposal for
      /// the circuit ID is also removed
      ///
      /// # Arguments
      ///
      ///  * `circuit` - The circuit to be added
      fn upgrade_proposal_to_circuit(
          &self,
          circuit_id: String,
      ) -> Result<(), AdminServiceStoreError>;

      /// Fetches a node from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `node_id` - The unique ID of the node to be returned
      fn fetch_node(&self, node_id: &str) -> Result<Option<CircuitNode>, AdminServiceStoreError>;

      /// List all nodes from the underlying storage
      fn list_nodes(&self) -> Result<Box<dyn ExactSizeIterator<Item =CircuitNode>>, AdminServiceStoreError>;

      /// Fetches a service from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `service_id` - The `ServiceId` of a service made up of the circuit ID and service ID
      fn fetch_service(
          &self,
          service_id: &ServiceId,
      ) -> Result<Option<Service>, AdminServiceStoreError>;

      /// List all services in a specific circuit from the underlying storage
      ///
      /// # Arguments
      ///
      ///  * `circuit_id` - The unique ID of the circuit the services belong to
      fn list_services(
          &self,
          circuit_id: String,
      ) -> Result<Box<dyn ExactSizeIterator<Item = Service>>, AdminServiceStoreError>;
  }
  ```

The splinter library will provide several implemented backends. The planned
implementations are `DieselAdminServiceStore` (PostgreSQL and SQLite) and
`YamlAdminServiceStore`.

### Routing Table

With the consolidation of the circuit state and open proposal state into the
admin service, the dispatcher handlers will need some way to access circuit
information for routing purposes. Instead of taking `SplinterState` the
handlers will now take a `RoutingTableReader`.

For example:

  ```
  // Implements a handler that handles `CircuitDirectMessage`
  pub struct CircuitDirectMessageHandler {
      node_id: String,
      routing_table: Box<dyn RoutingTableWriter>,
  }
  ```

The `RoutingTable` will be an in memory struct that will need to be rebuilt on
restart as well as updated when the admin service updates circuit state.

The methods for reading the `RoutingTable` are defined in the trait
`RoutingTableReader`. This trait includes methods for getting circuits,
services, and nodes.

```
  pub trait RoutingTableReader {
      // ---------- methods to access service directory ----------
      fn fetch_service(&self, id: &ServiceId) -> Result<Option<Service>, RoutingTableReadError>;

      fn has_service(&self, id: &ServiceId) -> Result<bool, RoutingTableReadError>;


      // ---------- methods to access circuit directory ----------

      fn list_nodes(&self) ->  Result<Box<dyn ExactSizeIterator<Item = Node>,  RoutingTableReadError>;

      fn fetch_node(&self, node_id: &str) -> Result<Option<CircuitNode>,  RoutingTableReadError>;

      fn list_circuits(&self) -> Result<Box<dyn ExactSizeIterator<Item = Circuit>, RoutingTableReadError>;


      fn fetch_circuit(&self, circuit_id: &str) -> Result<Option<&Circuit>, RoutingTableReadError>;


      fn has_circuit(&self, circuit_id: &str) ->Result<bool, RoutingTableReadError>;

  }
```

The methods for updating the `RoutingTable` are defined in the trait
`RoutingTableWriter`. This trait includes methods for adding and removing
circuits, as well as adding and removing nodes and services.

```
  pub trait RoutingTableWriter {
      fn add_service(&mut self, service_id: ServiceId, service: Service) -> Result<(), RoutingTableWriterError>;

      fn remove_service(&mut self, service_id: &ServiceId) -> Result<(), RoutingTableWriterError>;

      fn add_circuit(&mut self, name: String, circuit: Circuit) -> Result<(), RoutingTableWriterError>;

      fn add_circuits(&mut self, circuits: Vec<Circuit>) -> Result<(), RoutingTableWriterError>;

      fn remove_circuit(&mut self, name: &str) -> Result<(), RoutingTableWriterError>;

      fn add_node(&mut self, id: String, node: CircuitNode -> Result<(), RoutingTableWriterError>;

      fn remove_node(&mut self, id: &str) -> Result<(), RoutingTableWriterError>;
  }
```

The first implementation will enable the admin service to update the
`RoutingTable` from within the same process. This implementation will use
channels to communicate the changes from the admin service thread to the
handler threads where the `RoutingTable` is.

In the future, the admin service needs to be able to run as an external service
to support HA. For this to be possible, a future implementation will need to
support receiving updates over a TCP connection.

#### Testing

While implementing the in memory `RoutingTable` implementation, it is important
to verify that it can handle a large number of circuits. The following unit
tests will be implemented to test continued functionality and performance:
  1. Load `RoutingTable` with a large number of circuits and validate it still
     functions.
  2. Load `RoutingTable` with a large number of circuits (several different
     amounts) and test the performance of reading from the `RoutingTable`.
  3. Load `RoutingTable` with a large number of circuits (several different
     amounts) and test the performance of adding a new circuit.

## Drawbacks
[drawbacks]: #drawbacks

Moving circuit state into the admin service and adding an in memory circuit
routing table is quite a big change. The handlers used by the Splinter daemon
are a part of the current public API and take a locked copy of `SplinterState`.
As such, it will be difficult or even impossible to back-port the full
implementation to 0.4.

## Prior art
[prior-art]: #prior-art

This design is based on the storage design used for Biome stores. Biome
currently has implementations for PostgreSQL and in memory stores. A SQLite
implementation will be added in the future.

This design also takes inspiration from the existing `libsawtooth::storage`,
`SplinterState`, and `OpenProposals`.

## Unresolved questions
[unresolved]: #unresolved

How the external admin service will update the in-memory routing table in the
Splinter daemon will be fully designed in the future.

The pattern for the SQLite approach still needs to be designed.
