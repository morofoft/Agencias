import db from './db.js';

export async function queueSync(action, entity, payload) {
  const dbConn = await db;

  await dbConn.add('sync_queue', {
    action,
    entity,
    payload,
    timestamp: Date.now()
  });
}
