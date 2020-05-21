# About Biome

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
