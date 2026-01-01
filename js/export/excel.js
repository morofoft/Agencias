import { dbPromise } from '../db/db.js';

export async function exportAll() {
  const dbConn = await dbPromise;

  const agencies = await dbConn.getAll('agencies');
  const visits = await dbConn.getAll('visits');
  const observations = await dbConn.getAll('observations');
  const routes = await dbConn.getAll('routes');

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agencies), 'Agencias');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(visits), 'Visitas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(observations), 'Observaciones');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(routes), 'Rutas');

  XLSX.writeFile(wb, 'control_agencias.xlsx');
}
