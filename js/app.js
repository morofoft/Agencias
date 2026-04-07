// js/app.js - Versión corregida para el mapa

import { getAgencies } from './agencies/agencies.store.js';
import { initMap, updateUserPosition } from './map/map.service.js';
import { agencyMarker } from './map/markers.service.js';
import { startLocationTracking } from './gps/location.service.js';
import { checkAgencies } from './gps/geofence.service.js';
import { renderAgenciesList } from './agencies/agencies.list.ui.js';
import { openRouteSelector } from './map/route-selector.js';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const btnSelectRoute = document.getElementById('btn-select-route');
if (btnSelectRoute) {
  btnSelectRoute.addEventListener('click', () => {
    openRouteSelector();
  });
}
  console.log('🚀 Iniciando aplicación...');
  
  // Verificar que el contenedor del mapa existe
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('❌ Contenedor #map no encontrado');
    return;
  }
  
  console.log('✅ Contenedor #map encontrado');
  
  // Inicializar mapa
  const map = initMap();
  if (!map) {
    console.error('❌ Error al inicializar el mapa');
    return;
  }
  
  console.log('✅ Mapa inicializado');
  
  // Cargar agencias
  const agencies = await getAgencies();
  console.log(`📋 ${agencies.length} agencias cargadas`);
  
  // Filtrar agencias con coordenadas
  const agenciesWithCoords = agencies.filter(a => a.lat != null && a.lng != null);
  console.log(`📍 ${agenciesWithCoords.length} agencias con coordenadas`);
  
  // Agregar marcadores
  agenciesWithCoords.forEach(agency => {
    agencyMarker(agency).addTo(map);
  });
  
  // Selects de zona (solo si existen)
  const selectZona1 = document.querySelector("#selectZona1");
  const selectZona2 = document.querySelector("#selectZona2");
  
  if (selectZona1 && selectZona2) {
    const zonasUnicas = [...new Set(agenciesWithCoords.map(a => a.zona))];
    zonasUnicas.forEach(zona => {
      const option1 = document.createElement("option");
      option1.value = zona;
      option1.textContent = zona;
      selectZona1.appendChild(option1);
      
      const option2 = document.createElement("option");
      option2.value = zona;
      option2.textContent = zona;
      selectZona2.appendChild(option2);
    });
    
    selectZona2.addEventListener("change", () => {
      const valor = selectZona2.value;
      if (!valor) return;
      
      // Limpiar capas excepto tile layers
      map.eachLayer(layer => {
        if (!(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });
      
      // Filtrar y agregar marcadores
      agenciesWithCoords
        .filter(a => a.zona === valor)
        .forEach(agency => {
          agencyMarker(agency).addTo(map);
        });
    });
  }
  
  // Widget de agencia cercana
  const closestName = document.getElementById('closest-name');
  const closestDistance = document.getElementById('closest-distance-text');
  const accuracyValue = document.getElementById('accuracy-value');
  const speedValue = document.getElementById('speed-value');
  const accDot = document.getElementById('acc-dot');
  
  // Iniciar tracking GPS
  startLocationTracking(async (pos) => {
    // Actualizar posición del usuario en el mapa
    updateUserPosition(map, pos);
    
    // Actualizar UI de precisión
    if (accuracyValue && accDot && pos.accuracy !== null) {
      const acc = Math.round(pos.accuracy);
      accuracyValue.textContent = acc;
      
      accDot.classList.remove("bg-emerald-500", "bg-amber-500", "bg-red-500", "animate-pulse");
      if (acc < 20) {
        accDot.classList.add("bg-emerald-500");
      } else if (acc < 70) {
        accDot.classList.add("bg-amber-500");
      } else {
        accDot.classList.add("bg-red-500", "animate-pulse");
      }
    }
    
    // Actualizar velocidad
    if (speedValue && pos.speed !== null) {
      const speedKMH = (pos.speed * 3.6).toFixed(1);
      speedValue.textContent = speedKMH;
    }
    
    // Verificar agencias cercanas
    const closest = await checkAgencies(pos, agenciesWithCoords);
    
    if (closest && closestName && closestDistance) {
      closestName.textContent = `AG ${closest.idReal}`;
      closestDistance.textContent = `${closest.currentDist} Metros`;
    }
    
    // Renderizar lista (con throttle para no saturar)
    renderAgenciesList(pos);
  });
  
  // Botón de re-centrar
  const btnRecenter = document.getElementById('btn-recenter');
  if (btnRecenter) {
    btnRecenter.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 17);
        });
      }
    });
  }
  
  // Toggle de lista
  const btnToggle = document.getElementById('btn-toggle-list');
  const btnClose = document.getElementById('btn-close-list');
  const listContainer = document.getElementById('collapsible-list');
  
  if (btnToggle && listContainer) {
    btnToggle.addEventListener('click', () => {
      listContainer.classList.toggle('is-active');
      const icon = btnToggle.querySelector('i');
      if (icon) {
        icon.className = listContainer.classList.contains('is-active') 
          ? 'fas fa-chevron-down' 
          : 'fas fa-list-ul';
      }
    });
  }
  
  if (btnClose && listContainer) {
    btnClose.addEventListener('click', () => {
      listContainer.classList.remove('is-active');
      const icon = btnToggle?.querySelector('i');
      if (icon) icon.className = 'fas fa-list-ul';
    });
  }
  
  // Renderizar lista inicial
  await renderAgenciesList();
  
  console.log('✅ Aplicación inicializada correctamente');
});