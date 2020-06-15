<img alt="Splinter Logo"
     src="logos/svg/splinter_logos_fulllogo_gradientblack.svg"
     width="500">

# splinter-docs Repository

[Splinter](https://github.com/Cargill/splinter) is a privacy-focused platform
for distributed applications that provides a blockchain-inspired networking
environment for private communication and transactions between organizations.

This repository contains the source files for the
[splinter.dev website](https://www.splinter.dev/) and
[Splinter documentation](https://www.splinter.dev/docs/).

Splinter documentation and website content is written in
[GitHub Flavored Markdown](https://github.github.com/gfm/) (GFM).
For a quick reference, see this [Markdown
Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
from [adam-p/markdown-here](https://github.com/adam-p/markdown-here).

## Documentation Content

The `docs/` directory contains the source files for the Splinter documentation.
There is a subdirectory for each supported release of Splinter (such as `0.4`),
plus a subdirectory for the next planned release (for example, `0.5`). Under
each release subdirectory, the documentation is organized as follows:

  * `concepts/`: Topics that explain Splinter concepts, architecture, features,
    and other non-procedure information. File names should be noun phrases that
    reflect the topic title, using lower-case characters and underscores between
    words; for example, `biome_user_management.md` or `state_delta_export.md`.

  * `examples/`: Information on Splinter examples and demos.

  * `glossary/`: Definitions of Splinter terms in the file `glossary.md`.

  * `howto/`: Procedures for specific tasks such as configuring Splinter,
    setting permissions, or using a feature. File names should be verb phrases
    that reflect the topic title, using lower-case characters and underscores
    between words; for example, `building_splinter.md`
    or `creating_a_node_registry.md`.

  * `images/`: Graphics, pictures, diagrams, icons, and other images in the
    Splinter documentation. SVG format is preferred.

  * `references/`: Reference guides for Splinter.

  * `tutorials/`: In-depth, multi-section procedures for complex tasks,
    such as creating an application.

## Website Content

This repository includes tools for generating the website and publishing the
documentation, plus Markdown content in the following subdirectories:

* `community/`: Topics that describe how to participate in the Splinter
  community and contribute to the Splinter repositories.

* `releases/`: Release notes, upgrade guides, download links, and release
  management information.

## License

The Splinter documentation in the [docs](docs) subdirectory is licensed
under a Creative Commons Attribution 4.0 International License (CC BY 4.0).
You can obtain a copy of the license at
<http://creativecommons.org/licenses/by/4.0/>.

The Splinter documentation tools and associated content in this repository are
licensed under the [Apache License Version 2.0](LICENSE) software license.

## Code of Conduct

This project, like the general Splinter project, operates under the
[Cargill Code of
Conduct](https://github.com/Cargill/code-of-conduct/blob/master/code-of-conduct.md).
