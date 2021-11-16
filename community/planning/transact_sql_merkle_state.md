# Transact Merkle State in SQL
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Overview

The current Database abstraction acts as a simple key-value store, where both
the keys and the values are arbitrary bytes. This does not allow for various
optimizations that can be made via more complicated SQL queries. Transact has
been updated to provide an implementation using several tables which will
accurately reflect the data and allow for those optimizations, where possible.

One such operation is made by representing the merkle radix tree nodes with an
array type for the children. This allows for the use of a recursive query to
find the complete node path of a given address/data pair.

Insertion, while still requiring the same number of records as the key-value
abstraction, can be done with bulk executions, thereby limiting the round trips
to and from the database.

## Database Tables

Each set of state roots are related by a tree name.  This is stored in a
`merkle_radix_tree` table:

```sql
CREATE TABLE IF NOT EXISTS merkle_radix_tree (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(512),
    UNIQUE(name)
);
```

Leaf data is maintained in its own table:

```sql
CREATE TABLE IF NOT EXISTS merkle_radix_leaf (
    id BIGSERIAL PRIMARY KEY,
    tree_id BIGINT NOT NULL,
    address VARCHAR(70) NOT NULL,
    data BYTEA,
    FOREIGN KEY(tree_id) REFERENCES merkle_radix_tree (id)
);
```

While this stores all the revisions of data for a given address, the order of
the data is maintained by the `merkle_radix_tree_node`. This table maintains the
structure of the tree, where each record is a node in the tree. Each state root
is also included in this table.

This table contains an array of the children for the given node, where the
contents of the array are the hash id of a child, or NULL if that branch does
not have any children.

Its complete structure is as follows:

```sql
CREATE TABLE IF NOT EXISTS merkle_radix_tree_node (
    hash VARCHAR(64) NOT NULL,
    tree_id BIGINT NOT NULL,
    leaf_id BIGINT,
    children VARCHAR(64)[],
    PRIMARY KEY (hash, tree_id),
    FOREIGN KEY(tree_id) REFERENCES merkle_radix_tree(id),
    FOREIGN KEY(leaf_id) REFERENCES merkle_radix_leaf(id)
);
```

Like the key-value implementation of MerkleState, additions and deletions are
recorded to support state pruning:

```sql
create TABLE IF NOT EXISTS merkle_radix_change_log_addition (
    id BIGSERIAL PRIMARY KEY,
    tree_id BIGINT NOT NULL,
    state_root VARCHAR(64) NOT NULL,
    parent_state_root VARCHAR(64),
    addition VARCHAR(64),
    FOREIGN KEY(state_root, tree_id)
        REFERENCES merkle_radix_tree_node(hash, tree_id),
    FOREIGN KEY(parent_state_root, tree_id)
        REFERENCES merkle_radix_tree_node(hash, tree_id),
    FOREIGN KEY(addition, tree_id)
        REFERENCES merkle_radix_tree_node(hash, tree_id)
);

create TABLE IF NOT EXISTS merkle_radix_change_log_deletion (
    id BIGSERIAL PRIMARY KEY,
    tree_id BIGINT NOT NULL,
    successor_state_root VARCHAR(64) NOT NULL,
    state_root VARCHAR(64) NOT NULL,
    deletion VARCHAR(64),
    FOREIGN KEY(successor_state_root, tree_id)
        REFERENCES merkle_radix_tree_node(hash, tree_id),
    FOREIGN KEY(state_root, tree_id)
        REFERENCES merkle_radix_tree_node(hash, tree_id),
    FOREIGN KEY(deletion, tree_id)
        REFERENCES merkle_radix_tree_node(hash, tree_id)
);
```

> All the tables listed here are specific to Postgres. The SQLite-specific
> tables are slightly different, in that any arrays are represented by JSON
> values.

## Querying a Tree

In the key-value implementation, an entry at an address is found by walking the
tree from the state root to the leaf node a single node at a time. Each
intermediate node is read from the database for each node transition.

In the SQL implementation, we can do this lookup in a single query.  Using a
recursive query like so:

```sql
WITH RECURSIVE tree_path AS
(
    -- This is the initial node
    SELECT hash, tree_id, leaf_id, children, 1 as depth
    FROM merkle_radix_tree_node
    WHERE hash = $STATE_ROOT_HASH AND tree_id = $TREE_ID

    UNION ALL

    -- Recurse through the tree
    SELECT c.hash, c.tree_id, c.leaf_id, c.children, p.depth + 1
    FROM merkle_radix_tree_node c, tree_path p
    WHERE c.hash = p.children[$ADDRESS_BYTES[p.depth]]
    AND c.tree_id = $TREE_ID
)
SELECT l.data
FROM tree_path t, merkle_radix_leaf l
WHERE t.tree_id = $TREE_ID AND t.leaf_id = l.id
```

Given an address's bytes, where each byte is branch position, and a starting
state root hash, the leaf (or lack thereof) can be found with the above query.

Similar queries can be used to list all leaves for a given state root, or find
all the nodes along a given address's path.

## Traits and Structs

Transact introduced an new version of `MerkleState`, `SqlMerkleState` to
specifically provide the implementation of the above. This new struct implements
the standard transact state traits `Read`, `Write` and `Prune`.

Each instance of `SqlMerkleState` is linked to a specific entry in the
`merkle_radix_tree` table.

It also introduced a new trait to cover listing out a merkle tree's leaves,
`MerkleRadixLeafReader`.  This trait provides a way to iterate over the leaves
on a given state root hash, with an optional subtree argument. It is applied to
both the key-value `MerkleState` and `SqlMerkleState`.

## References

See the [Transact documentation](https://docs.rs/transact/0.3.13/transact/) for
detailed Rust documentation.
