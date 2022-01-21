# Feature Planning
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Current

Features listed here exist in various stages of the development process.  Many
are in the design phase and may result in significant changes that may impact
applications built on top of Splinter and its constellation of related libraries
and services.

We welcome discussion on these topics, either on Slack or during the engineering
forum.

| Feature | Description |
| ------- | ----------- |
| [Canopy 0.2]({% link community/planning/canopy_0.2.md %}) | New design of the Canopy system that enables dynamic loading of saplings and improved inter-sapling communication |
| [Capabilities Repository]({% link community/planning/capabilities-repository.md %}) | A design for a repository and all the surrounding tools and formats for Splinter artifacts. These artifacts include saplings, smart contracts, and capabilities distributions. |
| [REST API Maintenance Mode]({% link community/planning/rest_api_maintenance_mode.md %}) | Design for the maintenance mode authorization handler for the Splinter REST API |

## Historical

Features listed here are no longer being worked on, either because they have
been completed or abandoned. These documents represent the the intended design
at the time the features were implemented. Due to Splinter's rapid development,
the current state of these features may differ somewhat from the original
design.

| Feature | Description | Implemented |
| ------- | ----------- | ------- |
| [Admin Service Store]({% link community/planning/admin_service_store.md %}) | New design for storing circuit and circuit proposal state | v0.6 |
| [Admin UI]({% link community/planning/admin_ui.md %}) | Splinter administration utility |
| [Admin UI Profile Redesign]({% link community/planning/admin_ui_profile.md %}) | New designs for the profile page in the splinter Admin UI |
| [Biome OAuth Integration]({% link community/planning/biome_oauth_user_session_store.md %}) | New design for a linkage between an OAuth user id and a biome userid | v0.6 |
| [Challenge Authorization]({% link community/planning/challenge_authorization.md %}) | New design for a secure peer authorization type | v0.6 |
| [Circuit Abandon]({% link community/planning/circuit_abandon.md %}) | Design for abandoning a circuit | v0.6 |
| [Circuit Disband]({% link community/planning/circuit_disband.md %}) | Design for removing a circuit's networking capabilities | v0.6 |
| [Circuit Purge]({% link community/planning/circuit_purge.md %}) | Design for removing a circuit's state data | v0.6 |
| [Cylinder JWT]({% link community/planning/cylinder_jwt.md %}) | A JSON Web Token module for the Cylinder Signing library | v0.6 |
| [Cylinder JWT Authentication]({% link community/planning/cylinder_jwt_authentication.md %}) | Support of Cylinder JWT authentication for the Splinter REST API | v0.6 |
| [Libsawtooth Receipt Store]({% link community/planning/libsawtooth_receipt_store.md %}) | New design for a Receipt Store trait in libsawtooth | v0.6 |
| [Oauth Profile]({% link community/planning/oauth_profile.md %}) | Design for retrieving profile information from OAuth providers | v0.6 |
| [OAuth 2 REST API Authentication]({% link community/planning/oauth2_rest_api_authentication.md %}) | Support of OAuth 2 authentication for the Splinter REST API | v0.6 |
| [PeerManager]({% link community/planning/peer_manager.md %}) | The `PeerManager` is in charge of keeping track of peers and their reference counts, as well as requesting connections from the `ConnectionManager` | v0.6 |
| [Proposal Removal]({% link community/planning/proposal_removal.md %}) | Design for removing a circuit proposal | v0.6 |
| [REST API Authorization]({% link community/planning/rest_api_authorization.md %}) | Design for securing the Splinter REST API | v0.6 |
| [Scabbard Back Pressure]({% link community/planning/scabbard_back_pressure.md %}) | Simple back pressure for the batch queue | v0.6 |
| [Scabbard Diesel Receipt Store]({% link community/planning/scabbard_diesel_receipt_store.md %}) | Diesel backed receipt store migrations and configuration in scabbard | v0.6 |
| [Transact SQL Merkle State]({% link community/planning/transact_sql_merkle_state.md %}) | Transact Merkle State stored in Postgres and/or SQLite | v0.6 |
