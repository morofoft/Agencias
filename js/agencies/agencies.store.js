import { dbPromise } from '../db/db.js';
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';
import { queueSync } from '../db/sync.queue.js';


export async function addAgency(agency) {
    const database = await dbPromise;
    await database.put('agencies', agency);
}

export async function getAllAgencies() {
    const database = await dbPromise;
    return database.getAll('agencies');
}
export async function updateAgency(agency) {
    agency.updated_at = now();

    const dbConn = await dbPromise;
    await dbConn.put('agencies', agency);

    await queueSync('UPDATE', 'agencies', agency);
}

export async function getAgencies() {
    const dbConn = await dbPromise;
    return dbConn.getAll('agencies');
}

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

    const dbConn = await dbPromise;
    await dbConn.put('agencies', agency);

    await queueSync('CREATE', 'agencies', agency);

    return agency;
}