# Benchmark of Hyperledger Transact 0.3.7 LMDB and experimental SQLite backends
<!--
  Copyright 2018-2020 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary

Hyperledger Transact provides a number of core features used by Splinter, such
as transaction execution and state storage.  As these features play an important
role in the operation of a splinter network, it is important to measure the
performance of these subsystems to determine where optimizations can be made.

The benchmarks included here cover the performance of one of the lowest-level
areas: Transact's database abstraction, and two of its back-end implementations,
LMDB and SQLite (currently an experimental feature). These benchmarks have been
run on several file systems: Elastic Block Store (EBS), Elastic File System
(EFS), and APFS (Apple File System).

EFS has a noticeable performance impact, with a 18x slowdown for LMDB and a 99x
slowdown for SQLite. These results strongly imply that with the current
implementations, LMDB would be the preferred choice for a back-end implemented
over a file on EFS.

## Environment

The environments where these benchmarks have been run is in AWS as well as on
the developer's local system.  In AWS, two different file system types are used:
Elastic Block Store (EBS) and Elastic File System (EFS).

**t2.medium**

* 2 vCPU

  "T2 instances are backed by the latest Intel Xeon processors with clock speeds
  up to 3.3 GHz during burst periods.”
* 4GB RAM
* OS: ubuntu-bionic-18.04-amd64-server-20201026
* EBS (for a single node configuration) and EFS

**Local Development Environment**

* MacBook Pro (13-inch, 2020, Four Thunderbolt 3 ports)
* Processor: 2.3 GHz Quad-Core Intel Core i7
* Memory: 32 GB 3733 MHz LPDDR4X
* OS: macOS Catalina 10.15.7

## Setup

The tests have been compiled in release mode, and include the experimental
feature "sqlitedb" enabled:

```
cargo build --manifest-path libtransact/Cargo.toml \
    --tests \
    --release \
    --features sqlite-db
```

In these benchmark runs, the integration tests compiled to a binary
`mod-5b692c58f25d0ea4` on AWS. This includes all of the tests that cover the
Merkle Trie overlayed on multiple back-ends: LMDB, SQLite, BTree (i.e. Memory),
and Redis (not exercised in these benchmarks).


On macOS, the compiled binary is `mod-a47d5999419a955f`.  This particular
instance has been built against SQlite version

```
3.34.0 2020-12-01 16:14:00 a26b6597e3ae272231b96f9982c3bcc17ddec2f2b6eb4df06a224b91089fed5b
```

This is a newer version than the default sqlite3 installation provided by the
OS.

For each benchmark, the test runs are limited to those specific to a given
back-end and prefixed with `merkle_trie_`. In some back-ends, the test
`merkle_trie_update` has been renamed, though the behavior remains the same.

## Results

### AWS B-Tree Baseline

Running the tests against the B-tree back-end. This back-end is memory-only, and
therefore not dependent on file system characteristics.

```
$ time ./target/release/deps/mod-5b692c58f25d0ea4 \
    -- btree::merkle_trie

running 10 tests
test state::merkle::btree::merkle_trie_empty_changes ... ok
test state::merkle::btree::merkle_trie_delete ... ok
test state::merkle::btree::merkle_trie_pruning_parent ... ok
test state::merkle::btree::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::btree::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::btree::merkle_trie_root_advance ... ok
test state::merkle::btree::merkle_trie_pruning_successors ... ok
test state::merkle::btree::merkle_trie_update_same_address_space ... ok
test state::merkle::btree::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::btree::merkle_trie_update ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m0.843s
user    0m0.822s
sys     0m0.028s
```

### EBS

#### LMDB

For LMDB tests, `merkle_trie_update` has been named
`merkle_trie_update_multiple_entries`.

```
$ time ./target/release/deps/mod-5b692c58f25d0ea4 \
    -- lmdb::merkle_trie

running 10 tests
test state::merkle::lmdb::merkle_trie_empty_changes ... ok
test state::merkle::lmdb::merkle_trie_delete ... ok
test state::merkle::lmdb::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::lmdb::merkle_trie_pruning_parent ... ok
test state::merkle::lmdb::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::lmdb::merkle_trie_root_advance ... ok
test state::merkle::lmdb::merkle_trie_pruning_successors ... ok
test state::merkle::lmdb::merkle_trie_update_same_address_space ... ok
test state::merkle::lmdb::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::lmdb::merkle_trie_update_multiple_entries ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m0.850s
user    0m0.825s
sys     0m0.036s
```

#### SQLite

The `merkle_trie_update` test has been named,
`merkle_trie_update_with_wal_mode`, which configures sqlite with a fast
configuration. The additional tests `merkle_trie_update_with_sync_full_wal_mode`
and `merkle_trie_update_atomic_commit_rollback` have been ignored, as these run
the same test assertions as `merkle_trie_update`, but with slower performance
configurations.

```
$ time ./target/release/deps/mod-5b692c58f25d0ea4 \
    --skip atomic \
    --skip sync_full \
    -- sqlitedb::merkle_trie

running 10 tests
test state::merkle::sqlitedb::merkle_trie_empty_changes ... ok
test state::merkle::sqlitedb::merkle_trie_delete ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_parent ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_successors ... ok
test state::merkle::sqlitedb::merkle_trie_root_advance ... ok
test state::merkle::sqlitedb::merkle_trie_update_same_address_space ... ok
test state::merkle::sqlitedb::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::sqlitedb::merkle_trie_update_with_wal_mode ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m6.737s
user    0m1.510s
sys     0m0.527s
```

### EFS

In order to run the tests on EFS, a temp directory is created on the EFS
partition. In these tests, it has been set to `/efs/benchmark`.

```
$ mkdir /efs/benchmark
$ export TMPDIR=/efs/benchmark
$ export TMP=$TMPDIR
$ export TEMP=$TMPDIR
```

#### LMDB

```
$ time ./target/release/deps/mod-5b692c58f25d0ea4 \
    -- lmdb::merkle_trie

running 10 tests
test state::merkle::lmdb::merkle_trie_empty_changes ... ok
test state::merkle::lmdb::merkle_trie_delete ... ok
test state::merkle::lmdb::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::lmdb::merkle_trie_pruning_parent ... ok
test state::merkle::lmdb::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::lmdb::merkle_trie_pruning_successors ... ok
test state::merkle::lmdb::merkle_trie_root_advance ... ok
test state::merkle::lmdb::merkle_trie_update_same_address_space ... ok
test state::merkle::lmdb::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::lmdb::merkle_trie_update_multiple_entries ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m15.440s
user    0m1.139s
sys     0m0.064s
```

This represents a 18x slowdown.

#### SQLite

```
$ time ./target/release/deps/mod-5b692c58f25d0ea4 \
   --skip atomic \
   --skip sync_full \
   -- sqlitedb::merkle_trie

running 10 tests
test state::merkle::sqlitedb::merkle_trie_empty_changes ... ok
test state::merkle::sqlitedb::merkle_trie_delete ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_parent ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_successors ... ok
test state::merkle::sqlitedb::merkle_trie_root_advance ... ok
test state::merkle::sqlitedb::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::sqlitedb::merkle_trie_update_same_address_space ... ok
test state::merkle::sqlitedb::merkle_trie_update_with_wal_mode ... test state::merkle::sqlitedb::merkle_trie_update_with_wal_mode has been running for over 60 seconds
test state::merkle::sqlitedb::merkle_trie_update_with_wal_mode ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    11m3.621s
user    0m4.483s
sys     0m7.279s
```

This represents a 99x slowdown.  There are several possible improvements that
are being explored, though many are only safe to apply in single-threaded,
single-process environments.

Several options include disabling the journal, and disabling file synchronization.

### macOS

#### B-Tree

```
$ time target/release/deps/mod-a47d5999419a955f \
    -- btree::merkle_trie

running 10 tests
test state::merkle::btree::merkle_trie_empty_changes ... ok
test state::merkle::btree::merkle_trie_delete ... ok
test state::merkle::btree::merkle_trie_root_advance ... ok
test state::merkle::btree::merkle_trie_pruning_parent ... ok
test state::merkle::btree::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::btree::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::btree::merkle_trie_pruning_successors ... ok
test state::merkle::btree::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::btree::merkle_trie_update_same_address_space ... ok
test state::merkle::btree::merkle_trie_update ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m0.746s
user    0m0.744s
sys     0m0.018s
```

#### LMDB

```
$ time target/release/deps/mod-a47d5999419a955f \
    -- lmdb::merkle_trie

running 10 tests
test state::merkle::lmdb::merkle_trie_empty_changes ... ok
test state::merkle::lmdb::merkle_trie_delete ... ok
test state::merkle::lmdb::merkle_trie_root_advance ... ok
test state::merkle::lmdb::merkle_trie_pruning_parent ... ok
test state::merkle::lmdb::merkle_trie_pruning_successors ... ok
test state::merkle::lmdb::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::lmdb::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::lmdb::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::lmdb::merkle_trie_update_same_address_space ... ok
test state::merkle::lmdb::merkle_trie_update_multiple_entries ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m1.646s
user    0m0.881s
sys     0m0.812s
```

#### SQLite

```
$ time target/release/deps/mod-a47d5999419a955f \
    --skip atomic \
    --skip sync_full \
    -- sqlitedb::merkle_trie

running 10 tests
test state::merkle::sqlitedb::merkle_trie_empty_changes ... ok
test state::merkle::sqlitedb::merkle_trie_root_advance ... ok
test state::merkle::sqlitedb::merkle_trie_delete ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_parent ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_successor_duplicate_leaves ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_duplicate_leaves ... ok
test state::merkle::sqlitedb::merkle_trie_pruning_successors ... ok
test state::merkle::sqlitedb::merkle_trie_update_same_address_space_with_no_children ... ok
test state::merkle::sqlitedb::merkle_trie_update_same_address_space ... ok
test state::merkle::sqlitedb::merkle_trie_update_with_wal_mode ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 29 filtered out


real    0m3.152s
user    0m1.416s
sys     0m0.826s
```

## Conclusions

The benchmarks show several interesting results.  First, LMDB on EBS has very
little overhead compared to the baseline B-Tree implementation. On macOS, it has
a higher overhead, most likely due poorer memory-mapped file support.

EFS has a noticeable performance impact, with a 18x slowdown for LMDB and a 99x
slowdown for SQLite. These results strongly imply that with the current
implementations, LMDB would be the preferred choice for a back-end implemented
over a file on EFS.

In both file systems, a number of changes may be required for the SQLite
implementation to improve performance in general, as well as single-threaded
environments. Some of these changes will most likely be implemented before the
feature is stabilized, as they will require changes to the SQLite database
builder API.
