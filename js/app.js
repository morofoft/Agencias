import { getAgencies } from './db/agencies.store.js';
import { initMap, updateUserPosition } from './map/map.service.js';
import { agencyMarker } from './map/markers.service.js';
import { startLocationTracking } from './gps/location.service.js';
import { checkAgencies } from './gps/geofence.service.js';
import { onLocationUpdate } from './routes/tracking.service.js';
import { exportAll } from './export/excel.js';
import { renderAgenciesList } from './agencies/agencies.list.ui.js';

let agencies = [];
let map = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Control de Agencias iniciado');

  // 1️⃣ Inicializar mapa
  map = initMap();

  // 2️⃣ Cargar agencias offline
  agencies = await getAgencies();

  // 3️⃣ Pintar agencias en el mapa
  agencies.forEach(agency => {
    agencyMarker(agency).addTo(map);
  });

  // 4️⃣ GPS tracking
  startLocationTracking(pos => {
    updateUserPosition(map, pos);
    checkAgencies(pos, agencies);
    onLocationUpdate(pos);
  });
  await renderAgenciesList();
});

// Exportación global (botón HTML)
window.exportAll = exportAll;
