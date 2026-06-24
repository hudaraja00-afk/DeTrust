import {
  indexedDB as fakeIndexedDB,
  IDBKeyRange,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBObjectStore,
  IDBTransaction,
  IDBRequest,
  IDBCursor,
  IDBCursorWithValue,
  IDBOpenDBRequest,
} from 'fake-indexeddb';

const isServer = typeof window === 'undefined';

if (isServer && typeof globalThis.indexedDB === 'undefined') {
  Object.assign(globalThis, {
    indexedDB: fakeIndexedDB as unknown as IDBFactory,
    IDBKeyRange,
    IDBDatabase,
    IDBFactory,
    IDBIndex,
    IDBObjectStore,
    IDBTransaction,
    IDBRequest,
    IDBCursor,
    IDBCursorWithValue,
    IDBOpenDBRequest,
  });
}
