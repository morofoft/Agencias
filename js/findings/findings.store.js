import { dbPromise } from '../db/db.js';

export async function addFinding(data) {
  const db = await dbPromise;
  await db.add('findings', data);
}

export async function getFindings() {
  const db = await dbPromise;
  return db.getAll('findings');
}

export async function getCriticalPendingFindings() {
    const db = await dbPromise;
    const all = await db.getAll('findings');
  
    console.log('DEBUG findings:', all);
  
    return all.filter(f =>
        f.gravedad === 'critica' &&
        f.estado === 'Pendiente'
      );
  }
  
  export async function markFindingResolved(id) {
    const db = await dbPromise;
  
    const finding = await db.get('findings', id);
    if (!finding) return;
  
    finding.estado = 'Resuelto';
    finding.resolved_at = Date.now();
    finding.synced = false;
  
    await db.put('findings', finding);
  }

  export async function updateFinding(finding) {
    const db = dbPromise;
    await db.put('findings', finding)
  }