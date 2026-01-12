import { dbPromise } from '../db/db.js';

export async function addReport(report) {
  const db = await dbPromise;
  await db.put('reports', report);
}

export async function getReportsByDate(date) {
  const db = await dbPromise;
  const all = await db.getAll('reports');
  return all.filter(r => r.fecha === date);
}

export async function toggleReportCompleted(id) {
  const db = await dbPromise;
  const report = await db.get('reports', id);
  report.completed = !report.completed;
  report.updated_at = Date.now();
  await db.put('reports', report);
}
