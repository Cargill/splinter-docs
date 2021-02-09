# Error Handling in libsplinter

<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

This document provides best practice guidelines for error handling and error
definition in libsplinter. These practices may also be useful in other contexts.

## Motivation

As libsplinter has grown, the number of techniques used to represent and handle
errors has varied from module to module. These various techniques have a number
of shortcomings.

Without a standardized methodology for representing and handling errors, the
expectation for how errors should be defined has been unclear. This has
complicated the development process. By providing specific guidelines and
examples, this document will make clear expectations for how new errors should
look and behave. This will help streamline the development process.

Many of the existing errors in libsplinter provide inconsistent details and are
not displayed in a standard way. This results in an API that is not
user-friendly, and sometimes leaks internal information that is not useful to
the library consumer. Standardized guidelines will make information consistent
for all errors.

Some error types (like internal errors or invalid argument errors) occur
throughout the library. These errors have been duplicated in each place they've
been used, which has created more work for developers. The same error may also
be implemented slightly differently in different components, which makes usage
inconsistent for library consumers. By providing a normalized set of common
errors to use throughout the library, there will be less work for library
developers and the API will be more friendly for both library consumers and end
users.

## Guide-level explanation

### The crate::error module

Many errors which occur can be captured by a relatively small set of reusable
errors. A few examples of reusable errors include:

* `ConstraintViolationError` - an error which occurs when a database constraint
  prevents an update from occurring
* `InternalError` - an error returned when a failure occurred within the
  function but the failure is due to an internal implementation detail of the
  function
* `InvalidArgumentError` - an error which occurs when an argument does not
  follow the guidelines for formatting defined in the API
* `InvalidStateError` - an error which occurs because an operation can't be
  completed because of the state of the underlying struct

When determining whether an error should be included in crate::error, the
primary concern is reusability -- does it apply across the codebase? The more
specific an error, the less likely it is to be a good fit for `crate::error`.

Errors in `crate::error` are always structs, and are intended to be used as-is or
in the context of a more complex error enum. In the case of the enum, the struct
should be included as one of the enum's items:

```rust
enum ComplexError {
    InternalError(InternalError),
    ...
}
```

Note that this means construction of the complex error will typically look
something like:

```rust
ComplexError::InternalError(InternalError::with_source(Box::new(source_err)))
```

Error enums may contain a mix of items from crate::error and custom errors.

### Creating custom errors

#### Field conventions

Custom errors, either in the form of structs or enum variants with fields, must
follow a set of conventions for their fields.  In the case of error messages
messages or source errors, these field names should use the standard names of
`message` or `source`, respectively.  The contents of these fields may be
`Option` values, as the use-case requires.

Additionally, fields specific to the error may be added. These fields should
either be used for generating an error message or to guide action on the part of
the error receiver.  If a field is not used for either of these things, it may
not provide any value.

For example, an error produced by parsing a string into a struct may include a
message about the parse failure, as well as fields describing the error's
position in the original string, such as `row` and `column`. This error may not
require a source error. In this example, the row and column should be part of
the formatted display string.

For an example of an error that guides action on the part of the caller, an
error produced by connecting to a network resource may indicate that the
resource is unavailable.  This may provide a field that indicates the reason the
resource is unavailable: connection refused, timeout, and the like.  Some of the
reasons allow the caller to retry, others may require to propagate an error.

#### Constructor conventions

When defining a error struct, the constructor names should follow the following
convention:

If there is only one constructor, `new()` can be used (even if it takes
arguments) instead of using from and with. However, `new()` should not be used
if there are multiple constructors.

If the constructor takes a source error, then it should start with `from_source`
and the first argument should be the source error.

If the constructor takes additional arguments, the constructor's name should use
`with_argname`. For example, if one of the arguments was column, use
`with_column`.  If the argument is long, it is okay to use a shorter version of
it in the constructor. For example, if the argument is `retry_duration_hint`, it
is acceptable to use `with_hint` as long as it's reasonably clear.

If the constructor takes multiple additional arguments, separate them with
"and". For example, if the constructor takes row and column arguments, the
constructor would be `with_row_and_column`.

Examples of correct constructor names:

* `from_source(source)`
* `from_source_with_row(source, row)`
* `from_source_with_row_and_column(source, row, column)`
* `with_row(row)`
* `with_row_and_column(row, column)`
* `new()`
* `new(source)`
* `new(source, row, column)`

Note that "new" examples above are only correct if there is only a single
constructor.

Examples of incorrect constructor names:

* `with_source(source)` - always use from_ with source errors
* `from_source_with_row_with_column(source, row, column)` - use "and" between
  multiple arguments
* `with_row_from_source(row, source)` - `from_source` must always come first
* `from_source_with_row(row, source)` - argument order does not match function
  name
* `with_row_and_column(column, row)` - argument order does not match function
  name

### How to handle Display

Scenarios:

* There is no source Error and fmt() should write a string describing the Error
  (Common.)
* There is no source Error and fmt() should write a string with the type of
  MyError (Probably rare.)
* There is a source Error and fmt() should write a string which describes
  MyError without using the Display of the source Error (Highly desirable
  approach.)
* There is a source Error and fmt() should write a string of the format "X: Y"
  where X is a prefix added by MyError and Y is from the Display implemented for
  the source Error (This is currently the most common.)
* There is a source Error and fmt() should write the same string as used in the
  source Error's Display without modification. (Desirable approach.)

#### Rules for fmt

* Assume that the string being written may be embedded in another string, either
  with a prefix or potentially a suffix. Complex form being something like "Some
  error text: Embedded error: /some/path/filename".
* Assume that the string will potentially be prefixed "X: Y".
* Assume that the string will potentially be suffixed "Y: Z". Never end the
  string with punctuation as that interferes with this format.
* Always begin the error string with a capital letter.
* Always assume the message will be shown to the end user in a log or dialog
  box.
* When adding context, be specific but don't include sensitive information.
* When it can be avoided, do not include references to code. Assume the user
  does not understand or have access to the source code. Do not say "Error in
  AdminStore" or "Error in admin store" if an end-user is not aware of what an
  "admin store" is. (There are low-level exceptions to this rule, obviously,
  like locking error messages.)

#### The chaining problem

Much of the early splinter codebase used a pattern for implementing
`Display::fmt` for errors that included a source error as essentially:

```rust
format!(f, "{}: {}", self.message, self.source)
```

This pattern was replicated up the call stack, which resulted in growing strings
of successive lower-level error messages.  As a result, the messages that are
finally logged from the highest levels are very difficult to read by the user,
as well as they include too much low-level information, much of which is not
actionable.  The long length of the messages are also difficult to read due
either large amounts of scrolling or line-wrapping.

The value of this information is even dubious as a debugging tool for the
developer, as there may be multiple avenues for a particular error with this
format from a block of code.  It is a poor substitute for a stack trace.

# Reference-level explanation

## How to construct a new error type

Constructing new, custom error types should follow a set of questions, whose
answers will provide guidance for the next question to answer, until arriving at
an error design.

### Does the error need to describe a variety of possible error conditions?

If so, this error should be written as an `enum`, in order to support the
variant error conditions.

If not, this error should be written as a struct, which should provide all
the information required to describe the error condition.

#### If it is a enum ...

##### What error conditions should be enumerated?

Make this as small a list as practical to get the functionality desired. For
example, reduce errors to reusable errors like `InternalError` if possible.

##### What fields should each variant have?

For the variants that don't wrap an existing reusable error, the fields should
follow the conventions for struct fields.

##### How should Display be implemented?

Each variant should follow the rules on `Display` format, based on the contents
of the variant.

##### Should Debug be derived or implemented?

The preference should be to derive `Debug`.

However, if there is special consideration to be made, such as omitting optional
fields, the implementer should make use of the `std::fmt::Formatter` struct's
debug builders, instead of using the `format!`.  Using these builders respects
either format directives of `{:?}` (debug) or `{:#?}` (pretty-print debug).

##### Determine what tests are needed

Test all variants of `Display`.

If `Debug` is implemented, test all variants of `Debug`.

#### If it is a struct ...

##### Does it need a source field? Is it optional?

Include the source if the custom error is translating an error from an
underlying system.  If there is a source error in only some cases, make this
field optional.

##### Does it need a message field?

In the custom case, a message may add more context to the error, however,
message fields should be avoided if the Display can be handled with other fields
present.

##### Does it need other fields?

The custom error may require other fields to describe the error condition.
These fields should include information that is very specific to the error that
has occurred.

For example, an error describing a parsing issue may include row and column
fields to specify the starting point of the error in the input string.

An example from the `splinter::error` module, `ConstraintViolationError` has a
`ConstraintViolationType` field.

##### What constructors are needed?

This is basically "what combination of fields are going to be set when creating
the error". `InternalError` is a complex example of this. Ideally it is a small
set of constructors.

##### How should the Display be constructed?

Additionally: Should it just pass through source? Does it use a message field?
Derived from a combination of other fields?

The struct should follow the rules on `Display` format, based on its contents.

##### Should we derive or implement Debug?

The preference should be to derive `Debug`.

However, if there is special consideration to be made, such as omitting optional
fields, the implementer should make use of the `std::fmt::Formatter` struct's
debug builders, instead of using the `format!`.  Using these builders respects
either format directives of `{:?}` (debug) or `{:#?}` (pretty-print debug).

##### Determine what tests are needed

Test all variants of `Display`.

If `Debug` is implemented, test all variants of `Debug`.

### Should the error go into crate::error?

This question only applies to structs.  The error has to be widely applicable
across the library.  The current set of errors, described below, should be
considered canonical examples for the "widely applicable" criterion.

## Struct examples

### Available Reusable Errors

* InternalError: An error which is returned for reasons internal to the
  function.
* InvalidStateError: An error returned when an operation cannot be completed
  because the state of the underlying struct is inconsistent.
* InvalidArgumentError: An error returned when an argument passed to a function
  does not conform to the expected format.
* ResourceTemporarilyUnavailableError: An error which is returned when an
  underlying resource is unavailable.
* ConstraintViolationError:  An error which is returned because of a database
  constraint violation.

### InternalError Example

An error which is returned for reasons internal to the function. This error is
produced when a failure occurs within the function but the failure is due to an
internal implementation detail of the function. This generally means that there
is no specific information which can be returned that would help the caller of
the function recover or otherwise take action.

```rust
pub struct InternalError {
    message: Option<String>,
    source: Option<Source>,
}

struct Source {
    prefix: Option<String>,
    source: Box<dyn error::Error>,
}
```

`InternalError` is made up of several optional components, as such it provides a
specific constructor for each configuration.

If `InternalError` is being returned because another underlying error occurred,
that error should be returned directly as a part of Source. If the error
provides adequate information on its own, the message in `InternalError` can be
left as None.

```rust
pub fn from_source(source: Box<dyn error::Error>) -> Self {
   ...
}
```

If there is an underlying source error, but the error output is vague and not
helpful, a message should be provided. This message will be what is displayed
instead of the source error.

```rust
pub fn from_source_with_message(source: Box<dyn error::Error>, message: String)
-> Self
{
   ...
}
```

However, if the error string is important but still needs to some additional
context, a prefix can be added to the `InternalError` and the display will look
like `format!("{}: {}", prefix  source)`.

```rust
pub fn from_source_with_prefix(source: Box<dyn error::Error>, prefix: String)
-> Self
{
   ...
}
```

If there was not an underlying error, only a message should be provided that
describes what went wrong.

```rust
pub fn with_message(message: String) -> Self {
   ...
}
```

All errors in libsplinter must implement `std::error::Error` and
`std::fmt::Display`.

```rust
impl error::Error for InternalError {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match &self.source {
            Some(s) => Some(s.source.as_ref()),
            None => None,
        }
    }
}

impl fmt::Display for InternalError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match &self.message {
            Some(m) => write!(f, "{}", m),
            None => match &self.source {
                Some(s) => match &s.prefix {
                    Some(p) => write!(f, "{}: {}", p, s.source),
                    None => write!(f, "{}", s.source),
                },
                None => write!(f, "{}", std::any::type_name::<InternalError>()),
            },
        }
    }
}
```

In more complicated error structs, it can also be useful to implement std::fmt::Debug

```rust
impl fmt::Debug for InternalError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut debug_struct = f.debug_struct("InternalError");

        if let Some(message) = &self.message {
            debug_struct.field("message", message);
        }

        if let Some(source) = &self.source {
            if let Some(prefix) = &source.prefix {
                debug_struct.field("prefix", prefix);
            }

            debug_struct.field("source", &source.source);
        }

        debug_struct.finish()
    }
}
```

## Enum Example

The `AdminServiceStoreError` is a recent example of converting an existing enum
to use the common errors and other best practices.  Prior to conversion (as of
commit
[b6beeb91e](https://github.com/Cargill/splinter/commit/b6beeb91e88caf9ff56de5b82339cd0e0d2b6798)),
the enum was defined as

```rust
// Represents AdminServiceStore errors
#[derive(Debug)]
pub enum AdminServiceStoreError {
    /// Represents CRUD operations failures
    OperationError {
        context: String,
        source: Option<Box<dyn Error>>,
    },
    /// Represents store query failures
    QueryError {
        context: String,
        source: Box<dyn Error>,
    },
    /// Represents general failures in the store
    StorageError {
        context: String,
        source: Option<Box<dyn Error>>,
    },
    /// Represents an issue connecting to the store
    ConnectionError(Box<dyn Error>),
    NotFoundError(String),
}
```

After replacing several of the variants with the common errors, the error now is
structured as

```rust
/// Represents AdminServiceStore errors
#[derive(Debug)]
pub enum AdminServiceStoreError {
    /// Represents errors internal to the function.
    InternalError(InternalError),
    /// Represents constraint violations on the database's definition
    ConstraintViolationError(ConstraintViolationError),
    /// Represents when the underlying resource is unavailable
    ResourceTemporarilyUnavailableError(ResourceTemporarilyUnavailableError),
    /// Represents when an operation cannot be completed because the state of
    /// the underlying struct is inconsistent.
    InvalidStateError(InvalidStateError),
}
```

The variants were converted as follows:

* `StorageError` and `QueryError` variants were replaced with `InternalError`.
  This is due to there being no action that can be taken by the caller when this
  occurs.
* `OperationError` was replaced with `ConstraintViolationError`.  This is due to
  its use covering inserts and updates.
* `ConnectionError` was replaced with `ResourceTemporarilyUnavailableError`.
  This error more accurately informs the caller about that state of the
  connection.
* `NotFoundError` was replaced with `InvalidStateError`.  The use of
  `NotFoundError` was to cover cases where a query was being made for a service
  in a non-existent circuit - i.e. an invalid state.

# Drawbacks

None.

# Alternatives

As this document describes a series of best practices for the Splinter project,
there are potentially innumerable alternatives. However, this set of best
practices has been adopted by the core team.

# Prior art

* The existing errors in Splinter
* Java standard library exceptions

# Unresolved questions

It remains to be determined how error sources should be displayed at runtime.
