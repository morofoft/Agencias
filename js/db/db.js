const DB_NAME = 'control_agencias_db';
const DB_VERSION = 2;

export const dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {

    if (!db.objectStoreNames.contains('agencies')) {
      const store = db.createObjectStore('agencies', { keyPath: 'id' });
      store.createIndex('estado', 'estado');
      store.createIndex('zona', 'zona');
    }

    if (!db.objectStoreNames.contains('visits')) {
      const store = db.createObjectStore('visits', { keyPath: 'id' });
      store.createIndex('agencia_id', 'agencia_id');
      store.createIndex('timestamp', 'timestamp');
    }

    if (!db.objectStoreNames.contains('observations')) {
      const store = db.createObjectStore('observations', { keyPath: 'id' });
      store.createIndex('visit_id', 'visit_id');
    }

    if (!db.objectStoreNames.contains('sync_queue')) {
      db.createObjectStore('sync_queue', {
        keyPath: 'id',
        autoIncrement: true
      });
    }

    if (!db.objectStoreNames.contains('findings')) {
      const store = db.createObjectStore('findings', { keyPath: 'id' });
      store.createIndex('agency_id', 'agency_id');
      store.createIndex('fecha', 'fecha');
      store.createIndex('gravedad', 'gravedad');
      store.createIndex('synced', 'synced');
    }
  }
});