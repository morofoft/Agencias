
import { dbPromise } from './db.js';
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';
import { queueSync } from './sync.store.js';

const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutos

export async function registerVisit(agencyId) {
  const dbConn = await dbPromise;
  const agency = await dbConn.get('agencies', agencyId);

  if (!agency) {
    console.warn('Agencia no encontrada:', agencyId);
    return null;
  }

  const currentTime = now();

  // 🛑 evitar duplicados por tiempo
  if (
    agency.fecha_ultima_visita &&
    currentTime - agency.fecha_ultima_visita < MIN_INTERVAL
  ) {
    return null;
  }

  const visit = {
    id: uuid(),
    agencia_id: agencyId,
    timestamp: currentTime
  };

  // guardar visita
  await dbConn.put('visits', visit);

  // actualizar agencia
  agency.contador_visitas = (agency.contador_visitas || 0) + 1;
  agency.fecha_ultima_visita = currentTime;
  agency.visited = true;
  agency.updated_at = currentTime;

  await dbConn.put('agencies', agency);

  // cola de sincronización
  await queueSync('CREATE', 'visits', visit);
  await queueSync('UPDATE', 'agencies', agency);

  return visit;
}
