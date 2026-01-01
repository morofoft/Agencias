// js/db/sync.queue.js
import { dbPromise } from './db.js';

const SYNC_STORE = 'sync_queue';

/**
 * Añade una operación a la cola de sincronización
 * @param {'CREATE'|'UPDATE'|'DELETE'} action 
 * @param {string} storeName 
 * @param {object} data 
 */
export async function queueSync(action, storeName, data) {
  const db = await dbPromise;

  const item = {
    id: crypto.randomUUID(),
    action,
    storeName,
    data,
    timestamp: Date.now()
  };

  await db.put(SYNC_STORE, item);
  console.log('Queued sync:', item);
}

/**
 * Obtiene todos los items pendientes de sincronización
 */
export async function getSyncQueue() {
  const db = await dbPromise;
  return await db.getAll(SYNC_STORE);
}

/**
 * Marca un item como sincronizado (lo elimina de la cola)
 * @param {string} id 
 */
export async function removeFromQueue(id) {
  const db = await dbPromise;
  await db.delete(SYNC_STORE, id);
}

/**
 * Limpia toda la cola (opcional)
 */
export async function clearSyncQueue() {
  const db = await dbPromise;
  await db.clear(SYNC_STORE);
}

/**
 * Procesa la cola de sincronización y hace merge con el backend
 * @param {function} syncHandler function que recibe cada item y hace sync con Firebase
 */
export async function processSyncQueue(syncHandler) {
  const queue = await getSyncQueue();

  for (const item of queue) {
    try {
      await syncHandler(item);
      await removeFromQueue(item.id);
    } catch (err) {
      console.error('Error syncing item', item, err);
      // lo dejamos en la cola para intentar luego
    }
  }
}
