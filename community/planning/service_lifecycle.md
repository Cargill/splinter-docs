# Service Lifecycle

<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

Services need to implement a new trait to handle transitioning through the
service lifecycle, instead of implementing a `ServiceFactory` to be used by the
`ServiceOrchestrator`

## Motivation

The service API removes the requirement that every service will be run in its
own thread. This will allow for running more service and circuit on each
splinter node.

Since services will no longer be run in their own thread, they will not need to
be started and stopped as they are in Splinter 0.6. This document describes the
new way that a service will be transitioned from its different stages in the
service lifecycle.

## Guide-level Explanation

After a new circuit has been agreed upon, the new services need to be
configured. This will be done using a combination of service type specific
traits and an executor.

The `Lifecycle` trait provides `StoreCommands` to update the service type
specific state stored in a database as well as move the service through its
lifecycle. See [StoreCommand for
Scabbard v0.7](https://www.splinter.dev/community/planning/store_command_for_scabbard_v0.7.html)
for more information about `StoreCommands`.

### Lifecycle States

Currently, the state change is linear (e.i. no moving back to finalized once
retired). This could be changed in the future.

![Lifecycle of Service]({% link images/service_lifecycle.svg %} "Lifecycle of A
Service"){:.centered}

States:

- Prepared: The service is set up and ready to be finalized. The `TimerFilter`
  should not return this service, but can handle any messages it receives.
- Finalized: The service will handle all messages and can be returned from a
  `TimerFilter` to handle pending work.
- Retired: The service should no longer handle any messages and the
  `TimerFilter` should no longer return this service.
- Purged: The service and all of its associated state has been removed.

## Reference-level Explanation

### Lifecycle Trait

The following trait will be used by the `LifecycleExecutor` when updating the
status of a service. Each service type must implement their own version of the
`Lifecycle` trait.  The `Lifecycle` implementations will return `StoreCommand`
to update service state. The trait takes a generic `K` which represents the
Context that will be passed

```rust
pub trait Lifecycle<K> {
    type Arguments;

    fn command_to_prepare(
        &self,
        service: FullyQualifiedServiceId,
        arguments: Self::Arguments,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError>;

    fn command_to_finalize(
        &self,
        service: FullyQualifiedServiceId,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError>;

    fn command_to_retire(
        &self,
        service: FullyQualifiedServiceId,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError>;

    fn command_to_purge(
        &self,
        service: FullyQualifiedServiceId,
    ) -> Result<Box<dyn StoreCommand<Context = K>>, InternalError>;

    fn into_lifecycle<C, R>(
        self,
        converter: C
    ) -> IntoLifecycle<Self, C, Self::Arguments, R, K>
    where
        Self: Sized,
        C: ArgumentsConverter<Self::Arguments, R>,
    {
        IntoLifecycle::new(self, converter)
    }
}
```

There are 4 types of commands that can be used to update a service. A service
can be prepared, finalized, retired or purged. The first 3 commands result in an
updated status in the `Lifecycle` store along with any operations that are
specific for the service type, while purge should result in all service
information being removed. The `Lifecycle` will return a command that will be
combined with the lifecycle command and executed within the same transaction.

### LifecycleExecutor Struct

The `LifecycleExecutor` will operate very similarly to the `Timer`, where it
will periodically wake up and check for any pending work.  Other components,
such as the `SyncLifecycleInterface` discussed later, will write a pending
service to the `Lifecycle` store. The `LifecycleExecutor` will fetch the pending
services, find the `Lifecycle` for the service type and get a list of commands
that are required to update the service.

```rust
impl<E: 'static> LifecycleExecutor<E>
where
    E: StoreCommandExecutor + Send,
{
    pub fn new(
        wake_up_interval: Duration,
        lifecycles: LifecycleMap<E::Context>,
        store: Box<dyn LifecycleStore + Send>,
        command_generator: LifecycleCommandGenerator<E::Context>,
        command_executor: E,
    ) -> Result<LifecycleExecutor<E>, InternalError> {
      // omitted for brevity
    }
}
```

All commands, both service specific and lifecycle, will be atomically executed
by a `StoreCommandExecutor`.

While all pending service will eventually be handled by the executor, in some
cases waiting for the executor to be woken up by the `Pacemaker` is not ideal.
Instead, an `ExecutorAlarm` can be used to wake up the executor prematurely.

```rust
pub trait ExecutorAlarm: Send {
    fn wake_up_all(&self) -> Result<(), InternalError>;

    fn wake_up(
        &self,
        service_type: String,
        service_id: Option<FullyQualifiedServiceId>,
    ) -> Result<(), InternalError>;
}
```

The alarm can be used to check for all pending services, all services of a
specific type, or a specific service.

### Admin Service Integration

The `AdminService` is in charge of creating the services when a circuit has been
approved. In 0.6 this meant using the `ServiceOrchestrator` which would spin up
a new thread for each local service. Once the service has been started, an event
will be sent out to subscribers that the circuit is ready to be used.

The new design no longer starts up a thread per service and initialization is
not synchronous. The `AdminService` will need to stay backward compatible while
also supporting using the `LifecycleExecutor`.

### LifecycleDispatch

The `AdminService` will take a list of implementations of the
`LifecycleDispatch` trait instead of the `ServiceOrchestrator` directly. When a
service needs to be added, retired, or purged, each implementation will be
called. The implementations will check to see if it supports the service type
that is being updated, acting as a NO-OP if not. It is expected that service
type will only be handled by one implementation of the `LifecycleDispatch`.

```rust
pub trait LifecycleDispatch: Send {
    // prepare and finalize a service
    fn add_service(
        &self,
        circuit_id: &str,
        service_id: &str,
        service_type: &str,
        args: Vec<(String, String)>,
    ) -> Result<(), InternalError>;

    fn retire_service(
        &self,
        circuit_id: &str,
        service_id: &str,
        service_type: &str,
    ) -> Result<(), InternalError>;

    fn purge_service(
        &self,
        circuit_id: &str,
        service_id: &str,
        service_type: &str,
    ) -> Result<(), InternalError>;

    fn shutdown_all_services(&self) -> Result<(), InternalError>;

    fn add_stopped_service(
        &self,
        circuit_id: &str,
        service_id: &str,
        service_type: &str,
        args: HashMap<String, String>,
    ) -> Result<(), InternalError>;
}
```

The `ServiceOrchestrator` implements the trait directly.

### SyncLifecycleInterface

The `AdminService` expects service creation to be synchronous. To use the
asynchronous `LifecycleExecutor` the new `SyncLifecycleInterface` will be
written to implement a `LifecycleDispatch`.

```rust
impl SyncLifecycleInterface {
    pub fn new(
        store: Box<dyn LifecycleStore + Send>,
        alarm: Box<dyn ExecutorAlarm>,
        supported_types: Vec<String>,
        time_to_wait: time::Duration,
    ) -> Self {
        SyncLifecycleInterface {
            store,
            alarm,
            supported_types,
            time_to_wait,
        }
    }
}
```

For each service operation, `SyncLifecycleInterface` writes the pending service
to the `LifecycleStore` and then uses an `ExecutorAlarm` to wake up the executor
for the pending service. The interface will periodically check the lifecycle
store to see if the service has been updated by the executor, only returning to
when the service has been updated or a timeout has been reached.

![Lifecycle Integration Admin Service]({% link images/admin_lifecycle.svg %}
  "Lifecycle Integration with Admin Service"){:.centered}

Due to the difference in designs, two of the required methods on the
`LifecycleDispatch` are NO-OPs for the `SyncLifecycleInterface`. Services do not
need to be stopped and restarted on shutdown. Therefore `shutdown_all_services`
and `add_stopped_service` simply return `Ok(())`, same for if `add_service` is
called and if the service was already added.

`SyncLifecycleInterface` combines both `command_to_prepare` and
`command_to_finalize` to get the service into a "runnable" state.

## Drawbacks

The AdminService expects service start up to be synchronized and while
`SyncLifecycleInterface` achieves this, there is no guarantee that the service
will be updated in a timely manner. This may cause circuit proposals handling to
be blocked until the service times out.

## Rationale and Alternatives

In Splinter 0.6, a service was run in a separate thread and was controlled by
the `ServiceOrchestrator`. This model limits the number of services that can be
run on a node. It also requires that services be started and stopped on restart
of a Splinter node.

## Unresolved Questions

How to update service arguments when running in separate processes in an atomic
way is unknown.
