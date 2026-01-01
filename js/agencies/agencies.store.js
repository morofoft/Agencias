import db from '../db/db.js';

export async function addAgency(agency) {
  const database = await db;
  await database.put('agencies', agency);
}

export async function getAllAgencies() {
  const database = await db;
  return database.getAll('agencies');
}
