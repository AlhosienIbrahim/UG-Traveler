const IDB_NAME = 'busapp_db';
const IDB_VERSION = 1;
const IDB_STORE = 'keyval';

let _db = null;

function initDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = e => reject(e.target.error);
  });
}

export function getItem(key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly')
      .objectStore(IDB_STORE)
      .get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = e => reject(e.target.error);
  }));
}

export function setItem(key, value) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite')
      .objectStore(IDB_STORE)
      .put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  }));
}

export function removeItem(key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite')
      .objectStore(IDB_STORE)
      .delete(key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  }));
}
