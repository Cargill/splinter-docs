# Roadmap

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The following is a tentative roadmap to future releases.

## Splinter v0.7

Splinter v0.7 provides a robust Scabbard service with an architecture to support
high availability work moving forward. The high availability journey begins here
because transaction processing involves technically complex parts of the system:
a merkle tree with provable state agreement and consensus algorithms.

The release will also include an orders of magnitude increase in txn/sec that
Scabbard can processes at both a circuit level and per process/node.

| Feature | Status | Documentation |
| ------- | ------ | ------------- |
| Actix Upgrade | Discussion | - |
| Augrim 2PC | Discussion | - |
| Augrim 3PC | Discussion | - |
| Cylinder Keygen | Under Development | - |
| Dynamic Circuits | Not Started | - |
| Error Command | Not Started | - |
| Expose Integration Test API | Not Started | - |
| REST API crate | Not Started | - |
| Sawtooth Journal Abstraction | Discussion | - |
| Splinter Workload | Not Started | - |
| Transact Sabre | Under Development | - |

## Past Roadmaps

The following are roadmaps for completed past releases.

### Splinter v0.6

Splinter v0.6 addresses critical areas required for running Splinter in
production, which brings Splinter to a huge milestone: v0.6 is expected to be
suitable for low-volume production environments which can withstand some amount
of downtime for upgrades or single-point-of-failure issues.

| Feature | Status | Documentation |
| ------- | ------ | ------------- |
| Basic Metrics | Complete | - |
| Circuit Deletion | Complete | [splinter circuit disband]({% link docs/0.6/references/cli/splinter-circuit-disband.1.md %}),  [splinter circuit abandon]({% link docs/0.6/references/cli/splinter-circuit-abandon.1.md %}),   [splinter circuit purge]({% link docs/0.6/references/cli/splinter-circuit-purge.1.md %}) |
| Circuit Name | Complete | [splinter circuit propose]({% link docs/0.6/references/cli/splinter-circuit-propose.1.md %}), [splinter circuit show]({% link docs/0.6/references/cli/splinter-circuit-show.1.md %}), [splinter circuit list]({% link docs/0.6/references/cli/splinter-circuit-list.1.md %}) |
| Circuit Template | Complete | [How-to]({% link docs/0.6/howto/using_circuit_templates.md %}), [Man page]({% link docs/0.6/references/cli/splinter-circuit-propose.1.md %}) |
| Challenge Authorization | Complete |[Challenge Authorization]({% link community/planning/challenge_authorization.md %})|
| Cylinder Support | Complete | [Repo](https://github.com/Cargill/cylinder) |
| Cloud-friendly Deployment | Complete | [Admin Service Store Feature]({% link community/planning/admin_service_store.md %}), [Data Store Guidelines]({% link community/data_store_guidelines.md %}) |
| Database - PostgreSQL Support | Complete | [Data Store Guidelines]({% link community/data_store_guidelines.md %}), [Configuring Splinter Daemon Database]({% link docs/0.6/howto/configure_database_storage.md %}) |
| Database - SQLite Support | Complete | [Data Store Guidelines]({% link community/data_store_guidelines.md %}), [Configuring Splinter Daemon Database]({% link docs/0.6/howto/configure_database_storage.md %}) |
| REST API - Authorization | Complete | [REST API Authorization Design]({% link community/planning/rest_api_authorization.md %}) |
| REST API - Cylinder JWT Authentication | Complete | [Cylinder JWT Authentication]({% link community/planning/cylinder_jwt_authentication.md %}) |
| REST API - OAuth 2 Authentication | Complete | [OAuth 2 REST API Authentication]({% link community/planning/oauth2_rest_api_authentication.md %}) |
| Transact SQL Support | Complete | [Code](https://github.com/hyperledger/transact/tree/master/libtransact/src/database) |
| WebSocket Transport | Experimental | [Code](https://github.com/Cargill/splinter/tree/master/libsplinter/src/transport/ws) |


## Additional Information

### Management of the Roadmap

The roadmap is a collaborative effort derived from both agile community
feedback and long-term vision. Communities building other open source projects
which are built upon Splinter, such as Hyperledger Grid and Hyperledger
Sawtooth, have a substantial impact on the roadmap. Non-public projects also
have a substantial impact.

Please [join the community]({% link community/index.md %})!

### Status

The status column can contain these values:

| Status | Description |
| --- | --- |
| Not Started | No work has actively started on this feature. |
| Discussion | This feature is actively being discussed. |
| Under Development | The feature is actively being developed. |
| Implemented | The bulk of the implementation is done and the feature is usable. |
| Complete | The feature is ready for the release. |
| Experimental | This feature is experimental and will likely remain experimental for this release. |
