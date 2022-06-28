# Artifact and ArtifactStore

## Artifact

`Artifact` is a marker trait that signals a set of requirements on an artifact
produced by the `Publisher` or validated by `ArtifactValidator`.  These values
do need to be passed across thread boundaries.

```rust
trait Artifact: Clone + Send {
    type Identifier: ?Sized;

    fn artifact_id(&self) -> &Self::Identifier;
}
```

## ArtifactStore

The `ArtifactStore` should provide a way to save and load the artifact based on
an identifier.  This identifier is recommended to be a hash or signature of the
artifact.

The `ArtifactStore` should support being used both on its own, or within a
`StoreCommand` (i.e. within an existing database transaction).

```rust
trait ArtifactStore {
       type Artifact: Artifact;

    /// Save an artifact to the store, with a given artifact identifier
    fn create_artifact(&self, artifact: Self::Artifact)
        -> Result<(), StoreError>;

    /// Return an artifact for the given identifier, if it exists
    fn get_artifact(&self, identifier: &<Self as Artifact>::Identifier)
        -> Result<Option<Self::Artifact>, StoreError>;

    // Delete the artifact, if it is unreferenced.
    fn delete_if_unref_artifact(
        &self,
        identifier: &<Self as Artifact>::Identifier
    ) -> Result<(), StoreError>;
}
```

Commands are generated via a `StoreCommand` generator

```
trait ArtifactStoreCommandGenerator {
    type Artifact: Artifact;
    type Context;

    fn create_artifact_command(&self, artifact: Self::Artifact)
        -> Box<dyn StoreCommand<Context = Self::Context>>;
}
```

### StoreError

This design also references a general store error, made up of the following
variants:

```rust
pub enum StoreError {
    Internal(InternalError),
    ConstraintViolation(ConstraintViolationError),
    ResourceTemporarilyUnavailable(ResourceTemporarilyUnavailableError),
}
```

The intent of this error is to be used by all future stores as a replacement for
identical, store-specific errors.
