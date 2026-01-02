import { getAllAgencies } from '../agencies/agencies.store.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';

// Guardar la ruta actual
let currentRouteControl = null;

export async function generateRouteByZone(map, zone) {
  const agencies = await getAllAgencies();

  // Filtrar puntos de la zona
  const points = agencies
    .filter(a => a.zona === zone)
    .map(a => L.latLng(a.lat, a.lng))
    .filter(p => p.lat && p.lng); // ⚡ eliminar puntos inválidos

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