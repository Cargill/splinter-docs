# Documentation Guidelines for REST APIs

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

Use these guidelines for Splinter REST API (OpenAPI) documentation.

* Follow Splinter's [general documentation
  guidelines]({% link community/doc_guidelines/general.md %}) and
  [capitalization
  guidelines]({% link community/doc_guidelines/capitalization.md %}).

* Include both a summary and a description for each method (GET, POST, etc.).

    - For the method summary, use a very short phrase. Don't add final
      punctuation.

    - For the method description, use a full sentence that ends with a period.
      Feel free to use multiple sentences or a few paragraphs, if necessary.

    - For example:

    ```
    summary: Lists all doohickeys
    description: Fetches a list of doohickeys for the thingamajig.
    ```

    <br>

* Use consistent wording for the HTTP verbs. For example:

  Start a GET summary with a verb that ends with s:

    - "Lists" if the method returns a list.
    - "Gets" if it returns a non-binary value.
    - "Checks" if it returns a binary value.
      <br><br>

  Start a GET description with a different verb that ends with s:

    - "Fetches a list" if the method returns a list.
    - "Returns ..." if it returns a non-binary value.
    - "Verifies" if it returns a binary value.
      <br><br>

* For more guidelines:

    - See [swagger.io's best practices in API
      documentation](https://swagger.io/blog/api-documentation/best-practices-in-api-documentation/).
      Scroll to the subheading "Best Practices in API Documentation" for
      specific tips and good examples.

    - For JavaScript, use [Google's guide for JavaScript
      comments](https://google.github.io/styleguide/javascriptguide.xml?showone=Comments#Comments).

    - Go beyond the basics: Provide an overview, a getting started guide, a full
      description of the request-response cycle, and links to SDKs and code
      libraries. See [API Documentation Beyond the Basic Swagger
      UI](https://swagger.io/blog/api-documentation/api-documentation-swagger-ui/?_ga=2.209731477.1836894774.1573571713-89176856.1571850339).

    - See this example: [Surfreport API documentation
      (idratherbewriting)](https://idratherbewriting.com/learnapidoc/docapis_finished_doc_result.html).
