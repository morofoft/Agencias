// js/db/db.js - VERSIÓN OPTIMIZADA

const DB_NAME = 'control_agencias_db';
const DB_VERSION = 7; // Incrementar versión

export const dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    
    // ========== AGENCIAS ==========
    if (!db.objectStoreNames.contains('agencies')) {
      const store = db.createObjectStore('agencies', { keyPath: 'id' });
      
      // Índices para búsquedas rápidas
      store.createIndex('idReal', 'idReal', { unique: true });
      store.createIndex('zona', 'zona');
      store.createIndex('estado', 'estado');
      store.createIndex('synced', 'synced');
      store.createIndex('deleted', 'deleted');
      store.createIndex('updated_at', 'updated_at');
      store.createIndex('searchable', 'searchable');
      
    } else if (oldVersion < 7) {
      // Migración: agregar índices faltantes
      const store = transaction.objectStore('agencies');
      if (!store.indexNames.contains('searchable')) {
        store.createIndex('searchable', 'searchable');
      }
      if (!store.indexNames.contains('deleted')) {
        store.createIndex('deleted', 'deleted');
      }
    }
    
    // ========== OBSERVACIONES ==========
    if (!db.objectStoreNames.contains('observaciones')) {
      const store = db.createObjectStore('observaciones', {
        keyPath: 'id',
        autoIncrement: true
      });
      store.createIndex('agenciaId', 'agenciaId');
      store.createIndex('timestamp', 'timestamp');
      store.createIndex('estado', 'estado');
    }
    
    // ========== SYNC QUEUE (limitar tamaño) ==========
    if (!db.objectStoreNames.contains('sync_queue')) {
      db.createObjectStore('sync_queue', {
        keyPath: 'id',
        autoIncrement: true
      });
    }
    
    // ========== FINDINGS ==========
    if (!db.objectStoreNames.contains('findings')) {
      const store = db.createObjectStore('findings', { keyPath: 'id' });
      store.createIndex('agency_id', 'agency_id');
      store.createIndex('fecha', 'fecha');
      store.createIndex('gravedad', 'gravedad');
      store.createIndex('synced', 'synced');
      store.createIndex('estado', 'estado');
    }
    
    // ========== REPORTS ==========
    if (!db.objectStoreNames.contains('reports')) {
      db.createObjectStore('reports', { keyPath: 'id' });
    }
    
    // ========== LIMPIAR STORES VIEJOS ==========
    // Eliminar stores obsoletos
    const obsoleteStores = ['visits', 'observations', 'routes'];
    for (const store of obsoleteStores) {
      if (db.objectStoreNames.contains(store)) {
        db.deleteObjectStore(store);
      }
    }
  }
});

// Función para obtener el tamaño aproximado de la DB
export async function getDatabaseSize() {
  const db = await dbPromise;
  const agencies = await db.getAll('agencies');
  const observaciones = await db.getAll('observaciones');
  
  const size = JSON.stringify(agencies).length + JSON.stringify(observaciones).length;
  
  return {
    bytes: size,
    kb: Math.round(size / 1024),
    mb: (size / (1024 * 1024)).toFixed(2),
    agenciesCount: agencies.length,
    observationsCount: observaciones.length
  };
}