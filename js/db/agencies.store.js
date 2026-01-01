import db from './db.js';
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';

export async function createAgency(data) {
  const agency = {
    id: uuid(),
    nombre: data.nombre,
    direccion: data.direccion,
    zona: data.zona,
    lat: data.lat,
    lng: data.lng,
    estado: 'verde',
    contador_visitas: 0,
    fecha_ultima_visita: null,
    created_at: now(),
    updated_at: now()
  };

  const dbConn = await db;
  await dbConn.put('agencies', agency);

  await queueSync('CREATE', 'agencies', agency);

  return agency;
}

export async function getAgencies() {
  const dbConn = await db;
  return dbConn.getAll('agencies');
}

export async function updateAgency(agency) {
  agency.updated_at = now();

  const dbConn = await db;
  await dbConn.put('agencies', agency);

  await queueSync('UPDATE', 'agencies', agency);
}
