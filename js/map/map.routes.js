import { getAllAgencies } from '../agencies/agencies.store.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';
import { startLocationTracking, stopLocationTracking } from '../gps/location.service.js';


// Variable para la ruta
let currentRouteControl = null;
let points = [];
let currentIndex = 0;
let myMarker = null;
let traveledLine = null;

export async function generateRouteByZone(map, zone) {
  const agencies = await getAllAgencies();

  // Filtrar puntos de la zona
  const points = agencies
    .filter(a => a.zona === zone)
    .map(a => L.latLng(a.lat, a.lng))
    .filter(p => p.lat && p.lng);

    console.log(points.length)
  if (points.length < 2) {
    Swal.fire({
      icon: 'error',
      title: 'Pocas agencias!',
      text: `La zona ${zone} no cuenta con los suficientes puntos!`,
      timer: 1800,
      showConfirmButton: false
    });
    return;
  }

  // ❌ Eliminar ruta anterior si existe
  if (currentRouteControl) {
    map.removeControl(currentRouteControl);
    currentRouteControl = null;
  }

  // ⚡ Recalcular tamaño del mapa (importante para móvil)
  map.invalidateSize();

  // ✅ Crear nueva ruta
  currentRouteControl = L.Routing.control({
    waypoints: points,
    lineOptions: { styles: [{ color: '#f59e0b', weight: 4 }] },
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    routeWhileDragging: false,
    draggableWaypoints: false,
    addWaypoints: false,
    createMarker: () => null, // ❌ ocultar marcadores extra
    show: false,              // ❌ ocultar panel de ruta
    fitSelectedRoutes: false  // ❌ evitar zoom automático incorrecto
  }).addTo(map);

  // Centrar el mapa manualmente en la ruta
  const bounds = L.latLngBounds(points);
  map.fitBounds(bounds, { padding: [50, 50] });
}

// Función principal para generar la ruta y hacer seguimiento
export async function startRouteByZone(map, zone) {
    stopRoute()
    const agencies = await getAllAgencies();
  
    // Filtrar puntos de la zona
    const points = agencies
      .filter(a => a.zona === zone)
      .map(a => L.latLng(a.lat, a.lng))
      .filter(p => p.lat && p.lng);

      console.log(points.length)
    if (points.length < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Pocas agencias!',
        text: `La zona ${zone} no cuenta con suficientes puntos!`,
        timer: 1800,
        showConfirmButton: false
      });
      return;
    }
  
    // ❌ Eliminar ruta anterior si existe
    if (currentRouteControl) {
      map.removeControl(currentRouteControl);
      currentRouteControl = null;
    }
  
    map.invalidateSize();
  
    // Dibujar ruta completa
    currentRouteControl = L.Routing.control({
      waypoints: points,
      lineOptions: { styles: [{ color: '#f59e0b', weight: 4 }] },
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
      routeWhileDragging: false,
      draggableWaypoints: false,
      addWaypoints: false,
      createMarker: () => null,
      show: false,
      fitSelectedRoutes: false
    }).addTo(map);
  
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  
    // Línea de progreso
    if (traveledLine) traveledLine.remove();
    traveledLine = L.polyline([], { color: 'blue', weight: 4 }).addTo(map);
  
    currentIndex = 0;
  
    // Iniciar seguimiento GPS
    startLocationTracking(({ lat, lng }) => {
      if (!myMarker) {
        myMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map);
        map.setView([lat, lng], 16);
      } else {
        myMarker.setLatLng([lat, lng]);
      }
  
      // Actualizar línea de progreso
      traveledLine.addLatLng([lat, lng]);
  
      // Revisar si llegamos al siguiente punto
      if (currentIndex < points.length) {
        const next = points[currentIndex];
        const distance = map.distance([lat, lng], next);
  
        if (distance < 20) { // 20 metros de tolerancia
          Swal.fire({
            icon: 'success',
            title: `Llegaste al punto ${currentIndex + 1}`,
            timer: 1000,
            showConfirmButton: false
          });
          currentIndex++;
        }
      }
    });
  }
  
  // Función para detener el recorrido y el seguimiento GPS
  export function stopRoute() {
    stopLocationTracking();
    if (myMarker) myMarker.remove();
    if (traveledLine) traveledLine.remove();
    if (currentRouteControl) {
      currentRouteControl.remove();
      currentRouteControl = null;
    }
    points = [];
    currentIndex = 0;
    myMarker = null;
    traveledLine = null;
  }