import { getAllAgencies } from '../agencies/agencies.store.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';

// Variable global dentro de este módulo para guardar la ruta actual
let currentRouteControl = null;

export async function generateRouteByZone(map, zone) {
  const agencies = await getAllAgencies();
  const points = agencies
    .filter(a => a.zona === zone)
    .map(a => L.latLng(a.lat, a.lng));

  if (points.length < 2) {
    const texto = 'La zona ' + zone + ' no cuenta con los suficientes puntos!';
    Swal.fire({
        icon: 'error',
        title: '¡Pocas agencias!',
        text: texto,
        toast: true,                // Esto lo convierte en tipo Toast
        position: 'top-end',        // Ubicación (esquina superior derecha)
        showConfirmButton: false,
        timer: 5000,                // Un poco más de tiempo para que alcance a leerse
        timerProgressBar: true,     // Barra de progreso visual
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });
    return;
  }

  // ❌ Eliminar ruta anterior si existe
  if (currentRouteControl) {
    map.removeControl(currentRouteControl);
    currentRouteControl = null;
  }

  // ✅ Crear nueva ruta
  currentRouteControl = L.Routing.control({
    waypoints: points,
  lineOptions: { styles: [{ color: '#f59e0b', weight: 4 }] },
  createMarker: () => null,
  addWaypoints: false,
  routeWhileDragging: false,
  draggableWaypoints: false,
  show: false
  }).addTo(map);
}
