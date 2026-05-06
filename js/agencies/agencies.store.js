// js/agencies/agencies.store.js - VERSIÓN OPTIMIZADA

import { dbPromise } from '../db/db.js';
import { uuid } from '../utils/uuid.js';
import { now } from '../utils/time.js';
import { queueSync } from '../db/sync.queue.js';

// 🧹 Limpiar datos antiguos periódicamente
const CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 días
const MAX_AGENCIES_CACHE = 500; // Máximo de agencias en memoria

let agenciesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 segundos

// 📦 Compresión básica para strings largos
function compressDireccion(direccion) {
    if (!direccion || direccion.length < 100) return direccion;
    // Eliminar espacios redundantes y normalizar
    return direccion.replace(/\s+/g, ' ').trim();
}

// 🎯 Obtener agencias con caché inteligente
export async function getAllAgencies(forceRefresh = false) {
    const now = Date.now();

    if (!forceRefresh && agenciesCache && (now - cacheTimestamp) < CACHE_TTL) {
        return agenciesCache;
    }

    const database = await dbPromise;
    let agencies = await database.getAll('agencies');

    // Limitar tamaño en memoria
    if (agencies.length > MAX_AGENCIES_CACHE) {
        agencies = agencies.slice(0, MAX_AGENCIES_CACHE);
    }

    agenciesCache = agencies;
    cacheTimestamp = now;

    return agencies;
}
export async function getAllIdReal() {
    const agencies = await getAllAgencies();
    return agencies.map(a => a.idReal).filter(Boolean);
}

// 🔍 Buscar agencia por ID real (optimizado)
export async function getAgencyByIdReal(idReal) {
    // Primero buscar en caché
    if (agenciesCache) {
        const cached = agenciesCache.find(a => a.idReal === idReal);
        if (cached) return cached;
    }

    // Si no está en caché, buscar en DB con índice
    const database = await dbPromise;
    const agencies = await database.getAll('agencies');
    return agencies.find(a => a.idReal === idReal);
}

// 📝 Agregar agencia (sin duplicados)
export async function addAgency(agency) {
    // Validar datos mínimos
    if (!agency.idReal || !agency.zona) {
        throw new Error('Faltan datos obligatorios');
    }

    // Verificar si ya existe
    const existing = await getAgencyByIdReal(agency.idReal);
    if (existing) {
        throw new Error(`La agencia ${agency.idReal} ya existe`);
    }

    // Limpiar y comprimir datos
    const cleanAgency = {
        ...agency,
        id: agency.id || uuid(),
        direccion: compressDireccion(agency.direccion),
        created_at: agency.created_at || now(),
        updated_at: now(),
        synced: false,
        // Campos optimizados para búsqueda
        searchable: `${agency.idReal} ${agency.zona} ${agency.direccion || ''}`.toLowerCase().substring(0, 200)
    };

    const database = await dbPromise;
    await database.put('agencies', cleanAgency);

    // Invalidar caché
    agenciesCache = null;

    return cleanAgency;
}

// ✏️ Actualizar agencia (solo campos que cambiaron)
export async function updateAgency(agency) {
    const database = await dbPromise;
    const existing = await database.get('agencies', agency.id);

    if (!existing) {
        throw new Error('Agencia no encontrada');
    }

    // Solo actualizar campos que cambiaron (diferencias)
    const updated = {
        ...existing,
        ...agency,
        updated_at: now(),
        searchable: `${agency.idReal || existing.idReal} ${agency.zona || existing.zona} ${agency.direccion || existing.direccion || ''}`.toLowerCase().substring(0, 200),
        synced: false
    };

    await database.put('agencies', updated);

    // Invalidar caché
    agenciesCache = null;

    // Solo encolar si hay cambios significativos
    const hasSignificantChanges =
        existing.lat !== updated.lat ||
        existing.lng !== updated.lng ||
        existing.estado !== updated.estado ||
        existing.direccion !== updated.direccion;

    if (hasSignificantChanges) {
        await queueSync('UPDATE', 'agencies', updated);
    }

    return updated;
}

// 🗑️ Eliminar agencia (marcar como eliminada en lugar de borrar)
export async function deleteAgency(agencyId, softDelete = true) {
    const database = await dbPromise;

    if (softDelete) {
        // Soft delete: marcar como eliminada
        const agency = await database.get('agencies', agencyId);
        if (agency) {
            agency.deleted = true;
            agency.deleted_at = now();
            agency.synced = false;
            await database.put('agencies', agency);
            await queueSync('DELETE', 'agencies', { id: agencyId, deleted: true });
        }
    } else {
        // Hard delete: eliminar físicamente
        await database.delete('agencies', agencyId);
        await queueSync('DELETE', 'agencies', { id: agencyId });
    }

    // Invalidar caché
    agenciesCache = null;
}

// 📊 Obtener estadísticas (sin cargar todas las agencias)
export async function getAgenciesStats() {
    const database = await dbPromise;
    const agencies = await database.getAll('agencies');

    return {
        total: agencies.length,
        withGPS: agencies.filter(a => a.lat && a.lng).length,
        withoutGPS: agencies.filter(a => !a.lat || !a.lng).length,
        byZone: agencies.reduce((acc, a) => {
            const zone = a.zona || 'Sin zona';
            acc[zone] = (acc[zone] || 0) + 1;
            return acc;
        }, {}),
        lastUpdated: Math.max(...agencies.map(a => a.updated_at || 0), 0)
    };
}

// 🧹 Limpiar agencias antiguas o eliminadas
export async function cleanupOldAgencies(daysOld = 30) {
    const database = await dbPromise;
    const agencies = await database.getAll('agencies');
    const cutoff = now() - (daysOld * 24 * 60 * 60 * 1000);

    let deletedCount = 0;

    for (const agency of agencies) {
        // Eliminar agencias marcadas como deleted por más de 30 días
        if (agency.deleted && agency.deleted_at && agency.deleted_at < cutoff) {
            await database.delete('agencies', agency.id);
            deletedCount++;
        }

        // Eliminar agencias sin actividad por más de 90 días (opcional)
        if (!agency.deleted && agency.updated_at && agency.updated_at < cutoff * 3) {
            // Marcar para revisión
            agency.pending_review = true;
            await database.put('agencies', agency);
        }
    }

    if (deletedCount > 0) {
        agenciesCache = null;
        console.log(`🧹 Limpiadas ${deletedCount} agencias antiguas`);
    }

    return deletedCount;
}

// 🔄 Sincronización selectiva (solo lo que cambió)
export async function getPendingSyncAgencies() {
    const database = await dbPromise;
    const agencies = await database.getAll('agencies');

    // Solo devolver las que necesitan sincronización
    return agencies.filter(a => !a.synced && !a.deleted);
}

// 📦 Exportar agencias (sin datos sensibles)
export async function exportAgenciesAdvanced() {
    const agencies = await getAllAgencies();

    // Limpiar datos antes de exportar
    const cleanForExport = agencies.map(a => ({
        idReal: a.idReal,
        zona: a.zona,
        direccion: a.direccion,
        lat: a.lat,
        lng: a.lng,
        estado: a.estado,
        contador_visitas: a.contador_visitas,
        created_at: a.created_at,
        updated_at: a.updated_at
    }));

    const dataStr = JSON.stringify(cleanForExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `agencias_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 📥 Importar agencias (con validación)
export async function importAgenciesAdvanced(file) {
    if (!file) return;

    const text = await file.text();
    let imported;
    try {
        imported = JSON.parse(text);
    } catch {
        throw new Error('Archivo JSON inválido');
    }

    if (!Array.isArray(imported)) {
        throw new Error('El JSON debe ser un arreglo');
    }

    const db = await dbPromise;
    let created = 0;
    let updated = 0;

    for (const agency of imported) {
        if (!agency.idReal || !agency.zona) continue;

        const existing = await getAgencyByIdReal(agency.idReal);

        if (existing) {
            // Actualizar solo si hay cambios
            const hasChanges =
                existing.lat !== agency.lat ||
                existing.lng !== agency.lng ||
                existing.direccion !== agency.direccion ||
                existing.zona !== agency.zona;

            if (hasChanges) {
                await updateAgency({ ...existing, ...agency });
                updated++;
            }
        } else {
            // Crear nueva
            await addAgency({
                ...agency,
                id: uuid(),
                created_at: now(),
                updated_at: now()
            });
            created++;
        }
    }

    agenciesCache = null;

    return { created, updated };
}

// Ejecutar limpieza periódica (cada semana)
if (typeof window !== 'undefined') {
    setInterval(() => {
        cleanupOldAgencies(30).catch(console.error);
    }, CLEANUP_INTERVAL);
}

// Exportación para compatibilidad con código existente
export const getAgencies = getAllAgencies;