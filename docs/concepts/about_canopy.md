# About Canopy

Canopy is Splinter's distributed-application UI framework that dynamically
loads saplings (application UI components) based on circuit configuration,
user permissions, or enterprise requirements. By providing reusable UI
components, Canopy makes it easier to develop a complex web application that
includes Splinter and a distributed ledger platform.

Saplings are plug-in apps that can generate a main view for the Canopy UI,
make use of hooks into Canopy, and extend functionality of another sapling or
of Canopy itself. Saplings can communicate with any REST API that is accessible
from the browser.

Splinter provides the Canopy framework and a growing set of reusable saplings.
One of Canopy's goals is to reduce the development work for a complex Splinter
application. A Splinter administrator won't have to write anything to provide
functions such as circuit administration or network monitoring. An application
developer can easily customize an organization's Splinter application by
selecting functionality from a growing library of saplings. Note that saplings
can be open source, commercial, or private to an organization.

New UI themes for Canopy can be created to suit an organization's requirements.
Selected saplings can be made available for all users, either on the Canopy
navigation bar or in an app library. Other saplings can be determined
dynamically when a user logs in or joins a circuit.

* For example, a Gameroom sapling could let all users try basic Splinter
  functionality by playing tic-tac-toe on a "gameroom" circuit.

* When an administrator logs in, Canopy could preload a Health sapling for
  monitoring network and circuit status.

> **Note:** This topic describes Canopy design goals and intended functionality.
> Some Canopy features are not yet available, such as customizing saplings on a
> per-user basis.

