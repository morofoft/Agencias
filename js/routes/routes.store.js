
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';
import { queueSync } from '../db/sync.store.js';
import { dbPromise } from '../db/db.js';

export async function createRoute(name) {
  const route = {
    id: uuid(),
    name,
    points: [],
    started_at: now(),
    ended_at: null,
    updated_at: now()
  };

  const dbConn = await dbPromise;
  await dbConn.put('routes', route);
  await queueSync('CREATE', 'routes', route);
  return route;
}

export async function addPointToRoute(routeId, point) {
  const dbConn = await dbPromise;
  const route = await dbConn.get('routes', routeId);

  route.points.push(point);
  route.updated_at = now();

  await dbConn.put('routes', route);
  await queueSync('UPDATE', 'routes', route);
}

export async function endRoute(routeId) {
  const dbConn = await dbPromise;
  const route = await dbConn.get('routes', routeId);
  route.ended_at = now();
  route.updated_at = now();

  await dbConn.put('routes', route);
  await queueSync('UPDATE', 'routes', route);
}
