# Splinter Glossary

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

<h3 class="glossary-header" id="biome">
Biome
</h3>

<p class="glossary-definition">
Biome is a module in libsplinter containing
several submodules that provide support for user management, user credential
management, and private key management.
</p>

<h3 class="glossary-header" id="canopy">
Canopy
</h3>

<p class="glossary-definition">
Application interface for Splinter that can provide apps dynamically.
Canopy is a distributed-application UI framework that dynamically loads saplings
(application UI components) based on
<a class="glossary-entry" href="#circuit">circuit</a> configuration, user
permissions, and enterprise requirements.
</p>

<h3 class="glossary-header" id="circuit">
circuit
</h3>

<p class="glossary-definition">
Virtual network within the broader Splinter network that safely and securely
enforces privacy scope boundaries. A circuit defines the scope and visibility
domains for two or more connected organizations.
</p>

<h3 class="glossary-header" id="consensus">
consensus
</h3>

<p class="glossary-definition">
Mechanism for ensuring agreement between Splinter
<a class="glossary-entry" href="#service">services</a> and
<a class="glossary-entry" href="#node">nodes</a>.
Splinter currently supports two-phase commit consensus, a basic
consensus algorithm that requires all participating parties to agree.
(Other algorithms are planned for the future.)
</p>

<h3 class="glossary-header" id="node">
node
</h3>

<p class="glossary-definition">
Foundational runtime software that allows an organization to participate in the
network.
</p>

<h3 class="glossary-header" id="sapling">
sapling
</h3>

<p class="glossary-definition">
Plug-in app for <a class="glossary-entry" href="#canopy">Canopy</a> that can
customize the UI, access Splinter or external functionality, or communicate with
back-end platforms and software. Splinter includes a growing set of reusable
saplings for common functionality and interfaces with related products.
</p>

<h3 class="glossary-header" id="sawtooth_sabre">
Sawtooth Sabre
</h3>

<p class="glossary-definition">
Smart contract engine: A distributed application that implements on-chain smart
contracts that can be executed in a WebAssembly virtual machine.
</p>

<h3 class="glossary-header" id="scabbard">
scabbard
</h3>

<p class="glossary-definition">
Splinter <a class="glossary-entry" href="#service">service</a> that runs
Sawtooth Sabre smart contracts across
<a class="glossary-entry" href="#node">nodes</a>, coordinated with
<a class="glossary-entry" href="#consensus">consensus</a>.
</p>

<h3 class="glossary-header" id="service">
service
</h3>

<p class="glossary-definition">
Endpoint within a <a class="glossary-entry" href="#circuit">circuit</a> that
sends and receives private messages.
</p>

<h3 class="glossary-header" id="shared_state">
shared state
</h3>

<p class="glossary-definition">
Distributed database that is visible only to the
<a class="glossary-entry" href="#service">services</a> within a
<a class="glossary-entry" href="#circuit">circuit</a>. Shared state is updated
by smart contracts.
</p>

<h3 class="glossary-header" id="smart_contract">
smart contract
</h3>

<p class="glossary-definition">
Business logic that processes transactions. Runtime deployment of smart
contracts by the <a class="glossary-entry" href="#scabbard">scabbard service</a>
means no need to upgrade the Splinter software stack to add business logic.
Sandboxed WebAssembly smart contracts keep the network safe and ensure
determinism.
</p>

<h3 class="glossary-header" id="splinterd">
splinterd
</h3>

<p class="glossary-definition">
Splinter daemon that handles internal functionality such as
<a class="glossary-entry" href="#circuit">circuit</a> creation and management,
<a class="glossary-entry" href="#consensus">consensus</a>, and
<a class="glossary-entry" href="#service">service</a> coordination.
</p>

<h3 class="glossary-header" id="state_delta_export">
state delta export
</h3>

<p class="glossary-definition">
Mechanism that provides changes to
<a class="glossary-entry" href="#shared_state">shared state</a> as "state
deltas" (state-change updates from Splinter as a result of processed
transactions). Applications can subscribe to these changes to get current
information that can be stored in a local database.
</p>
