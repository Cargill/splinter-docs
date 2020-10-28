# Roadmap

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

The following is a tentative roadmap to future releases.

Splinter uses an odd/even release numbering. Even minor numbers (0.4, 0.6) are
stable releases, while odd minor numbers (0.3, 0.5) are developer releases.
Only stable releases are covered on the roadmap.


## Splinter 0.6

| Feature | Status | Documentation |
| ------- | ------ | ------------- |
| Circuit Deletion | Not Started | - |
| Circuit Name | Under Development | - |
| Circuit Template | Complete | [How-to]({% link docs/0.5/howto/using_circuit_templates.md %}), [Man page]({% link docs/0.5/references/cli/splinter-circuit-propose.1.md %}) |
| Challenge Authorization | Not Started | - |
| Cylinder Support | Under Development | [Repo](https://github.com/Cargill/cylinder) |
| Cloud-friendly Deployment | Under Development | [Admin Service Store Feature]({% link community/planning/admin_service_store.md %}), [Data Store Guidelines]({% link community/data_store_guidelines.md %}) |
| Database - PostgreSQL Support | Under Development | - |
| Database - SQLite Support | Under Development | - |
| REST API - Authorization | Discussion | - |
| REST API - Cylinder JWT Authentication | Under Development | - |
| REST API - OAuth 2 Authentication | Under Development | - |
| Transact SQL Support | Under Development | [Code](https://github.com/hyperledger/transact/tree/master/libtransact/src/database) |
| WebSocket Transport | Experimental | [Code](https://github.com/Cargill/splinter/tree/master/libsplinter/src/transport/ws) |

## Splinter 0.8

This release is still in early planning, but some features are already under
development.

| Feature | Status | Documentation |
| ------- | ------ | ------------- |
| Advanced Blockchain (Sawtooth) Support | Under Development | - |

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
