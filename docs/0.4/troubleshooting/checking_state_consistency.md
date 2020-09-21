# Inconsistent Application Behavior Across Nodes: Check State Consistency

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Problem

An application that uses the scabbard service is behaving differently on two
nodes in the same circuit.

As one of the first steps for troubleshooting this problem, you should verify
that the scabbard services are consistent with each other.

## Troubleshooting: Checking State Consistency

All of scabbard’s state is summarized by a Merkle state root hash. You can
compare the state root hash of one node's scabbard service with the state root
hash of another node's service to check if their states are consistent.

Use either of these methods to check the state root hash of a scabbard service.

* Search the scabbard log messages for the current state root hash.
  
  On startup, scabbard logs its state root hash with a DEBUG message that looks
  like this example:

  ```
  [2020-05-13 16:49:49.990] T["Service admin::alpha-node-000"] DEBUG [scabbard::service::state] Restoring scabbard state on root 9d1f8f581cd30cea54095e9ba150dd30cfd94637ecf88a5ba6b63e6c6c08025d
  ```

  After every committed batch, scabbard logs the resulting state root hash with
  an INFO message like this one:

  ```
  [2020-05-13 16:52:45.523] T["consensus-gr01"] INFO [scabbard::service::state] committed 1 change(s) for new state root e2982636275dc02817a725a6671a709df4320e20d227614509270e581f246cf8
  ```

* Run `scabbard state root` on the command line to display the state root hash.

  For more information, run `scabbard state root --help`.
