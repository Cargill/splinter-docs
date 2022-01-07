# Testing

The following document gives an overview of some of the testing that is done
prior to a release.

Tests:
* [Long Running Tests](#long-running-tests)
* [Backwards Compatibility](#backwards-compatibility)

## Long Running Tests

It is important that a Splinter network is capable of running under load without
stability issues. Before a release is completed, it is required that new
versions can successfully pass the LR1 and LR7 tests.

### Procedure

Automated systems (Ansible, Cron, Terraform) start LR networks on a daily or
weekly basis with a predetermined node count and workload rates, sending their
logs and Splinter network statistics off to remote systems. At the end of the
test interval, this automated system stops the Splinter network, preserves log
and state data, cleans up logs and state from the previous run and finally
starts the process over on the same EC2 instances. System metrics of completed
LR networks will expire after 60 days.

We are currently running 4 different configurations:

 * LR1 PostgreSQL: All Splinter and Scabbard state is stored in a PostgreSQL
   database. The test is run for 24 hours.
 * LR1 SQLite: All Splinter and Scabbard state is a SQLite database. The test is
   run for 24 hours.
 * LR1 SQLite + LMDB: All Splinter state and Scabbard transaction receipts are
   stored in a SQLite database. Scabbard merkle state is stored in LMDB. The
   test is run for 24 hours.
 * LR7 PostgreSQL: All Splinter and Scabbard state is stored in a PostgreSQL
   database. The test is run for 7 days.

All tests start with 5 nodes with empty databases. 2 two-party scabbard circuits
and 1 three-party scabbard circuit are established, resulting in one node
being a part of 2 separate circuits. For each circuit, the Command family
smart contract is configured on all scabbard services. For more information on
the Command Family see the
[RFC](https://github.com/hyperledger/transact-rfcs/pull/6).

The Hyperledger Transact `transact workload` subcommand is set up against each
circuit for the Command Family and submits transactions at a rate of 2 per
second. For more information on the workload command see the
[man page](https://github.com/hyperledger/transact/blob/main/cli/man/transact-workload.1.md).

At the end of the run, the merkle state for each service on a circuit is checked
to make sure they all have the same resulting state root hash. For more
information see [Check State Consistency]({% link
docs/0.6/troubleshooting/checking_state_consistency.md %}).

## Backwards Compatibility

It is important to keep backwards compatibility between versions of Splinter and
enable an easy upgrading path. The following procedure can be used to verify
that a running network can be upgraded, with nodes upgrading at different times.

We will use Grid to demonstrate the upgrading processes.

> Note: This procedure will include several hacks and required updates to be
> able to test this upgrading test locally.
>
> Requires Rust and Docker. The following was tested on Rust v1.57.0 and Docker
> v20.10.8.

### Mimic a 0.4 Splinter network running Grid

Clone, update and build the Splinter and Grid repositories.

#### Build Splinter 0.4

Clone the Splinter git repository and checkout the 0-4 branch:

```
$ git clone git@github.com:Cargill/splinter.git
$ cd splinter
$ git fetch origin
$ git checkout origin/0-4
```

Apply the following git diff to enable using `SPLINTER_HOME` environment
variable:

```
diff --git a/splinterd/src/daemon.rs b/splinterd/src/daemon.rs
index 17cc9a98..3bf55613 100644
--- a/splinterd/src/daemon.rs
+++ b/splinterd/src/daemon.rs
@@ -375,9 +375,9 @@ impl SplinterDaemon {

         let (orchestrator, orchestator_join_handles) = ServiceOrchestrator::new(
             vec![Box::new(ScabbardFactory::new(
+                Some(self.state_dir.to_string()),
                 None,
-                None,
-                None,
+                Some(self.state_dir.to_string()),
                 None,
                 Box::new(SawtoothSecp256k1SignatureVerifier::new()),
             ))],
```

Build the repo and update PATH:

```
$ cargo build
$ export PATH=$PATH:$(pwd)/target/debug
```

#### Build Grid 0.3

Clone the Grid git repository:

```
$ git clone git@github.com:hyperledger/grid.git
$ cd grid
```

To be able to run Grid local several changes are currently required. First,
we need update grid to be able to find the scar files in a different location
then the default scar path. The following diff puts the scar path into
`"/Users/REPLACE_USER/.share/scar"`. Replace this path with wherever your scar files
will be saved:

```
diff --git a/daemon/src/splinter/app_auth_handler/sabre.rs b/daemon/src/splinter/app_auth_handler/sabre.rs
index d78cf08f..0c5fa391 100644
--- a/daemon/src/splinter/app_auth_handler/sabre.rs
+++ b/daemon/src/splinter/app_auth_handler/sabre.rs
@@ -16,6 +16,7 @@
  */

 use std::convert::TryInto;
+use std::path::PathBuf;
 use std::time::Duration;

 #[cfg(feature = "location")]
@@ -81,7 +82,7 @@ pub fn setup_grid(
         feature = "purchase-order",
         feature = "schema"
     ))]
-    let version = env!("CARGO_PKG_VERSION");
+    let version = "0.2.2";

     let signer = new_signer(scabbard_admin_key)?;

@@ -138,8 +139,9 @@ fn make_pike_txns(
     version: &str,
     signer: &TransactSigner,
 ) -> Result<(), AppAuthHandlerError> {
-    let pike_contract =
-        SmartContractArchive::from_scar_file("grid-pike", version, &default_scar_path())?;
+    let mut scar_paths = default_scar_path();
+    scar_paths.push(PathBuf::from("/Users/REPLACE_USER/.share/scar"));
+    let pike_contract = SmartContractArchive::from_scar_file("grid-pike", version, &scar_paths)?;
     let pike_contract_registry_txn = CreateContractRegistryActionBuilder::new()
         .with_name(String::from(&pike_contract.metadata.name))
         .with_owners(vec![bytes_to_hex_str(signer.public_key())])
@@ -179,8 +181,10 @@ fn make_product_txns(
     version: &str,
     signer: &TransactSigner,
 ) -> Result<(), AppAuthHandlerError> {
+    let mut scar_paths = default_scar_path();
+    scar_paths.push(PathBuf::from("/Users/REPLACE_USER/.share/scar"));
     let product_contract =
-        SmartContractArchive::from_scar_file("grid-product", version, &default_scar_path())?;
+        SmartContractArchive::from_scar_file("grid-product", version, &scar_paths)?;
     let product_contract_registry_txn = CreateContractRegistryActionBuilder::new()
         .with_name(String::from(&product_contract.metadata.name))
         .with_owners(vec![bytes_to_hex_str(signer.public_key())])
@@ -240,8 +244,11 @@ fn make_location_txns(
     version: &str,
     signer: &TransactSigner,
 ) -> Result<(), AppAuthHandlerError> {
+    let mut scar_paths = default_scar_path();
+    scar_paths.push(PathBuf::from("/Users/REPLACE_USER/.share/scar"));
+
     let location_contract =
-        SmartContractArchive::from_scar_file("grid-location", version, &default_scar_path())?;
+        SmartContractArchive::from_scar_file("grid-location", version, &scar_paths)?;
     let location_contract_registry_txn = CreateContractRegistryActionBuilder::new()
         .with_name(String::from(&location_contract.metadata.name))
         .with_owners(vec![bytes_to_hex_str(signer.public_key())])
@@ -301,8 +308,10 @@ fn make_schema_txns(
     version: &str,
     signer: &TransactSigner,
 ) -> Result<(), AppAuthHandlerError> {
+    let mut scar_paths = default_scar_path();
+    scar_paths.push(PathBuf::from("/Users/REPLACE_USER/.share/scar"));
     let schema_contract =
-        SmartContractArchive::from_scar_file("grid-schema", version, &default_scar_path())?;
+        SmartContractArchive::from_scar_file("grid-schema", version, &scar_paths)?;
     let schema_contract_registry_txn = CreateContractRegistryActionBuilder::new()
         .with_name(String::from(&schema_contract.metadata.name))
         .with_owners(vec![bytes_to_hex_str(signer.public_key())])
@@ -352,8 +361,10 @@ fn make_purchase_order_txns(
     version: &str,
     signer: &TransactSigner,
 ) -> Result<(), AppAuthHandlerError> {
+    let mut scar_paths = default_scar_path();
+    scar_paths.push(PathBuf::from("/Users/REPLACE_USER/.share/scar"));
     let purchase_order_contract =
-        SmartContractArchive::from_scar_file("grid-purchase-order", version, &default_scar_path())?;
+        SmartContractArchive::from_scar_file("grid-purchase-order", version, &scar_paths)?;
     let purchase_order_contract_registry_txn = CreateContractRegistryActionBuilder::new()
         .with_name(String::from(&purchase_order_contract.metadata.name))
         .with_owners(vec![bytes_to_hex_str(signer.public_key())])
```

and then copy all the scar files with the following:

```
$ curl https://grid.hyperledger.org/scar/0.2.2/grid-track-and-trace_0.2.2.scar \
    -o /Users/$USER/.share/scar/grid-track-and-trace_0.2.2.scar
$ curl https://grid.hyperledger.org/scar/0.2.2/grid-pike_0.2.2.scar \
    -o /Users/$USER/.share/scar/grid-pike_0.2.2.scar
$ curl https://grid.hyperledger.org/scar/0.2.2/grid-schema_0.2.2.scar \
    -o /Users/$USER/.share/scar/grid-schema_0.2.2.scar
$ curl https://grid.hyperledger.org/scar/0.2.2/grid-location_0.2.2.scar \
    -o /Users/$USER/.share/scar/grid-location_0.2.2.scar
$ curl https://grid.hyperledger.org/scar/0.2.2/grid-product_0.2.2.scar \
    -o /Users/$USER/.share/scar/grid-product_0.2.2.scar
$ curl https://grid.hyperledger.org/scar/0.2.2/grid-purchase-order_0.2.2.scar \
    -o /Users/$USER/.share/scar/grid-purchase-order_0.2.2.scar
```

Build grid:

```
$ cargo build
$ export PATH=$PATH:$(pwd)/target/debug
```

Before starting the Splinter daemons, we will need the gridd key. Generate
the key and copy the public key. This key will be added to the `registry.yaml`
file.

```
$ grid -vv keygen gridd
$ cat /Users/$USER/.grid/keys/gridd.pub
024faabf8a58522c41c2cb0c1cb003aa7c9ff1ea734a54be402a7ea70cce01094ctest
```

#### Setting up Splinter Node 1

Start docker postgres instance:

```
$ docker run -d -p 5432:5432 --name splinter-db-alpha \
    -e POSTGRES_PASSWORD=admin \
    -e POSTGRES_USER=admin \
    -e POSTGRES_DB=splinter postgres
```

Add the following `registry.yaml` file. Keys will need to be updated with
the generated `gridd.pub`:

```
---
- identity: "alpha-node-000"
  endpoints:
    - "tcps://0.0.0.0:8044"
  display_name: "Alpha Node"
  keys:
    - 024faabf8a58522c41c2cb0c1cb003aa7c9ff1ea734a54be402a7ea70cce01094ctest
  metadata:
    company: "Alpha Org"
- identity: "beta-node-000"
  endpoints:
    - "tcps://0.0.0.0:8045"
  display_name: "Beta Node"
  keys:
    - 024faabf8a58522c41c2cb0c1cb003aa7c9ff1ea734a54be402a7ea70cce01094ctest
  metadata:
    company: "Beta Org"
```

Setting up the Splinter daemon

```
$ cd splinter
$ export SPLINTER_HOME=$(pwd)/home/node1
$ splinter database migrate -C postgres://admin:admin@localhost:5432/splinter
$ splinter cert generate --skip
$ splinterd -vv \
    --registries file://registry.yaml \
    --rest-api-endpoint 127.0.0.1:8080 \
    --network-endpoints tcps://127.0.0.1:8044 \
    --advertised-endpoint tcps://127.0.0.1:8044 \
    --node-id alpha-node-000 \
    --service-endpoint tcp://127.0.0.1:8043 \
    --storage yaml \
    --enable-biome \
    --database postgres://admin:admin@localhost:5432/splinter \
    --tls-insecure
```

#### Setting up Splinter Node 2
In another terminal window set up the second node.

 Start docker postgres instance:

```
$ docker run -d -p 5433:5432 --name splinter-db-beta \
    -e POSTGRES_PASSWORD=admin \
    -e POSTGRES_USER=admin \
    -e POSTGRES_DB=splinter postgres
```

Setup second splinterd node:

```
$ cd splinter
$ export PATH=$PATH:$(pwd)/target/debug
$ export SPLINTER_HOME=$(pwd)/home/node2
$ splinter database migrate -C postgres://admin:admin@localhost:5433/splinter
$ splinter cert generate --skip
$ splinterd -vv \
    --registries file://registry.yaml \
    --rest-api-endpoint 127.0.0.1:8081 \
    --network-endpoints tcps://127.0.0.1:8045 \
    --advertised-endpoint tcps://127.0.0.1:8045 \
    --node-id beta-node-000 \
    --service-endpoint tcp://127.0.0.1:8046 \
    --storage yaml \
    --enable-biome \
    --database postgres://admin:admin@localhost:5433/splinter \
    --tls-insecure
```

#### Setting up Grid nodes

In another terminal window set up docker postgres instance:

```
$ docker run -d -p 5434:5432 --name grid-db-alpha \
    -e POSTGRES_PASSWORD=grid \
    -e POSTGRES_USER=grid \
    -e POSTGRES_DB=grid postgres
```

Setting up the Grid daemon:

```
$ cd grid
$ export PATH=$PATH:$(pwd)/target/debug
$ grid -vv database migrate -C postgres://grid:grid@localhost:5434/grid
$ gridd -vv -b localhost:8085 \
    --admin-key-dir /Users/$USER/.grid/keys/ \
    -C splinter:http://localhost:8080 \
    --database-url postgres://grid:grid@localhost:5434/grid
```

In another terminal start the second Grid daemon

```
$ export PATH=$PATH:$(pwd)/target/debug
$ docker run -d -p 5435:5432 --name grid-db-beta \
    -e POSTGRES_PASSWORD=grid \
    -e POSTGRES_USER=grid \
    -e POSTGRES_DB=grid postgres
$ grid -vv database migrate -C postgres://grid:grid@localhost:5435/grid
$ ​​gridd -vv -b localhost:8086  \
    --admin-key-dir /Users/$USER/.grid/keys/ \
    -C splinter:http://localhost:8081 \
    --database-url postgres://grid:grid@localhost:5435/grid
```

#### Create a Circuit

Run the following circuit proposal command:

```
$ splinter circuit propose \
    --node alpha-node-000::tcps://localhost:8044 \
    --node beta-node-000::tcps://localhost:8045 \
    --service gsAA::alpha-node-000 \
    --service gsBB::beta-node-000 \
    --service-type gsAA::scabbard \
    --service-type gsBB::scabbard \
    --management grid \
    --service-peer-group gsAA,gsBB \
    --service-arg gsAA::admin_keys=$(cat /Users/$USER/.grid/keys/gridd.pub) \
    --service-arg gsBB::admin_keys=$(cat /Users/$USER/.grid/keys/gridd.pub) \
    -k /Users/$USER/.grid/keys/gridd.priv -U http://0.0.0.0:8080


$ splinter circuit vote --accept \
    -k /Users/$USER/.grid/keys/gridd.priv -U http://0.0.0.0:8081 CIRCUIT_ID
```

You should see the following logs from the Grid daemons acknowledging event
receipts and the submission of the Grid smart contract transactions to Scabbard:

```
DEBUG [gridd::splinter::app_auth_handler] Received the event at 1639776361293
DEBUG [gridd::splinter::app_auth_handler] Received the event at 1639776374623
DEBUG [gridd::splinter::app_auth_handler] Received the event at 1639776374825
DEBUG [splinter::events::ws] starting: http://localhost:8080/scabbard/leTIw-TVTZq/gsAA/ws/subscribe
DEBUG [splinter::events::ws] response: Response { status: 101, version: HTTP/1.1, headers: {"transfer-encoding": "chunked", "connection": "upgrade", "upgrade": "websocket", "sec-websocket-accept": "qRuMdykMYGEyIrjwimgOGL79D68=", "date": "Fri, 17 Dec 2021 21:26:14 GMT"}, body: Body(Empty) }
DEBUG [scabbard::client] Submitting batches via http://localhost:8080/scabbard/leTIw-TVTZq/gsAA/batches
DEBUG [reqwest::connect] starting new connection: http://localhost:8080/
DEBUG [reqwest::async_impl::client] response '202 Accepted' for http://localhost:8080/scabbard/leTIw-TVTZq/gsAA/batches
DEBUG [scabbard::client] Checking batches via http://localhost:8080/scabbard/leTIw-TVTZq/gsAA/batch_statuses?ids=a204c443d2294a5e27e5446253b7f51e0af9054e22d39b29f73c55da9dc6ef482443e6771f758a99507a9b635aada34ed5de7078aac6cf87a00ba802bfa78663
DEBUG [reqwest::connect] starting new connection: http://localhost:8080/
DEBUG [gridd::event::db_handler] Received commit event: (0ffd32e26537d8b136aed7627fb78f1edb9142a8c4edec1ec251f0cb06d912fa1116b029b244fd86a6ac7c3336d9790f9638919f655106186df49f03ff59a1ac, leTIw-TVTZq::gsAA, #changes: 1)
DEBUG [reqwest::async_impl::client] response '200 OK' for http://localhost:8080/scabbard/leTIw-TVTZq/gsAA/batch_statuses?ids=a204c443d2294a5e27e5446253b7f51e0af9054e22d39b29f73c55da9dc6ef482443e6771f758a99507a9b635aada34ed5de7078aac6cf87a00ba802bfa78663&wait=10
INFO [gridd::event::db_handler] Received new commit 0ffd32e26537d8b136aed7627fb78f1edb9142a8c4edec1ec251f0cb06d912fa1116b029b244fd86a6ac7c3336d9790f9638919f655106186df49f03ff59a1ac
.
.
```

### Upgrade the 2nd Splinter Node to 0.6

Ctrl-C the running Splinter node. Checkout 0-6 branch and rebuild.

```
$ git stash
$ git checkout origin/0-6
$ cargo build
```

Add an `allow_keys` files to `home/node1/etc` and `home/node2/etc`. Add the
`gridd.pub` to this file.

You will see the Grid daemon trying to reconnect. You may need to restart the
Grid daemon if the rebuilding takes to long.

Then run the following commands to update and restart the Splinter node:

```
​​$ splinter database migrate -C postgres://admin:admin@localhost:5433/splinter
$ splinter upgrade -C postgres://admin:admin@localhost:5433/splinter
$ splinter keygen --system --skip
$ splinterd -vv \
    --registries file://registry.yaml \
    --rest-api-endpoint http://127.0.0.1:8081 \
    --network-endpoints tcps://127.0.0.1:8045 \
    --advertised-endpoint tcps://127.0.0.1:8045 \
    --node-id beta-node-000 \
    --database postgres://admin:admin@localhost:5433/splinter \
    --scabbard-state lmdb \
    --enable-biome-credentials \
    --tls-insecure
```

If you stopped the Grid daemon, restart it. Otherwise wait until you see the
Grid daemon reconnect to the Splinter daemon. Upon reconnection you may see
the following error from re-receiving previously handled messages:

```
DEBUG [gridd::event::db_handler] Received commit event: (cf0b9b51dd2a878e0ec988ea4b806733d0d74af01ab6ffabc250312bd90fb5f97d326c1416f45f00e7a19d74d363f6b8b6fe1b35c4ccfbf79fd7c5df7507ad84, YbMIe-qGf84::gsBB, #changes: 1)
INFO [gridd::event::db_handler] Received new commit cf0b9b51dd2a878e0ec988ea4b806733d0d74af01ab6ffabc250312bd90fb5f97d326c1416f45f00e7a19d74d363f6b8b6fe1b35c4ccfbf79fd7c5df7507ad84
ERROR [gridd::splinter::run] Event Error: Unique constraint violated
```

### Submit a new circuit proposal to the updated node

To verify that the 0.6 Splinter node can still work with the 0.4 node, submit
the following 0.4 compatible circuit proposal.

```
$ splinter circuit propose \
    --url http://localhost:8081 \
    --compat 0.4 \
    --node alpha-node-000::tcps://localhost:8044 \
    --node beta-node-000::tcps://localhost:8045 \
    --service gsAA::alpha-node-000 \
    --service gsBB::beta-node-000 \
    --service-type gsAA::scabbard \
    --service-type gsBB::scabbard \
    --management grid \
    --service-peer-group gsAA,gsBB \
    --service-arg gsAA::admin_keys="[\"$(cat /Users/$USER/.grid/keys/gridd.pub)\"]" \
    --service-arg gsBB::admin_keys="[\"$(cat /Users/$USER/.grid/keys/gridd.pub)\"]" \
    -k /Users/$USER/.grid/keys/gridd.priv
```

Verify both Grid daemons received an event:
```
DEBUG [gridd::splinter::app_auth_handler] Received the event at 1639685255225
```
### Upgrade the 1st Splinter Node to 0.6

Now upgrade the 1st Splinter node by stopping it and running the following
commands:

```
$ splinter database migrate -C postgres://admin:admin@localhost:5432/splinter
$ splinter upgrade -C postgres://admin:admin@localhost:5432/splinter
$ splinter keygen --system --skip
$ splinterd -vv \
    --registries file://registry.yaml \
    --rest-api-endpoint http://127.0.0.1:8080 \
    --network-endpoints tcps://127.0.0.1:8044 \
    --advertised-endpoint tcps://127.0.0.1:8044 \
    --node-id alpha-node-000 \
    --database postgres://admin:admin@localhost:5432/splinter \
    --scabbard-state lmdb \
    --enable-biome-credentials \
    --tls-insecure
```

### Accept pending proposal

```
$ splinter circuit proposals \
    -k /Users/$USER/.grid/keys/gridd.priv -U http://0.0.0.0:8080
$ splinter circuit vote --accept \
    -k /Users/$USER/.grid/keys/gridd.priv -U http://0.0.0.0:8080 CIRCUIT_ID
```

You should now be able to submit Grid transactions to both circuits.
