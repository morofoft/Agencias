// js/map/map.service.js

import { setMapInstance } from './map.instance.js';

let map;
let userMarker = null;
let accuracyCircle = null;
const SAN_JUAN = [18.8059, -71.2299];

export function initMap() {
  // Verificar que el contenedor existe
  const container = document.getElementById('map');
  if (!container) {
    console.error('Contenedor #map no encontrado');
    return null;
  }
  
  // Verificar que Leaflet está cargado
  if (typeof L === 'undefined') {
    console.error('Leaflet no está cargado');
    return null;
  }
  
  try {
    map = L.map('map', {
      rotate: true,
      touchRotate: false,
      bearing: 0,
      zoomControl: true
    }).setView(SAN_JUAN, 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    
    // Forzar actualización del tamaño
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    setMapInstance(map);
    console.log('✅ Mapa inicializado correctamente');
    
    return map;
    
  } catch (error) {
    console.error('Error inicializando mapa:', error);
    return null;
  }
}

export function updateUserPosition(map, position) {
  if (!map || !position?.lat || !position?.lng) return;
  
  const latlng = [position.lat, position.lng];
  const seguimientoActivo = document.getElementById('seguimiento')?.checked;
  
  // Círculo de precisión
  if (!accuracyCircle) {
    accuracyCircle = L.circle(latlng, {
      radius: position.accuracy || 20,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 1,
      interactive: false
    }).addTo(map);
  } else {
    accuracyCircle.setLatLng(latlng);
    accuracyCircle.setRadius(position.accuracy || 20);
  }
  
  // Marcador de usuario
  if (!userMarker) {
    const arrowIcon = L.divIcon({
      className: 'user-location-wrapper',
      html: `<div id="userArrow" style="transition: transform 0.1s linear; display: flex; justify-content: center; align-items: center;">
        <i class="fas fa-location-arrow" style="font-size: 24px; color: #3b82f6; text-shadow: 0 0 4px white;"></i>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    userMarker = L.marker(latlng, { icon: arrowIcon, zIndexOffset: 2000 }).addTo(map);
    
    // Solo centrar la primera vez
    map.setView(latlng, 17);
  } else {
    userMarker.setLatLng(latlng);
  }
  
  // Seguir usuario si está activado
  if (seguimientoActivo) {
    map.panTo(latlng);
  }
}