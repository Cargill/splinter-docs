---
tags: [Mermaid]
mermaid: true
---

# Scribe for Scabbard v0.7

<!--
  Copyright 2018-2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

The scribe component is part of the new service API that will be used in
Scabbard v0.7. This component will create and execute commands derived from an
artifact.

## Guide-level explanation

The diagram below shows the sequence of a coordinator creating a new scribe
instance and giving it an artifact to interpret and store in the database. 

The scribe component includes an `ArtifactStoreCommandGenerator`, this generator
will produce the following types of `StoreCommands`: prepare, commit, and
rollback. The prepare `StoreCommand`, when executed, will store the related data
in the database in a staged state. The commit `StoreCommand` will commit
prepared data, putting it in an active state. The rollback `StoreCommand` will
delete uncommitted data from the database.

 <div class="mermaid">
sequenceDiagram
    participant c as coordinator
    participant S as Scribe
    participant A as ArtifactStoreCommandGenerator
    participant SCE as StoreCommandExecutor
    rect rgb(192, 192, 192)
    Note right of c: New Scribe is created
    c ->>+ S: new(ArtifactStoreCommandGenerator)
    S -->>- c: Result<Scribe, Err>
    end
    rect rgb(192, 192, 192)
    Note right of c: Scribe prepares data
    c ->> S: prepare(Scope, Artifact, StoreCommands)
    activate S
    S ->>+ A: get_prepare_command(Artifact)
    Note right of A: PrepareCommand implements<br/>StoreCommand
    A -->>- S: Result<PrepareCommand, Err>
    S ->>+ StoreCommandExecutor: execute(StoreCommands)
    StoreCommandExecutor -->>- S: Result<(), Err>
    S -->> c: Result<(), Err>
    end
    rect rgb(192, 192, 192)
    Note right of c: Scribe commits prepared data
    c ->> S: commit(Scope, StoreCommands)
    S ->>+ A: get_commit_command()
    Note right of A: CommitCommand implements<br/>StoreCommand
    A -->>- S: Result<CommitCommand, Err>
    Note right of A: A dry run is performed<br/>before CommitCommand is executed
    S ->>+ StoreCommandExecutor: execute(StoreCommands)
    StoreCommandExecutor -->>- S: Result<(), Err>
    S -->> c: Result<(), Err>
    deactivate S
    end
</div>
