# Using Circuit Templates

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

This guide explains how to use the `circuit-template` feature of Splinter,
including explaining the concept and format of a circuit template file and
how to use the `circuit-template` feature when developing an application.

## Overview

A circuit template contains a set of rules which partially define a new circuit.
Templates make circuit creation substantially easier, as only a minimal
amount of information needs be provided--the remainder is defined in the circuit
template.

Circuit templates can be used via the Splinter CLI. The
`splinter-circuit-template-*` commands list, show, and display further information
about selected templates. The `splinter-circuit-propose` command’s `template`
option utilizes a template to create a circuit proposal. Aside from the Splinter
CLI, templates may also be used to create a circuit within an application.
Splinter’s Gameroom example utilizes the `circuit-template` feature within the
Gameroom daemon. This document will cover examples of both scenarios.

## Template format
YAML is currently the only supported format for template files. The following is
an example circuit template YAML file used by the Gameroom application:

```yaml
version: v1
args:
    - name: ADMIN_KEYS
      required: false
      default: $(SIGNER_PUB_KEY)
      description: >-
        Public keys used to verify transactions in the scabbard service
    - name: NODES
      required: true
      description: "List of node IDs"
    - name: SIGNER_PUB_KEY
      required: false
      description: "Public key of the signer"
    - name: GAMEROOM_NAME
      required: true
      description: "Name of the gameroom"
rules:
    set-management-type:
        management-type: "gameroom"
    create-services:
        service-type: 'scabbard'
        service-args:
        - key: 'admin_keys'
          value: [$(ADMIN_KEYS)]
        - key: 'peer_services'
          value: '$(ALL_OTHER_SERVICES)'
        - key: 'version'
          value: '2'
        first-service: 'a000'
    set-metadata:
        encoding: json
        metadata:
            - key: "scabbard_admin_keys"
              value: ["$(ADMIN_KEYS)"]
            - key: "alias"
              value: "$(GAMEROOM_NAME)"
```

There are three main sections in a circuit template: `version`, `args`, and
`rules`.

### Version

This describes the version of the template being used. The template’s version
determines the available `rules`. The template rules are explained below.

### Args

The `args` section of the template shows the arguments used by the template's
rules. Each argument shows a description of the information that is required by
the circuit template's rules to fill in the circuit definition. A rule can
define the `name`, The following argument definition is from the example YAML
above:

```yaml
- name: SIGNER_PUB_KEY
  required: false
  description: "Public key of the signer"
```

This shows the definition of the `SIGNER_PUB_KEY` argument, which includes a
short description string and an indicator of whether or not the argument is
required. This argument will be assigned a value when the circuit is being
created.

The value of an argument may be used to fill in other necessary information
within the template. The value of an argument can be referred to using the
command substitution syntax, for example the `SIGNER_PUB_KEY` argument would
appear as `$(SIGNER_PUB_KEY)`. This syntax may be used when assigning the
`default` value of an argument. The following shows the definition of the
`ADMIN_KEYS` argument which uses the `SIGNER_PUB_KEY` argument as its default
value.

```yaml
- name: ADMIN_KEYS
  required: false
  default: $(SIGNER_PUB_KEY)
  description: >-
    Public keys used to verify transactions in the scabbard service
```

### Rules

Rules use the argument values for defining the circuit. The rules, therefore,
reflect the format of the circuit the template is intended for. The version of a
template determines the available rules.

#### Version 1.0 Available Rules
* `set-management-type`: This rule takes a single argument, `management-type`,
  and sets the circuit’s management type.
* `create-services`: This rule takes a `service-type`, `service-args` and
  `first-service` which are used to build the services included in a circuit.
* `set-metadata`: This rule takes a `metadata` and an `encoding` argument. The
  `encoding` argument supports `JSON`. The template uses this rule to set the
  circuit’s metadata, using the encoding specified.

#### Implementation

Rules within the template are backed by specific functions. These functions use
the argument values explained above. When writing a template, think of a rule as
a function signature. Rules show the function, in kebab case, along with their
required arguments. See the following:

```yaml
set-metadata:
      encoding: json
      metadata:
          - key: "scabbard_admin_keys"
            value: ["$(ADMIN_KEYS)"]
          - key: "alias"
            value: "$(GAMEROOM_NAME)"
```

This rule is associated with a function used to set the `metadata` field of the
`CreateCircuitBuilder`. The rule’s options allow for specifying the details
necessary for the function associated with the template rule to assign that
builder value. The `scabbard_admin_keys` key’s value is `[“$(ADMIN_KEYS)”]`,
which refers to the value assigned to the `ADMIN_KEYS` argument inserted into a
list. Similarly, the `alias` key would be assigned the value assigned to the
`GAMEROOM_NAME` argument value. This example also shows the `encoding` option,
which determines the encoding of the metadata being assigned to the builder.
Currently, the only supported option is JSON.

## Environment Variables

The `SPLINTER_CIRCUIT_TEMPLATE_PATH` environment variable can be used to specify
directories which contain template files, either while using the Splinter CLI or
developing an application. Regardless of whether `SPLINTER_CIRCUIT_TEMPLATE_PATH`
is set, the default directory, `/usr/share/splinter/circuit-templates/` is
checked when retrieving template files. The environment variable allows for
control over the template files being used.

Multiple directories may be specified in `SPLINTER_CIRCUIT_TEMPLATE_PATH`, with
paths delineated by `:`. If multiple storage directories are specified, the
directories are given the precedence as determined by their position in the list
of paths. For example, set the `SPLINTER_CIRCUIT_TEMPLATE_PATH` using the
following command:

``` console
$ export SPLINTER_CIRCUIT_TEMPLATE_PATH='foo:bar'
```

This affects the `splinter-circuit-template-list` and the rest of the
`splinter-circuit-template` commands. The list command will print out all YAML
files within the directories specified. However, when selecting a specific
template file in a command, unless the full path to the file is specified, the
first template file matching the name passed into the argument will be used in
the command. For example, there is a template file `foo/bar.yaml` and
`bar/bar.yaml`.

``` console
$ export SPLINTER_CIRCUIT_TEMPLATE_PATH='foo:bar'
$ splinter circuit template show bar
```

The following command will show the template found in the `foo` directory,
`foo/bar.yaml`. The full path to the template file must be specified if multiple
template files with the same name exist and the `SPLINTER_CIRCUIT_TEMPLATE_PATH`
variable is set.

## Prerequisites

* Verify the file paths for circuit template files and the value, if any,
  assigned to the `SPLINTER_CIRCUIT_TEMPLATE_PATH` environment variable. If this
  value is set, the directories specified will be searched in the order provided.
  Set the environment variable, or clear it to ensure the default circuit template
  storage directory, `/usr/share/splinter/circuit-templates`, is used.

## Using circuit templates in the Splinter CLI

The Splinter CLI offers the `splinter-circuit-template-*` commands that can be
used to list and display further information about circuit templates. The
`splinter-circuit-template-*` commands solely provide information about the
circuit templates found or specified. For example, the
`splinter-circuit-template-show` command displays a specific template.
Additionally, all of the template `arguments` may be displayed using the
`splinter-circuit-template-arguments` command. More information about the
`splinter-circuit-template-*` commands can be found in the circuit template
CLI
[reference]({% link docs/0.6/references/cli/splinter-circuit-template.1.md %}).

The template is put into action using the `splinter-circuit-propose` command’s
`template` option. The `template` option takes the template name and then uses
the template rules and arguments to create the circuit proposal. The following
example illustrates how to use a simple circuit template to propose a circuit.

Below is an example of a simple circuit template. This template only requires
the `SIGNER_PUB_KEY` argument and has rules to set the circuit’s management type
and services.

```yaml
version: v1
args:
    - name: NODES
      required: false
      description: "List of node IDs"
    - name: SIGNER_PUB_KEY
      required: true
      description: "Public key of the signer"
rules:
    set-management-type:
        management-type: "simple"
    create-services:
        service-type: ‘simple’
        first-service: ‘AA01’
        service-args:
        - key: 'admin_keys'
          value: [$(SIGNER_PUB_KEY)]
```

This template can be specified using the `template` option of the `propose`
command. The template arguments are set using the corresponding `template-arg`
option. If any required arguments are not set, the circuit proposal will not be
created and an error will be returned specifying the missing argument. While the
circuit template will complete the circuit proposal based on its rules and
arguments, any custom-set arguments using the `propose` command’s other options
will take precedence over the default template values. Any additional information
for the circuit proposal may also be included using the command’s other options.
More information on this command can be found in the circuit propose CLI
[reference]({% link docs/0.6/references/cli/splinter-circuit-propose.1.md %}).

> NOTE: Template files within Splinter are stored by default in
> `/usr/share/splinter/circuit-templates` unless the
> `SPLINTER_CIRCUIT_TEMPLATE_PATH` environment variable is set. If using a
> template file outside of the paths specified by this environment variable or
> the default directory, use the full path when specifying the `template` option
> to ensure the correct template file is used when proposing the circuit.

This command proposes a simple circuit with one other node using the `template`
option.

* The proposing node has ID alpha001 and endpoint tcps://splinterd-node-acme001:8044.
* The other node has ID beta001 and endpoint tcps://splinterd-node-beta001:8044.

```console
$ splinter circuit propose \
  --node alpha001::tcps://splinterd-node-alpha001:8044 \
  --node beta001::tcps://splinterd-node-beta001:8044 \
  --template simple.yaml \
  --template-arg SIGNER_PUB_KEY=PRIVATE-KEY-FILE \
  --url URL-of-splinterd-REST-API
```

If successful, this command will create a simple circuit proposal based on the
information gathered by the circuit template and the `node` arguments provided.

## Using circuit templates in Splinter applications

This example uses the circuit template file used in the Splinter Gameroom
application. The same concepts and procedures may be applied to any type of
circuit. The following example guides developers through the process of using a
circuit template file in an application.

1. First the template must be loaded, usually from a YAML file, to create a
   `CircuitCreateTemplate` object. All existing circuit template files use the
   YAML format. The following line shows how a template is loaded from the
   circuit template directory:

    ```rust
    let template = CircuitCreateTemplate::from_yaml_file("gameroom.yaml")?;
    ```

    > NOTE: All available circuit templates are packaged in the default circuit
    > template directory, `/usr/share/splinter/circuit-templates`. Unless the
    > `SPLINTER_CIRCUIT_TEMPLATE_PATH` is set, in which case all directories
    > specified using this environment variable are searched for the template
    >   files.

2. The args of the `CircuitCreateTemplate` object created in the step above
   must be set. Each entry in the args section of the circuit template holds
   further information on how the argument is used. For example, the `NODES`
   argument is described as follows in the circuit template:

    ```yaml
    name: NODES
          required: true
          description: "List of node IDs"
    ```

    This entry shows that the `NODES` argument is required and a short
    description. Therefore, if this argument is not set in the circuit template,
    the circuit template will not successfully create the builder objects. Some
    arguments have default values, this is shown in the `ADMIN_KEYS` argument
    entry in the circuit template file.

    ```yaml
    name: ADMIN_KEYS
          required: false
          default: SIGNER_PUB_KEY
          description: >-
            Public keys used to verify transactions in the scabbard service
    ```

    As this argument is not required, there is a default value applied if it is
    not provided. This default value is the value of the `signer_pub_key`
    argument. For the Gameroom circuit template, the `nodes` and `gameroom_name`
    are required to be set. To set these values:

    ```rust
    template.set_argument_value("nodes", &list_of_nodes)?;
    template.set_argument_value("gameroom_name", gameroom_alias)?;
    ```

    The `list_of_nodes` is a string with all circuit participants’ node ID
    separated by a comma. Similarly, the `gameroom_alias` value is also a string.
    The other arguments available to be set for the Gameroom circuit template
    are the `signer_pub_key`, which is the public key of the transaction signer
    represented by a string, and the `admin_keys`, are the admin keys used by
    the Scabbard service represented by a list of strings. These values are set
    similarly to the required values:

    ```rust
    template.set_argument_value("signer_pub_key", signer_public_key)?;
    template.set_argument_value("admin_keys", admin_key_list)?;
    ```

3. Once all of the required arguments have been set, the circuit template object
   may be applied to builder objects that are converted to the finalized object
   once all of the necessary circuit information is gathered. This is done as
   follows:

    ```rust
      let mut create_circuit_builder = CreateCircuitBuilder::new()
            .with_authorization_type(&AuthorizationType::Trust);

      create_circuit_builder = template
        .apply_to_builder(create_circuit_builder)?;
    ```

    The `create_circuit_builder` is a `CreateCircuitBuilder` which is
    used to compile the necessary information to propose a circuit.

    At this point, all of the rules are applied to the circuit template. This
    means that the builder is assigned values based on the rules using the
    values from the arguments. In the gameroom circuit template, this includes
    the `create-services`, `set-management-type`, and `set-metadata` rules.
    rules are predefined functions that use the values set for the template’s
    args that produce information necessary to fill in the blanks of the builder
    objects. The full functions used for these rules can be found within the
    `circuit::template::rules` module. The template entry for each rule also
    gives some information as to what the rule is actually doing.

    For example, the `set-metadata` rule sets the `metadata` field of the
    `CreateCircuitBuilder`. From the template:

    ```yaml
    set-metadata:
        encoding: json
        metadata:
            - key: "scabbard_admin_keys"
              value: ["$(ADMIN_KEYS)"]
            - key: "alias"
              value: "$(GAMEROOM_NAME)"
    ```

    From the template entry, we can see the encoding for the `metadata` is JSON.
    The value of the `metadata` field is represented by a map, a set of keys and
    values, as shown in the template. One key is `scabbard_admin_keys` which
    takes the value of the `admin_keys` template argument. The `gameroom_name`
    argument is assigned to the `alias` key.

    The `create_services` rule generates a `SplinterServiceBuilder` for each
    service involved in the circuit. For a circuit with two participating nodes,
    this rule would generate two `SplinterServiceBuilder` objects. A different
    type of service, besides Scabbard, may also be added to the circuit template
    YAML file by adding an entry under the `create_services` rule. The
    `create_services` rule on the Gameroom template generates Scabbard
    `SplinterServiceBuilder` objects, as `scabbard` is specified for the
    `service-type`. Similar to the `set-metadata` rule, this rule also
    creates a map to hold the `service-args` used to initialize the Scabbard
    instance.

    This rule includes the `admin_keys` in the `service-args` entry and a
    `peer_services` value. The `peer_services` key has a value,
    `$(ALL_OTHER_SERVICES)`, meaning this key is assigned the definition of the
    `peer_services` key.

    ```yaml
    create-services:
        service-type: 'scabbard'
        service-args:
        - key: 'admin_keys'
          value: [$(ADMIN_KEYS)]
        - key: 'peer_services'
          value: '$(ALL_OTHER_SERVICES)'
        first-service: 'a000'
    ```

    The list of `SplinterServiceBuilder` are then built and the resulting
    `SplinterServices` are added to the `CreateCircuitBuilder`'s `roster` field

4. After the builder has been updated for the `CircuitCreateTemplate`,
   any remaining information may be added to any of the builders. The Gameroom
   example includes filling in the `members` field of the `CreateCircuitBuilder`.

    Once a list of the members has been created, represented by a list of
    `SplinterNode` structs. A `SplinterNode` has a `node_id` field and an
    `endpoints` field. Assuming the list of `SplinterNode` objects has been
    created, and is called `members`, setting this value in the builder looks
    like the following line:

    ```rust
    create_circuit_builder.with_members(members);
    ```

5. At this point, all necessary information has been added to the
   `CreateCircuitBuilder` and it is ready to be turned into the `CreateCircuit`
   message.

    ```rust
    let create_circuit = create_circuit_builder.build()?;
    ```

This will result in a `CreateCircuit` object which holds all of the information
submitted to the circuit template and the builder objects.

## For More Information

 * Splinter `circuit-template` CLI commands:
[list]({% link docs/0.6/references/cli/splinter-circuit-template-list.1.md %}),
[show]({% link docs/0.6/references/cli/splinter-circuit-template-show.1.md %}),
[arguments]({% link docs/0.6/references/cli/splinter-circuit-template-arguments.1.md%})
