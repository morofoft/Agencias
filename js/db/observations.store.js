import db from './db.js';
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';

export async function addObservation(visitId, text) {
  const obs = {
    id: uuid(),
    visit_id: visitId,
    text,
    timestamp: now()
  };

  const dbConn = await db;
  await dbConn.put('observations', obs);

  await queueSync('CREATE', 'observations', obs);
}
