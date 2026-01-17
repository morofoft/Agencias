
import { getAgencies } from './agencies/agencies.store.js';
import { initMap, updateUserPosition } from './map/map.service.js';
import { agencyMarker } from './map/markers.service.js';
import { startLocationTracking } from './gps/location.service.js';
import { checkAgencies } from './gps/geofence.service.js';
import { onLocationUpdate } from './routes/tracking.service.js';
import { exportAll } from './export/excel.js';
import { renderAgenciesList } from './agencies/agencies.list.ui.js';
import { generateRouteByZone, stopRoute, startRouteByZone } from './map/map.routes.js';

let agencies = [];
let map = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Control de Agencias iniciado');

  map = initMap();
  agencies = await getAgencies();
  agencies
  .filter(a => a.lat != null && a.lng != null)
  .forEach(agency => {
    agencyMarker(agency).addTo(map);
  });

  startLocationTracking(pos => {
    updateUserPosition(map, pos);
    checkAgencies(pos, agencies);
    onLocationUpdate(pos);
  });
  await renderAgenciesList();

  document.getElementById('btnRouteA').onclick = () => {
    generateRouteByZone(map, 'A');
  };
  document.getElementById('btnRouteB').onclick = () => {
    generateRouteByZone(map, 'B');
  };
  document.getElementById('btnRouteC').onclick = () => {
    generateRouteByZone(map, 'C');
  };
  document.getElementById('btnRouteD').onclick = () => {
    generateRouteByZone(map, 'D');
  };

  const botonesIrRutas = document.querySelectorAll('.btnRouteIr');
  botonesIrRutas.forEach(boton => {
    boton.addEventListener('click', (e)=>{
        console.log('Iniciando ruta ' + e.currentTarget.dataset.ruta)
        startRouteByZone(map, e.currentTarget.dataset.ruta);
    })
  })



});

// Exportación global (botón HTML)
window.exportAll = exportAll;

