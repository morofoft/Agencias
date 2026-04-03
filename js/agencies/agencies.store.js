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

// --- EXPORTAR ---
export async function exportAgenciesAdvanced() {
    const agencies = await getAllAgencies();
    const dataStr = JSON.stringify(agencies, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = `agencias_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // --- IMPORTAR ---
  export async function importAgenciesAdvanced(file) {
    if (!file) return;
  
    const text = await file.text();
    let imported;
    try {
      imported = JSON.parse(text);
    } catch {
      Swal.fire({ icon: 'error', title: 'Archivo inválido', text: 'No se pudo leer el JSON.' });
      return;
    }
  
    if (!Array.isArray(imported)) {
      Swal.fire({ icon: 'error', title: 'Formato incorrecto', text: 'El JSON debe ser un arreglo de agencias.' });
      return;
    }
  
    const db = await dbPromise;
    let count = 0;
  
    for (const agency of imported) {
      if (!agency.id) agency.id = uuid();
  
      const existing = await db.get('agencies', agency.id);
  
      if (existing) {
        
          agency.updated_at = now();
          await db.put('agencies', agency);
          await queueSync('UPDATE', 'agencies', agency);
          count++;
        
      } else {
        // Crear nueva
        agency.created_at = now();
        agency.updated_at = now();
        await db.put('agencies', agency);
        await queueSync('CREATE', 'agencies', agency);
        count++;
      }
    }
  
    Swal.fire({ icon: 'success', title: 'Importación completa', text: `${count} agencias importadas o actualizadas.` });
    return count;
  }

  export async function deleteAgency(agencyId) {
    const db = await dbPromise;
    const agency = await db.get('agencies', agencyId);
  
    if (!agency) return;
  
    await db.delete('agencies', agencyId);
    await queueSync('DELETE', 'agencies', { id: agencyId });
  }
  
  export async function getAgencyByIdReal(idReal) {
    const db = await dbPromise;
    const agencies = await db.getAll('agencies');
  
    return agencies.find(a => a.idReal === idReal);
  }

  export async function saveObservation(observation) {
    const db = await dbPromise;
    return db.add('observaciones', observation);
  }
  
  export async function getAllObservations() {
    const db = await dbPromise;
    return db.getAll('observaciones');
  }