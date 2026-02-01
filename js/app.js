
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
  const accuracyValue = document.getElementById('accuracy-value');

  map = initMap();
  agencies = await getAgencies();
  agencies
    .filter(a => a.lat != null && a.lng != null)
    .forEach(agency => {
      agencyMarker(agency).addTo(map);
    });

  const speedValue = document.getElementById('speed-value');
  const accDot = document.getElementById('acc-dot');

  startLocationTracking(pos => {
    // 1. Actualizar Precisión con indicadores de color
    if (accuracyValue) {
      const acc = Math.round(pos.accuracy);
      accuracyValue.textContent = acc;

      // Semáforo de precisión
      if (acc < 20) accDot.className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]";
      else if (acc < 70) accDot.className = "w-2 h-2 rounded-full bg-amber-500";
      else accDot.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
    }

    // 2. Calcular Velocidad (de m/s a km/h)
    if (speedValue) {
      // pos.speed puede ser null si no te mueves o el GPS no lo calcula
      const speedMS = pos.speed || 0;
      const speedKMH = (speedMS * 3.6).toFixed(1); // Conversión: 1 m/s = 3.6 km/h
      speedValue.textContent = speedKMH;
    }

    // 3. Mantener el mapa actualizado
    updateUserPosition(map, pos);
    checkAgencies(pos, agencies);
  });
  await renderAgenciesList();


  const rutas = ['A', 'B', 'C', 'D'];
  rutas.forEach(id => {
    const btn = document.getElementById(`btnRoute${id}`);
    if (btn) {
      btn.onclick = () => generateRouteByZone(map, id);
    }
  });

  const botonesIrRutas = document.querySelectorAll('.btnRouteIr');
  botonesIrRutas.forEach(boton => {
    boton.addEventListener('click', (e) => {
      console.log('Iniciando ruta ' + e.currentTarget.dataset.ruta)
      stopRoute()
      startRouteByZone(map, e.currentTarget.dataset.ruta);
    })
  })
});

window.addEventListener('deviceorientationabsolute', (e) => {
  if (map && map.setBearing && e.alpha !== null) {
    const seguimientoActivo = document.getElementById('seguimiento')?.checked;
    if (seguimientoActivo) {
      map.setBearing(360 - e.alpha);
    }
  }
});

// Exportación global (botón HTML)
window.exportAll = exportAll;

