<!--
  Copyright 2018-2020 Cargill Incorporated

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
# Biome User Management

Biome is a module in libsplinter containing several submodules that provide
support for user management, user credential management, and private key
management. These submodules, and their functionality are bundled into Biome’s
REST API module and can be integrated into an existing splinter REST API using
libsplinter’s rest-api feature.

## Modules

* **User Management**: API to add, delete, update, and retrieve user
information.

* **Credential Management**: API to register and authenticate a user using a
username and password. Not recommended for use in production.

* **Private Key Management**: API to store and retrieve encrypted private keys.
