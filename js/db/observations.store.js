
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';
import { dbPromise } from './db.js';

export async function addObservation(visitId, text) {
  const obs = {
    id: uuid(),
    visit_id: visitId,
    text,
    timestamp: now()
  };

  const dbConn = await dbPromise;
  await dbConn.put('observations', obs);

  await queueSync('CREATE', 'observations', obs);
}
