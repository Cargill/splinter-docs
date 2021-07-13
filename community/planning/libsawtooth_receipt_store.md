# Libsawtooth Receipt Store
<!--
  Copyright 2018-2021 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

## Summary
[summary]: #summary

This document discusses the current purpose and design of the receipt store in
libsawtooth as well as proposes a new `ReceiptStore` trait.

### Existing Receipt Store

The purpose of the receipt store in libsawtooth is to store transaction receipts.
Transaction receipts contain information related to the execution of a
transaction. The receipt store allows for information related to the execution
of a transaction that should not be stored in state to be saved to an underlying
database.

The `TransactionReceiptStore` is a struct that is a wrapper around an
`OrderedStore`. The `OrderedStore` is a key value store indexed by a type. The
receipt store uses transaction ID as the key, transaction receipt as the value
and is indexed by u64s. The `OrderedStore` trait is implemented for various
backends including LMDB, redis and btree. The `OrderedStore` maintains the order
of transactions by storing receipts in order of execution. Receipt store methods
include: fetching and deleting receipts by ID or index, adding new receipts,
counting the total number of receipts, iterating over all receipts and iterating
over all receipts added after a specified receipt.

### Proposed ReceiptStore trait

A new `ReceiptStore` trait should have methods for retrieving and deleting
receipts by both index and ID, adding receipts, retrieving the total number of
receipts and listing all receipts since a specified receipt. Separate methods
for listing all receipts and listing receipts since a specified receipt are not
needed because the `list_receipts_since` method will handle both cases. To
include methods for retrieving and deleting receipts by index as well as to
maintain order, the database tables in implementations of this trait will be
required to include an attribute in addition to `transaction_id` and
`transaction_result` to represent the index. The proposed trait will be
implemented with LMDB and be able to read from an existing LMDB receipt store to
maintain backwards compatability. The trait will also be implemented with SQLite
and PostgreSQL backends. This design follows the pattern of stores in Splinter.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

The new receipt store trait is a trait that covers all the capabilities of the
existing receipt store and allows for multiple back-end implementations. Planned
implementations include:
  - LMDB
  - SQLite
  - PostgreSQL

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

### Proposed ReceiptStore Trait

```
/// Interface for performing CRUD operations on transaction receipts
pub trait ReceiptStore {
    /// Retrieves the receipt with the given ID from underlying storage
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the transaction receipt to be retrieved
    fn get_txn_receipt_by_id(
        &self,
        id: String,
    ) -> Result<Option<TransactionReceipt>, TransactionReceiptStoreError>;

    /// Retrieves the receipt at the given index from underlying storage
    ///
    /// # Arguments
    ///
    /// * `index` - The index of the transaction receipt to be retrieved
    fn get_txn_receipt_by_index(
        &self,
        index: u64,
    ) -> Result<Option<TransactionReceipt>, TransactionReceiptStoreError>;

    /// Adds transaction receipts to the underlying storage
    ///
    /// # Arguments
    ///
    /// * `receipts` - A vector of the transaction receipts to be added
    fn add_txn_receipts(
        &self,
        receipts: Vec<TransactionReceipt>,
    ) -> Result<(), TransactionReceiptStoreError>;

    /// Removes the transaction receipt with the given ID from underlying storage
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the transaction receipt to be removed
    fn remove_txn_receipt_by_id(
        &self,
        id: String,
    ) -> Result<(), TransactionReceiptStoreError>;

    /// Removes the transaction receipt at the given index from underlying storage
    ///
    /// # Arguments
    ///
    ///  * `index` - The index of the transaction receipt to be removed
    fn remove_txn_receipt_by_index(
        &self,
        index: u64,
    ) -> Result<(), TransactionReceiptStoreError>;

    /// Gets the total number of transaction receipts
    fn count_txn_receipts(&self) -> Result<u32, TransactionReceiptStoreError>;

    /// List transaction receipts that have been added to the store since the
    /// provided ID
    ///
    /// # Arguments
    ///
    /// * `id` - The transaction ID of the receipt preceding the receipts to be
    ///          listed
    fn list_receipts_since(
        &self,
        id: String,
    ) ->  Result<Box<dyn ExactSizeIterator<Item = TransactionReceipt>>, TransactionReceiptStoreError>;
}
```

## Prior art
[prior-art]: #prior-art

The design for this trait and future implementation is based on stores in
Splinter.
