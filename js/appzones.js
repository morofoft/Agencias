import { getAgencies } from './agencies/agencies.store.js';
import { initMap2, updateUserPosition } from './map/map.service.js';
import { agencyMarker } from './map/markers.service.js';
import { startLocationTracking } from './gps/location.service.js';
import { checkAgencies } from './gps/geofence.service.js';
import { onLocationUpdate } from './routes/tracking.service.js';
import { exportAll } from './export/excel.js';
import { renderAgenciesList } from './agencies/agencies.list.ui.js';
import { generateRouteByZone, stopRoute, startRouteByZone } from './map/map.routes.js';

let agencies = [];
let map = null;
let markersLayer = null;

export async function renderAgenciesZone(map) {
  const agencies = await getAllAgencies();

  agencies.forEach(agency => {

    if (markers.has(agency.id)) {
      const marker = markers.get(agency.id);
      marker.setStyle({ color: colorByState(agency.estado) });
      return;
    }
  
    const marker = L.circleMarker(
      [agency.lat, agency.lng],
      {
        radius: 8,
        color: colorByState(agency.estado),
        fillOpacity: 0.8
      }
    ).addTo(map);
  
    marker.bindPopup(`
      <b>${agency.idReal}</b><br>
      Zona: ${agency.zona}<br>
      Estado: ${agency.estado}
    `);
  
    markers.set(agency.id, marker);
  });
  
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Control de Agencias iniciado');

    // 1. Inicializar Mapa y Capas
    map = initMap2();
    markersLayer = L.layerGroup().addTo(map);
    
    // 2. Obtener datos (CRÍTICO: esperar a que agencies tenga datos)
    agencies = await getAgencies(); 

    const selectZona = document.getElementById('selectZona');

    // 3. Definir función de filtrado
    const filterByZone = () => {
        const zonaSeleccionada = selectZona ? selectZona.value : 'A';
        console.log(`Filtrando por zona: ${zonaSeleccionada}`);

        // Limpiar markers previos
        markersLayer.clearLayers();

        // Filtrar datos locales
        const filtered = agencies.filter(a =>
            a.lat != null &&
            a.lng != null &&
            String(a.zona).toUpperCase() === String(zonaSeleccionada).toUpperCase()
        );

        // Renderizar en mapa y lista
        filtered.forEach(agency => {
            agencyMarker(agency).addTo(markersLayer);
        });

        renderAgenciesList(filtered); 
    };

    // 4. Configurar eventos del Select
    if (selectZona) {
        selectZona.addEventListener('change', filterByZone);
    }

    // 5. Ejecutar filtro inicial ahora que ya tenemos agencies
    filterByZone();

    // 6. Tracking de GPS
    startLocationTracking(pos => {
        updateUserPosition(map, pos);
        checkAgencies(pos, agencies);
        onLocationUpdate(pos);
    });

    // 7. Configuración de botones de ruta (Optimizado)
    ['A', 'B', 'C', 'D'].forEach(z => {
        const btn = document.getElementById(`btnRoute${z}`);
        if (btn) {
            btn.onclick = () => generateRouteByZone(map, z);
        }
    });

    const botonesIrRutas = document.querySelectorAll('.btnRouteIr');
    botonesIrRutas.forEach(boton => {
        boton.addEventListener('click', (e) => {
            const ruta = e.currentTarget.dataset.ruta;
            console.log('Iniciando ruta ' + ruta);
            stopRoute();
            startRouteByZone(map, ruta);
        });
    });
});

window.exportAll = exportAll;