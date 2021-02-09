# Splinter Capability Repository
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This design proposes a repository and all the surrounding tools and formats for
Splinter artifacts. These artifacts include saplings, smart contracts, and
capabilities distributions.

## Motivation
[motivation]: #motivation

Artifact repositories are a common method of distributing applications.  A
repository provides a well-known directory structure and index format for
hosting artifacts.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

This RFC references several new concepts, and provides details for the concepts
not previously specified elsewhere.  The new concepts proposed here are
Capabilities, repository layouts, and the tools to support both.  It also
highlights changes to several existing concepts, such as Smart Contracts and
Saplings.

### Capabilities

A Capability is a set of dependencies that make up a broader application.  These
dependencies include saplings and smart contracts.  They are akin to a
application distribution.  For example, a Grid Product Capability would include
the smart contracts required and the saplings that provide a web UI. Future
parts of the stack included in a capability manifest may include state delta
export and CLI WASM plugins.

### Manifests and Packaging

Each artifact in the repository will provide a manifest that describes its
name, version, and required dependencies (be those file dependencies or other
artifacts in the repository).  Manifests are specific to the artifact and
optimized for their target environment.

Likewise, artifacts will be packaged in a way that is optimized for their target
environment.

For example, a smart contract archive is a scar file.  This file is
bzip2-compressed and contains a manifest and the WASM smart contract.  The
manifest is a yaml file containing information about the smart contract, such as
name and version.  The target environment for the scar file is the Sawtooth
Sabre transaction handler via the Scabbard service.

### Repository Layout

The repository will be laid out in a static manner.  This choice is important,
as it supports hosting the repositories on services like Amazon S3.  This layout
will have at its root the major component divisions, with artifacts stored in a
directory matching the artifact. This directory will store all versions of the
artifact and a file with the SHA-512 hash of the artifact.

Depending on the component, there may be additional resources that have been
expanded out of the archive package.  For example, saplings may optionally
include preview images.  These images will be available directly in the
repository, so that client applications do not have to extract the entire
archive in order to preview the potential saplings.

The repository will include an index scheme that will provide mappings for
things such names or dependency relationships.

For example, the Grid Product, version 1.0, smart contract would be stored at

`/contracts/grid_product/grid_product-1.0.scar`

### Tools

Interacting with the capabilities repository requires a set of tools.  For
developers, these are for creating artifacts and their manifests, as well as
publishing artifacts to the repository.  For repository maintainers, tools
include removing artifacts and generating index files for the repository.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Manifest Formats

All the major components in the repository have a manifest describing their
name and version, as well as optional fields like description.

#### Saplings
The sapling manifest is a JSON file, as this is the format most readily
consumable by browsers

```json
{
  "manifestVersion": 1,
  "name": "grid-ui",
  "version": "<version>",
  "namespace": "grid",
  "description": "A description of the Grid UI Sapling",
  "installer": {
    "source": {
      "src": "path/in/sapling/archive/grid-ui-install.js",
      "hash": "<sha512 of src file>"
    },
    "installFn": "installSapling",
  },
  "core": {
    "sources": [
      {
        "src": "path/in/sapling/archive/grid-ui-core1.js",
        "hash": "<sha512 of src file>",
        "contentType": "application/javascript"
      }
      "and more..."
    ]
  }
}
```

#### Smart Contracts

Smart contract manifests follow the format defined by Sawtooth Sabre.  These
will be extended to include fields to support repository use.

```diff
 name: grid_product
+description: A description of the Grid Product Smart Contract.
 version: '1.0'
 inputs:
   - '621dee01'
   - '621dee02'
   - 'cad11d'
 outputs:
   - '621dee02'
```

#### Capabilities

A capability manifest describes a set of smart contracts and saplings.  These
are specified with the yaml file.  The following is a hypothetical
`grid-product.yaml` capability manifest:

```yaml
manifest-version: 1
name: "grid-product"
version: "1.0"
description: "A description of the Grid Product capabiliity"

dependencies:
  smart-contracts:
    - grid_schema: "<version>"
    - grid_product: "<version>"
  saplings:
    - grid-ui: "<version>"
  capabilities:
    # no dependent capabilities
```

Given the fact that each component type has different archive packaging
requirements, dependencies are separated by the major component level.  This
provides an unambiguous distinction between the packages for implementations
consuming the capability manifest format.

### Packaging

#### Saplings

Saplings and their assets are packaged in a compressed archive file, with a
`.sap` file extension.  The archives must follow the following format

```
.
./manifest.json
./install.js
./src/
./style/
./assets/
./preview
```

The `./src` directory contains all script files other than the installer.
These may be any script language, provided that they either a) run in the
browser natively (e.g. JavaScript or WASM) or b) provide a compiler/interpreter
written in either of the native options.

The `./style` directory contains all styling content, such as CSS files.  If
other forms of style documents are included, a compiler must be provided in the
scripts directory to convert it to CSS.

The `./assets` directory contains all other assets, such as images.

The `./preview` directory contains an optional set of screenshots of the
sapling.

The file is compressed using the `bzip2` compression algorithm.

#### Smart Contracts

Smart contract packaging follows the SCAR file format defined by Sawtooth Sabre.

#### Capabilities

Capabilities do not have a packaging format, as they reference other
dependencies.

### Repository Layout

A repository has the following static file layout, using the example manifests
to help provide context:

```
/capabilities
    /grid-product
        grid-product-1.0.yaml
        grid-product-1.0.sha
/contracts
    /grid_product
        grid_product-1.0.yaml
        grid_product-1.0.scar
        grid_product-1.0.sha
    /grid_schema
        grid_schema-1.0.yaml
        grid_schema-1.0.scar
        grid_schema-1.0.sha
/saplings
    /grid-ui
        grid-ui-1.0.json
        grid-ui-1.0.sap
        grid-ui-1.0.sha
```

### Repository Indexes

The indexes are provided in a bzip2-compressed json file available at the root
of the repository.  The index provides the versions available for a given
artifact, organized by major component. Using the example manifests above, the
following is an example index:

```json
{
    "capabilities": {
        "grid-product": {
            "1.0": {
                "location": "path/to/1.0",
                "description": "<grid description>"
            }
        }
    },
    "contracts": {
        "grid_product": {
            "1.0": {
                "location": "path/to/1.0",
                "description": "<grid product description>"
            }
        },
        "grid_schema": {
            "1.0": {
                "location": "path/to/1.0",
                "description": "<grid schema description>"
            }
        },
    },
    "saplings": {
        "grid-ui": {
            "1": {
                "location": "path/to/v1",
                "description": "<grid ui v1 description>"
            },
            "2": {
                "location": "path/to/v2",
                "description": "<grid ui v2 description>"
            }
        }
    },
}
```
### Tools

#### Saplings

Saplings require the most tools to be built for this purpose.

##### Development

As the majority of projects will be written in javascript using the NodeJS
platform, a tool for generating sapling projects is beneficial.  This tool would
generate a standard directory layout, matching the contents of the sapling
package file, but also including the base NodeJS files:

```
.
./package.json
./manifest.json
./install.js
./src/
./style/
./assets/
```

##### Packaging

The packaging tools will be supplied in the project template's `package.json`,
via `devDependencies`.  These scripts will build the bzip2 package for
publishing.  The user will be able to run

```
$ npm run sapling:package
```

#### Smart Contracts

Sabre contracts require no new tools beyond the existing scar file packaging
tool.

#### Repository

An administrator can move the binary to the location in the repository using a
publish tool.  This tool will also regenerate the indexes.

```
splinter-repo-publish
publish a splinter artifact to a repository.

USAGE:
    splinter-repo publish [OPTIONS] <artifact-type> <artifact-file>

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -d, --root-dir <directory>  The root directory of the repository
    -o, --output-dir <directory> The target directory for the generated indexes

ARGS
    <artifact-type>    The artifact type; one of "capability", "sapling" or "contract"
    <artifact-file>      The artifact file to publish.
```


Administrators will be allowed to generate the indexes for a repository.  An
administrator may manually add or remove files from the repository file tree,
and wish to regenerate the indexes.

```
splinter-repo-index
Regenerate the splinter repository indexes..

USAGE:
    splinter-repo index [OPTIONS]

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -d, --root-dir <directory>  The root directory of the repository
    -o, --output-dir <directory> The target directory for the generated indexes
```

This command will generate the `index.json` for the repository. The
`--output-dir` option allows the administrator to test the index before
publishing the file, if desired.

## Drawbacks
[drawbacks]: #drawbacks

There are several drawbacks to the current RFC.  The first relates to artifact
names and the second to the static file layout.

Some repository formats include a group id for the artifact.  This allows
similarly named items to exist across different organizations. With a single
name, it allows organizations to squat on a given name.  If another
organization forks a library, or develops in a similar space, they must rename
the library. This is not considered a hardship, as a name can use a variety of
divider characters, this is easily worked around with naming conventions.

The static file layout has the drawback that indexes may not be updated
immediately, as there is no database.  This can create a lag in times for
new artifacts (or new versions) to appear in queries based off of the indexes.
However, the benefits of hosting simplicity outweigh the need for immediacy of
index updates.

## Rationale and alternatives
[alternatives]: #alternatives

Other existing solutions have been explored, but they are designed specifically
for their domains.  The closest open solution that can host multiple artifact
types would be [Pulp](https://pulpproject.org/).  This is a general software
package server.  However, using pulp for splinter artifacts would require custom
plugin development to support the various artifact types, as well as would
require more infrastructure beyond a static web server.

## Prior art
[prior-art]: #prior-art

The following repository layouts were taken into consideration:

* [Debian repositories](https://wiki.debian.org/DebianRepository/Format)
* [Maven
  repositories](https://cwiki.apache.org/confluence/display/MAVENOLD/Repository+Layout+-+Final),
  [metadata](https://cwiki.apache.org/confluence/display/MAVENOLD/Repository+Metadata),
  and [indexes](https://maven.apache.org/repository/central-index.html)
* [Crates.io](https://github.com/rust-lang/crates.io)

## Unresolved questions
[unresolved]: #unresolved-questions

This design does not cover any advanced search or indexing features, such as
tags or content analysis.

Likewise, it assumes all publishing will currently be handled by the repository
administrator.  Dynamic publishing by developers is not supported.
