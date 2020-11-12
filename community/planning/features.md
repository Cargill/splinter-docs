# Feature Planning
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Features listed here exist in various stages of the development process.  Many
are in the design phase and may result in significant changes that may impact
applications built on top of Splinter and its constellation of related libraries
and services.

We welcome discussion on these topics, either on Slack or during the engineering
forum.

## Features

* [Canopy 0.2]({% link community/planning/canopy_0.2.md %})

  New design of the Canopy system that enables dynamic loading of saplings and
  improved inter-sapling communication.

* [Cylinder JWT]({% link community/planning/cylinder_jwt.md %})

  A JSON Web Token module for the Cylinder Signing library.

* [PeerManager]({% link community/planning/peer_manager.md %})

  The `PeerManager` is in charge of keeping track of peers and their reference
  counts, as well as requesting connections from the `ConnectionManager`.

* [Admin UI]({% link community/planning/admin_ui.md %})

  Splinter administration utility.

* [Admin Service Store]({% link community/planning/admin_service_store.md %})

  New design for storing circuit and circuit proposal state.
