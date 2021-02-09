# Canopy 0.2
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

The goal of Canopy is to provide a container for saplings - custom client and
server applications for Splinter application - and system-like calls for things
like users and private keys.

The current architecture of Canopy allows for only a single sapling to reside in
the container at any point in time which requires a refresh of the page to
switch to alternate saplings.  Additionally, it leaves it to the sapling to
install itself into the container (described as "mounting").  This creates a set
of issues around installing new saplings at run-time, as well as introduces a
number of issues with state management for the existing saplings.

This design introduces a new system where Canopy controls the life-cycle of
saplings and can install or remove saplings at run-time.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

This new design for Canopy introduces new concepts and configurations: a new
model for describing saplings, a new way to install/launch saplings, and an
intent system for communicating between saplings. It also removes prior
distinction between user saplings and configuration saplings.

![]({% link images/canopy_0.2_overview.svg %} "Canopy 0.2 overview")

### Intent system
[intent-sys-guide-level]: #intent-sys-guide-level

Much of what will power canopy is the intent system.  This system is a
specialized event/messaging system.  The events consist of the event name and an
object that contains arbitrary data relative to that event.  The arbitrary
intent data may be merged with canopy data, depending on the type of intent.

### Sapling descriptors
[sapling-desc-guide-level]: #sapling-desc-guide-level

Saplings will be described by a manifest that contains details about an
installer script and a set of core scripts. These manifests may be given to
canopy in a list of currently enabled saplings during initialization, or one at
a time, as new saplings are installed at run-time.

### Installing saplings
[sapling-install-guide-level]: #sapling-install-guide-level

When a sapling is installed using its manifest, canopy will call the function
declared within the manifest.  It will provide the installer function a subset
of the canopy system API to perform actions, such as adding navigation items,
configuring drop-down entries or scheduling background tasks.  They may also
perform standard JS tasks, such as starting web workers or service workers to
manage their own background tasks (though, these workers will not have access to
canopy system API functions).

The installer function is expected to be a quickly-executing function, and
should make no async calls that will block its completion.


### Launching saplings
[sapling-launch-guide-level]: #sapling-launch-guide-level

Saplings are launched when an intent they have registered for has been sent via
the canopy system API. It is up to the sapling's core code to decide what is
done with the given intent.  It may render code in the main canopy view area or
it may trigger a background operation.

Canopy will intercept all intents for a given sapling and ensure that the core
files have been loaded and installed, before the intent handler is run.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Intent system
[intent-sys-ref-level]: #intent-sys-ref-level

The intent system is modeled after loosely coupled application interactions
where applications can register to handle specific "intents". An intent can be
sent by one component, either Canopy itself or another sapling, and will be
handled by the registered sapling. Intents can be general requests that may be
handled by multiple saplings, where the actual executing sapling is chosen by
the user.

For example, a sapling may register for the intent `canopy::login` to provide
user authentication client behaviour.  This sapling would provide a set of UIs
and behaviours appropriate for its back-end service provider, be it Splinter
Biome, or OAuth, etc.

Canopy will have a set of common intents that saplings may register for.  The
current list is

* `canopy::login` - this intent is fired if a request to authenticate is made.

A intent handler is called with the following signature:

```javascript
function (intent, intentData) {
  // ...
}
```

Canopy will wrap these handlers and potentially inject values into the
`intentData` object provided above.

### Sapling descriptors
[sapling-desc-ref-level]: #sapling-desc-ref-level

The manifest for saplings changes from a declaration of what canopy can display
(icons, etc) to a more general declaration of details about a given sapling.
Beyond providing a name, version, and intent namespace (more on that below),
the files are divided into to main parts: the installer and the core files.

The installer is declared with a single source file.  This source file should
contain a light-weight javascript file that will install what it needs to
configure canopy to use the sapling. This file will be loaded after all
manifests have been read.

The core files include one or more sources, which defines and handles any
intents that the system has registered to use.  These files will not be loaded
immediately.

The following is an example of a manifest:

```json
{
  "manifestVersion": 1,
  "name": "Sapling 1",
  "version": 1,
  "intentNS": "sapling1"
  "installer": {
    "source": {
      "src": "https://example.com/sapling1-install.js",
      "hash": "<sha512 of src file>"
    },
    "installFn": "installSapling",
  },
  "core": {
    "sources": [
      {
        "src": "https://example.com/sapling1-core1.js",
        "hash": "<sha512 of src file>"
      }
      ...
    ]
  }
}
```

Multiple sapling manifests can be specified in an JSON array.


### Installing saplings
[sapling-install-ref-level]: #sapling-install-ref-level

Once a manifest is loaded by canopy, the system will load the installer src
file.  Canopy will   call the `installFn` value on the `window`.  This install
function will take a subset of the canopy system API that is relavent at install
time.

The API will include the following (all optional fields or arguments will be
prefixed with `?`):

* `registerIntentHandler(intent, handler)`

  This function registers an intent handler for the sapling.  The handler
  handler must take into account that the actual logic may not yet be loaded at
  the time of this call.

  More on the intent system below.

* `addNavIcon({iconImg, shortName, longName, intent, ?intentData})`

  This function adds an item to the navigation pane provided by canopy. The
  provided intent and its optional data will be emitted when the icon is
  clicked.

  All navigation items will have the following merged into the optionally
  provided intent data:

  ```javascript
  {
      // The root DOM node where content may be mounted.
      rootDomNode: <HTMLDomElement>,

      // The canopy system API.
      canopySystem: <CanopySystemAPI>,
  }
  ```

* `addMenuItem(menuName, {itemName, intent, ?intentdata, ?updatesUI})`

  This function adds an item to the drop-down menu provided by canopy. The
  provided intent and its optional data will be emitted when the icon is
  clicked.

  All menu items will have the following merged into the optionally provided
  intent data (with optionally available items prefixed with a `?`:

  ```javascript
  {
      // The canopy system API.
      canopySystem: <CanopySystemAPI>,

      // The root DOM node where content may be mounted, if the item is marked
      // as `updatesUI = true`
      ?rootDomNode: <HTMLDomElement>,
  }
  ```

* `scheduleBackgroundEffect({intent, ?intentData, interval, ?delay})`

  This function schedules an intent to be emitted periodically. If a delay is
  specified, the intent will not be fired until the delay has passed. If no
  delay is fired, it will begin in the next tick after all manifests have been
  installed.

While the install function for a sapling may  make async calls,  canopy will not
wait for the calls to complete before it moves on to the next sapling manifest.

### Launching saplings
[sapling-launch-ref-level]: #sapling-launch-ref-level

Saplings are launched on the first invocation of an intent handler.  At launch
time, the files specified in the `core` section of the manifest will be loaded.

This does mean that on first execution of an intent handler may experience some
loading delay.  All subsequent loads should be O(1).

The registered handler for the sapling will receive an object that has the
canopy system API.  In addition to the methods provided on installation, the
canopy system API has the following functions:

* `sendIntent(intent, ?intentData)`

  This function will send an intent that may be handled by any other sapling or
  core canopy handlers in the system.

* `getUser()`

  This function will return the current user details, if a user has been
  authenticated, undefined otherwise.

  The details of the user object returned is beyond the scope of this document.

* `setUser(user)`

  This function will set the current user details. This is useful for saplings
  that provide authentication services. A null or undefined user will unset the
  current user.

  The details of the user object expected is beyond the scope of this document.

* `getKeys()`

  This function will return the current array of signing keys for the
  authenticated user, undefined otherwise.

  The details of the keys value is beyond the scope of this document.

* `setKeys(keys)`

  This function will set the current array of signing keys for the
  authenticated user. A value of null or undefined for keys will unset the
  current keys.

  The details of the keys value is beyond the scope of this document.

## Drawbacks
[drawbacks]: #drawbacks

This design removes the sandboxed nature of the current canopy implementation.
In that iteration, when a sapling is loaded, the whole page is reloaded, in
order to effectively give it process isolation of its data.  The new system does
not make any serious effort to sandbox each saplings data.

This sandboxed model does have a number of limitations on how saplings may
interact with each other, as they have no ability to send data to other
saplings, nor does it allow for pluggable features like authentication
alternatives.

## Prior art
[prior-art]: #prior-art

The sapling concept is a continuation and improvement over what currently is
implemented in splinter-canopyjs and splinter-saplingjs.

In this model, saplings take on more of the behaviour of plugins in many common
systems. They don't drive canopy but are driven by it.

The intent system is inspired by Android.

## Unresolved questions
[unresolved]: #unresolved

This document does not address the following:

* Unloading saplings

  Saplings could be removed dynamically, and so this leaves open the question of
  how much needs to be unloaded from the running canopy state.
