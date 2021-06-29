# Installing Splinter on Ubuntu

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

In this short tutorial, you’ll install the Splinter daemon, become acquainted
with its configuration files, learn how to start and stop splinterd and view
logs. At the end of the guide you'll have a Splinter node ready to create new
circuits with other existing nodes.

## Prerequisites

* This document assumes you have an Ubuntu Focal environment with sudo
permissions. Instructions focusing on docker can be found at
[configuring splinter nodes with docker][splinterdocker].

* Before getting started, it's recommended to read through the
[Planning a Splinter Deployment][splinterplanning] and
[Hosting a Splinter Node][splinterhosting] guides.

## Procedure

1. Install Splinter

   Open a terminal window. Download the Splinter repo's key and add the
   repository as an apt source.

   ```console
   $ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys --recv-keys B1DF8C00ACEB5855
   $ sudo add-apt-repository "deb [arch=amd64] http://repo.splinter.dev/ubuntu/extraball focal stable"
   ```

   Install `splinter-cli` and `splinter-daemon`.

   ```console
   $ sudo apt install -yq splinter-cli splinter-daemon
   ```

   Check that `splinter` and `splinterd` were installed successfully.

   ```console
   $ splinter --version
   splinter-cli 0.5.x
   $ splinterd --version
   splinterd 0.5.x
   ```

1. Generate certificates

   Use the `splinter` command to generate certificates.

   ```console
   $ sudo splinter cert generate
   Writing file: /etc/splinter/certs/generated_ca.pem
   Writing file: /etc/splinter/certs/private/generated_ca.key
   Writing file: /etc/splinter/certs/client.crt
   Writing file: /etc/splinter/certs/private/client.key
   Writing file: /etc/splinter/certs/server.crt
   Writing file: /etc/splinter/certs/private/server.key
   ```

   Next, create a `ca.pem` file. Splinterd will not start without at least one
   valid certificate in the `ca.pem` file. Since we don't have any peers yet, an
   example certificate is provided below as a workaround for this guide only.
   In a real-world scenario, this file should be populated with the contents of
   the `generated_ca.pem` from each of your peers. Detailed information about
   Splinter certificates can be found on the
   [Splinter Certificates page][splintercerts].

   ```console
   $ sudo vi /etc/splinter/certs/ca.pem
   ```

   Paste the example certificate.

   ```console
   # Example only, do not use in production.
   -----BEGIN CERTIFICATE-----
   MIICyTCCAbGgAwIBAgIBADANBgkqhkiG9w0BAQsFADAXMRUwEwYDVQQDDAxnZW5l
   cmF0ZWRfY2EwHhcNMjEwNjI0MTk0MjM5WhcNMjIwNjI0MTk0MjM5WjAXMRUwEwYD
   VQQDDAxnZW5lcmF0ZWRfY2EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
   AQDgR/Yj6SJbh/VFC76v+JwiB59ehsNsCu4Hp2jVrDEEyi2b5BHsRFDbNbLsjj5t
   mfQ5sbv34xsIweN+kqZwLL1XcEDFBygx1Aa+kB4ZkzJqu1Amz4D3k8Ak29d1izA4
   k5/UHzunUd9klL9DceYVqRYGpN//dqf9PohLZZ76tvGWdnxZlY0mFP1SdsklgG97
   zxDjRTjpGfLgJSrmvl3jyf/bqjsKKaKr+Rr+b+zys+hDO+py+M5wQ23VQpeyoTYD
   2cVp6yurUyImbg83YPgAfBkHutlGA1ShWdYJNXUckI/bf+HO5wJihJc3PVeES5pT
   Bv+9gtp/bcRDqQewN1lsJostAgMBAAGjIDAeMA8GA1UdEwEB/wQFMAMBAf8wCwYD
   VR0PBAQDAgIEMA0GCSqGSIb3DQEBCwUAA4IBAQA02LBE4hO3U/YxQNIlkUmqjQnS
   VfXk6rxHkAwClukmGtvTocBaIzPCB2ljpFpU0FhXgnWBAwgOY7lt3PIs+WY8Hb1l
   DAIKNiZO7X7ahqwP8o/MVg60IR7hGeIN51NxU0XIUWfqPP3civQpi6ZicGCOmM3+
   CF0s6k3TthiPCyKmadbS/zsf2EVXsLC9MH/hJznxZaWtxn3m0FB288QOR/DXWt0L
   AReGQk4fuFG7Lx/CU4MSn9ENi3AklWkN7Qrhzn3Q3mjQRpQc7Y4dy+bCjmXSV5e+
   7iHuMfoiAZ4ddwD5EHjbRzyuBaR1rzYdl8vmSVoT5S+nwLVVs1gh5coM24bA
   -----END CERTIFICATE-----
   ```

   Save the file and exit.

   Grant the `splinterd` group read rights.

   ```console
   $ sudo chown root:splinterd /etc/splinter/certs/ca.pem
   ```

1. Initialize the splinter database

   In this tutorial we'll be using SQLite but Splinter also supports Postgres.
   [Click here][splinterdatabase] for more information about configuring
   Splinter databases.

   The `splinter database migrate` command will create a Splinter database file
   and populate it with the necessary tables.

   ```console
   $ sudo -u splinterd splinter database migrate
   Running migrations against SQLite database: /var/lib/splinter/splinter_state.db
   Successfully applied SQLite migrations
   ```
   Verify that the db file was created with the correct permissions.

   ```console
   $ ls -al /var/lib/splinter/splinter_state.db
   -rw-r----- 1 splinterd splinterd 339968 Jun 22 19:25 /var/lib/splinter/splinter_state.db
   ```

1. Create a config file

   Copy the example config file into place. Make sure to include the `-p` flag
   or you'll encounter a `Permission denied` error when starting `splinterd`
   later.

   ```console
   $ sudo cp -p /etc/splinter/splinterd.toml.example /etc/splinter/splinterd.toml
   ```

   Open the new config file in your editor of choice.

   ```console
   $ sudo vi /etc/splinter/splinterd.toml
   ```

   Find and uncomment the `node_id` line. Add a short name to identify your
   node. It should look similar to the below.

   ```console
   ...
   # Identifier for this node. Must be unique on the network. This value will be
   # used to initialize a "node_id" file in the Splinter state directory. Once
   # node_id is created, the value in the configuration below must match the
   # contents of node_id. If they differ, splinterd will not start.
   node_id = "coolnewnode"
   ...
   ```
   Next, find and uncomment the `registries` line. This file doesn't exist yet,
   but we'll create it in a later step.

   ```console
   ...
   # Splinter Registry file
   registries = ["file:///etc/splinter/registry.yaml"]
   ...
   ```

   Save the file and exit.

1. Generate keys

   Splinter uses public/private keys to sign all transactions that affect
   shared state. We can easily generate them with the `splinter keygen`
   command. The key directory and key name default to the user running the
   command, so your output will look slightly different than below.

   ```console
   $ splinter keygen
   Writing private key file: /home/username/.cylinder/keys/username.priv
   writing public key file: /home/username/.cylinder/keys/username.pub
   ```

   If there will be multiple operators of this node, you may want to write
   the keys to a shared location that everyone has access to.

   ```console
   $ sudo splinter keygen --key-dir /foo/shared_dir shared_key
   Writing private key file: /foo/shared_dir/shared_key.priv
   writing public key file: /foo/shared_dir/shared_key.pub
   ```

   This keypair will be used as part of the identity of your Splinter node.
   It should be treated like a password and backed up securely. If you lose
   access to this key, you may lose access to data.

1. Create a registry file

   A Splinter registry (or just “registry”) is a list of nodes that can be
   browsed (and sometimes directly managed) by an administrator. We'll walk
   through creating a registry file containing the infromation for your new
   node. Later when you're creating a circuit with another administrator you
   can provide them with this file to add to their registry.

   Copy the example registry file into place. Copy the example registry file
   into place. Make sure to include the `-p` flag or you may encounter and
   error trying to start `splinterd`.

   ```console
   $ sudo cp -p /etc/splinter/registry.yaml.example /etc/splinter/registry.yaml
   ```

   Display the value of your public key. This will be used by other nodes to
   verify the identity of your node.

   ```console
   $ cat /home/username/.cylinder/keys/username.pub
   02381b606ac2bbe3bd374654cb7cb467ffb0225eb46038a5ec37b43e0c2f085dcb
   ```
   Make note of this value as we'll be using it in the next step.

   ```console
   $ sudo vi /etc/splinter/registry.yaml
   ```
   Delete the existing example registry information and add your node's
   information.

   ```console
   - identity: "coolnewnode"                 # Use the value of node_id in your config file
     endpoints:                              # At least one endpoint is required
       - "tcps://123.0.0.123:8044"           # The public address and port where your node will be available. Port 8044 is the default.
     display_name: "coolnewnode"    # Use the value of node_id in your config file
     keys:                                   # At least one key is required
       - "000000000000000000000000000000000" # Replace with your public key
     metadata:                               # Additional metadata. Can be empty.
       company: "Cool Corp"
   ```
   Save the file and exit.

   An in-depth walkthrough of the Splinter registry can be found
   [here][splinterregistry].

1. Start splinter

   ```console
   $ sudo systemctl start splinterd
   ```

   View the logs to see splinterd has started.

   ``` console
   $ sudo journalctl -u splinterd
   ```

1. Edit the systemd defaults file (optional)

   You can adjust the behavior of splinterd by adding flags or options to the
   systemd defaults file. A full list of splinterd options and flags can be
   found [here][splinterdman]. We'll increase the logging verbosity as an
   example.

   ```console
   $ sudo vi /etc/default/splinterd
   ```

   Uncomment the variable and add flags.

   ```console
   ...
   # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   # See the License for the specific language governing permissions and
   # limitations under the License.
   SPLINTERD_ARGS="-vv"
   ```

   Restart `splinterd` so the changes take effect.

   ```console
   $ sudo systemctl restart splinterd
   ```

   View the logs again.

   ```console
   $ sudo journalctl -u splinterd
   ```

   Notice that `splinterd` is logging `DEBUG` messages now.

   ```console
   Started Splinter Daemon.
   T[main] DEBUG [splinterd] Loading config toml file: "/etc/splinter/splinterd.toml"
   T[main] DEBUG [splinterd::transport] Using client certificate file: "/etc/splinter/certs/client.crt"
   T[main] DEBUG [splinterd::transport] Using client key file: "/etc/splinter/certs/private/client.key"
   T[main] DEBUG [splinterd::transport] Using server certificate file: "/etc/splinter/certs/server.crt"
   ...
   ```

## Troubleshooting

### Error occurred building config object

If you see `error occurred building config object: Permission denied
(os error 13):` error when starting splinterd, your config file has incorrect
permissions.

```console
ERROR [splinterd] Failed to start daemon, error occurred building config object: Permission denied (os error 13): /etc/splinter/splinterd.toml
```

Run `chown` to correct the permissions.

```console
$ ls -al /etc/splinter/splinterd.toml
-rw-r----- 1 root root 2104 Jun 22 22:02 /etc/splinter/splinterd.toml
$ sudo chown root:splinterd /etc/splinter/splinterd.toml
$ ls -al /etc/splinter/splinterd.toml
-rw-r----- 1 root splinterd 2104 Jun 22 22:02 /etc/splinter/splinterd.toml
```

### Failed to initialize store factory

```console
Failed to start daemon, unable to start the Splinter daemon: unable to set up storage: Failed to initialize store factory: Database file '/var/lib/splinter/splinter_state.db' does not exist
```
Run `splinter database migrate` to initialize a Splinter database.

### Failed to add read-only LocalYamlRegistry

```console
Failed to add read-only LocalYamlRegistry '/etc/splinter/registry.yaml': Failed to open YAML registry file
```
Permissions on your registry file may be incorrect. Run `chown` to correct the
permissions.

```console
-rw-r----- 1 root root 2104 Jun 22 22:02 /etc/splinter/registry.yaml
$ sudo chown root:splinterd /etc/splinter/registry.yaml
$ ls -al /etc/splinter/splinterd.toml
-rw-r----- 1 root splinterd 2104 Jun 22 22:02 /etc/splinter/registry.yaml
```

[splinterplanning]: https://www.splinter.dev/docs/0.5/howto/planning_splinter_deployment.html
"Planing a Splinter Deployment"

[splinterhosting]: https://www.splinter.dev/docs/0.5/howto/hosting_a_splinter_node.html
"Hosting a Splinter Node"

[splinterdocker]: https://www.splinter.dev/docs/0.5/tutorials/configuring_splinter_nodes.html
"Configuring Splinter nodes with Docker"

[splintercerts]: https://www.splinter.dev/docs/0.5/concepts/splinter_certificates.html
"Splinter Certificates"

[splinterdatabase]: https://www.splinter.dev/docs/0.5/howto/configure_database_storage.html
"Configuring Splinter Daemon Database"

[splinterregistry]: https://www.splinter.dev/docs/0.5/concepts/splinter_registry.html
"Splinter Registry"

[splinterdman]: https://www.splinter.dev/docs/0.5/references/cli/splinterd.1.html
"Splinter Daemon man page"
