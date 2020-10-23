# Canopy Application Framework

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Canopy is a JavaScript framework for building the client-side web portion of a
full-stack [Splinter](https://github.com/Cargill/splinter) application. A
Canopy application is a React app that can dynamically load _saplings_ — user
interface (UI) plugins — to provide a custom UI for Splinter. The application
can choose which saplings to load based on enterprise requirements, user
permissions, smart contracts, Splinter configuration, or other information.

The Canopy framework consists of two JavaScript libraries:

* **CanopyJS** is a library for the web part of a Splinter application. It
  provides functionality for loading saplings into a Canopy application, exposes
  shared configuration to saplings and the Canopy application, and implements
  some of the functions defined in SaplingJS. CanopyJS is available on GitHub at
  [Cargill/splinter-canopyjs](https://github.com/Cargill/splinter-canopyjs).

* **SaplingJS** is a library for the UI plugins (also called _UI apps_) that
  run in a Canopy application. This library provides common functionality for
  tasks such as user registration and login, user storage, transaction
  submission, and Canopy configuration. SaplingJS is available on GitHub at
  [Cargill/splinter-saplingjs](https://github.com/Cargill/splinter-saplingjs).

## Canopy Features

A Canopy application is essentially a navigation and view manager for the
content that is rendered by one or more saplings. Canopy's features include:

* **Sapling installation and activation**: The Canopy application handles
  installing and activating saplings by using a manifest (in JSON format) that
  lists the available saplings.

* **Access control**: Canopy manages user access to the available saplings.
  For example, an administrator could access a circuit management sapling that
  general users cannot use.

* **Registration**: Canopy provides specialized hooks for saplings to register
  for messages from the Canopy application and other saplings.

* **User-controlled sapling selection**: For saplings that provide content,
  Canopy provides a way to select between active saplings.

* **Customizable UI themes**: Canopy allows an application to change the
  branding and theme for an enterprise or organization.

## Saplings

A sapling is a UI plugin that provides a single function, or related set of
functions for interacting with Splinter components and services (including
transaction processing and smart contracts, if available). Saplings can also
provide access to other back-end functionality, such as user authorization for
an enterprise.

* Saplings can render content to the main view of a Canopy application. They
  can also run in the background, gather information, and perform functions (or
  a combination of these actions). For example, a login sapling could check if
  the user is logged in, then either display a login screen or show the user's
  home view.

* A sapling can communicate with multiple back-end systems, using any API that
  is accessible from the browser. For example, saplings can interact with
  Splinter circuits, services, and smart contracts by fetching data from the
  Splinter REST APIs, then managing or storing the data as necessary, while
  handling any Splinter notifications.

* Saplings can be public or private. Organizations can choose to share
  open-source saplings, keep them private, or provide saplings for a fee. A
  commercial product based on a Canopy application could include open-source
  saplings along with their proprietary saplings.

Saplings have no requirements for a specific UI rendering framework, so they
can be written using any framework.

## Example Canopy Application

[Hyperledger Grid](https://github.com/hyperledger/grid) provides an example
Canopy application called
[Grid UI](https://github.com/hyperledger/grid/tree/master/ui/grid-ui),
which includes Grid saplings that can communicate with the Grid daemon's REST
API. The Grid UI application imports CanopyJS to provide an
interface for Grid saplings to share functionality such as user, key, and
session management. Also, Grid UI demonstrates Canopy theming by
featuring the default Grid branding and theme.

See the [Grid UI
README](https://github.com/hyperledger/grid/tree/master/ui/grid-ui/README.md)
to learn how to run, test, and build this Canopy application.

## Disclaimer

This topic describes Canopy design goals and intended functionality. Some
Canopy features are not yet available, such as customizing saplings for
individual users or a specific Splinter configuration.
