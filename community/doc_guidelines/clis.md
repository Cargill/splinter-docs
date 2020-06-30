# CLI Help Guidelines

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Use these guidelines for Splinter command usage statements (the output of `-h`
and `--help`).

## General

* Keep the usage statement as short as possible. Put more extensive information
  on the man page.

* Use the term "CLI" (command line interface) only for the general interface as
  a whole. Each item is a command or subcommand. For example:

  - The `splinterd` CLI lets you configure and run the Splinter daemon from the
   command line.

  - Use the `splinter keygen` command to generate user keys.
    <br><br>

* If you choose to say "command line interface", always use the full term
  (don't omit "interface").

* Avoid starting a sentence with a word that is normally lowercase. For example,
  change "splinterd" to "Splinter daemon".

* Follow the [Splinter capitalization guidelines](capitalization.md).

## Description Section

* Briefly describe the command (what it does and why someone would use it).

* Start the description with a capital letter (noun, verb, or adjective).
  Do not start with "A", "An", or "The".

* If the summary starts with a verb, use the 3rd-person singular (add an
  "s"). For example: "Displays", "Manages", "Checks".

* Do not add a period at the end of the description.

## FLAGS and OPTIONS Sections

* Note this terminology:
  - A _flag_ occurs alone (without an argument). Do not use the term "switch".
  - An _option_ has at least one _argument_.
  - For equivalent items in the configuration file, use the term "configuration
    setting" or "setting".
    <br><br>

* For flags, start the description with a verb in the 3rd-person singular
  ("Generates", "Checks").

* For options, start with a verb (as above) or a noun that describes the
  action of the option.

* For an argument without a preceding option, start the description with a noun;
  for example: "Name of the whatsit", "Path to the thingamabob", "Maximum value
  for the doohickey".

* Keep the description very short. Use partial sentences and eliminate all
  unnecessary words.

  Use the "`after_help`" section for additional information that is critical for
  using the option or flag. The man page can include more information.

* Provide the default value, if one exists. For example, "(default: 60
  seconds)". For flags, explain the default behavior (what happens if the flag
  is not used).

* If space allows, provide other key information such as value ranges, limits
  or requirements, or related environment variables and configuration settings.

For more information, see Google's developer documentation style guide for
[documenting command-line
syntax](https://developers.google.com/style/code-syntax)
and [command-line
terminology](https://developers.google.com/style/command-line-terminology).
