# Documentation Guidelines for Rust APIs

<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

* Follow Splinter's [general documentation guidelines](general.md) and
  [capitalization guidelines](capitalization.md).

* Provide a crate-level overview (with `//!` comments) that summarizes the
  purpose of the crate.

* Include a module-level summary (with `//!` comments), using this guideline
  from [rustlang RFC
  1574](https://github.com/rust-lang/rfcs/blob/master/text/1574-more-api-documentation-conventions.md#module-level-vs-type-level-docs):

  "... module-level documentation should show a high-level summary of everything
  in the module, and each type should document itself fully. It is okay if
  there is some small amount of duplication here."

* For modules, traits, structs, etc., include a short summary sentence that
  starts with a noun instead of a verb. Don't repeat the module, trait, or
  struct name in the summary sentence. For example, say "Traits for ..." not
  "Contains traits for ...".

* For methods, include a short summary sentence that starts with a third-person
  singular verb ("Returns" instead of "Return"). Don't start with "This
  method"; instead, go straight to the verb.

* You can use Markdown to format doc comments (headings, lists, code, etc.) See
  these [rust-lang tips on using
  Markdown](https://github.com/rust-lang/rfcs/blob/master/text/1574-more-api-documentation-conventions.md#using-markdown-1).

* For doc comment basics, see _The Rust Book_, [Making Useful Documentation
  Comments](https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html#making-useful-documentation-comments).

* For more best practices, see the Google developer documentation style guide
  for advice on [API reference code
  comments](https://developers.google.com/style/api-reference-comments).
