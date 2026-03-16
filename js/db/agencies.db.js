import { dbPromise } from "./db.js";


export async function getAllPendingAgencies() {

    const db = await dbPromise;

    const agencies = await db.getAll("agencies");

    // filtrar manualmente
    return agencies.filter(a => !a.synced);

}
export async function markAgencySynced(id) {

    const db = await dbPromise;

    const agencia = await db.get("agencies", id);

    if (!agencia) return;

    agencia.synced = true;

    await db.put("agencies", agencia);

}

export async function saveAgency(agencia){

    const db = await dbPromise;
  
    await db.put("agencies", agencia);
  
  }