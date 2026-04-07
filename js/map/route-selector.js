// js/map/route-selector.js
import { getAllAgencies } from '../agencies/agencies.store.js';
import { getMapInstance } from './map.instance.js';

let selectedAgencies = [];
let routeControl = null;

/**
 * Abre el modal para seleccionar agencias
 */
export async function openRouteSelector() {
  const agencies = await getAllAgencies();
  const agenciesWithCoords = agencies.filter(a => a.lat && a.lng);
  
  if (agenciesWithCoords.length < 2) {
    Swal.fire({
      icon: 'warning',
      title: 'Agencias insuficientes',
      text: 'Se necesitan al menos 2 agencias con GPS para crear una ruta',
      confirmButtonColor: '#4f46e5'
    });
    return;
  }
  
  // Crear HTML del modal
  const agencyListHtml = agenciesWithCoords.map(agency => `
    <div class="route-agency-item flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
         data-id="${agency.id}"
         data-lat="${agency.lat}"
         data-lng="${agency.lng}"
         data-name="${agency.idReal}">
      <input type="checkbox" class="agency-checkbox w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
      <div class="flex-1">
        <span class="font-bold text-slate-800">${agency.idReal}</span>
        <span class="text-xs text-slate-400 ml-2">Zona ${agency.zona || '?'}</span>
        <p class="text-[10px] text-slate-400 truncate">${agency.direccion || 'Sin dirección'}</p>
      </div>
      <button class="preview-btn text-indigo-500 hover:text-indigo-700" data-lat="${agency.lat}" data-lng="${agency.lng}">
        <i class="fas fa-map-marker-alt"></i>
      </button>
    </div>
  `).join('');
  
  const { value: result } = await Swal.fire({
    title: 'Seleccionar Agencias para Ruta',
    html: `
      <div class="mb-4 flex gap-2">
        <button id="select-all-btn" class="text-xs px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg">Seleccionar todas</button>
        <button id="clear-all-btn" class="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">Limpiar</button>
        <span class="text-xs text-slate-400 ml-auto" id="selected-count">0 seleccionadas</span>
      </div>
      <div class="max-h-96 overflow-y-auto border border-slate-200 rounded-xl" id="agency-list-container">
        ${agencyListHtml}
      </div>
      <div class="mt-4 text-xs text-slate-500">
        <i class="fas fa-info-circle"></i> Selecciona al menos 2 agencias en el orden que deseas visitarlas
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Generar Ruta',
    confirmButtonColor: '#10b981',
    cancelButtonText: 'Cancelar',
    didOpen: (modal) => {
      const container = document.getElementById('agency-list-container');
      const selectAllBtn = document.getElementById('select-all-btn');
      const clearAllBtn = document.getElementById('clear-all-btn');
      const selectedCountSpan = document.getElementById('selected-count');
      
      let selected = new Map();
      
      function updateCount() {
        selectedCountSpan.textContent = `${selected.size} seleccionada${selected.size !== 1 ? 's' : ''}`;
      }
      
      function updateCheckboxes() {
        container.querySelectorAll('.route-agency-item').forEach(item => {
          const checkbox = item.querySelector('.agency-checkbox');
          const id = item.dataset.id;
          checkbox.checked = selected.has(id);
        });
        updateCount();
      }
      
      // Seleccionar todos
      selectAllBtn?.addEventListener('click', () => {
        container.querySelectorAll('.route-agency-item').forEach(item => {
          const id = item.dataset.id;
          const name = item.dataset.name;
          selected.set(id, {
            id: id,
            name: name,
            lat: parseFloat(item.dataset.lat),
            lng: parseFloat(item.dataset.lng)
          });
        });
        updateCheckboxes();
      });
      
      // Limpiar todo
      clearAllBtn?.addEventListener('click', () => {
        selected.clear();
        updateCheckboxes();
      });
      
      // Click en item
      container.querySelectorAll('.route-agency-item').forEach(item => {
        const checkbox = item.querySelector('.agency-checkbox');
        const id = item.dataset.id;
        const name = item.dataset.name;
        
        item.addEventListener('click', (e) => {
          if (e.target.classList.contains('preview-btn')) return;
          
          if (selected.has(id)) {
            selected.delete(id);
          } else {
            selected.set(id, {
              id: id,
              name: name,
              lat: parseFloat(item.dataset.lat),
              lng: parseFloat(item.dataset.lng)
            });
          }
          checkbox.checked = selected.has(id);
          updateCount();
        });
        
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          if (selected.has(id)) {
            selected.delete(id);
          } else {
            selected.set(id, {
              id: id,
              name: name,
              lat: parseFloat(item.dataset.lat),
              lng: parseFloat(item.dataset.lng)
            });
          }
          checkbox.checked = selected.has(id);
          updateCount();
        });
        
        // Botón de previsualización
        const previewBtn = item.querySelector('.preview-btn');
        previewBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          const map = getMapInstance();
          if (map) {
            const lat = parseFloat(previewBtn.dataset.lat);
            const lng = parseFloat(previewBtn.dataset.lng);
            map.setView([lat, lng], 17);
            Swal.fire({
              icon: 'info',
              title: name,
              text: 'Ubicación centrada en el mapa',
              timer: 1500,
              showConfirmButton: false
            });
          }
        });
      });
      
      // Swal preConfirm para obtener selección
      window.tempSelected = selected;
    },
    preConfirm: () => {
      const selected = window.tempSelected;
      if (selected.size < 2) {
        Swal.showValidationMessage('Selecciona al menos 2 agencias');
        return false;
      }
      return Array.from(selected.values());
    }
  });
  
  if (result && result.length >= 2) {
    generateRouteFromSelection(result);
  }
}

/**
 * Genera la ruta en el mapa con las agencias seleccionadas
 */
async function generateRouteFromSelection(agencies) {
  const map = getMapInstance();
  if (!map) {
    Swal.fire('Error', 'El mapa no está disponible', 'error');
    return;
  }
  
  // Eliminar ruta anterior si existe
  if (routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }
  
  // Crear waypoints en el orden seleccionado
  const waypoints = agencies.map(agency => L.latLng(agency.lat, agency.lng));
  
  // Mostrar loading
  Swal.fire({
    title: 'Generando ruta...',
    html: 'Calculando el mejor recorrido',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false
  });
  
  try {
    // Crear nueva ruta
    routeControl = L.Routing.control({
      waypoints: waypoints,
      lineOptions: {
        styles: [{ color: '#f59e0b', weight: 5, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      routeWhileDragging: false,
      draggableWaypoints: false,
      addWaypoints: false,
      createMarker: (i, wp) => {
        // Crear marcadores personalizados con números
        const marker = L.marker(wp.latLng, {
          icon: L.divIcon({
            className: 'route-marker',
            html: `<div style="background: #4f46e5; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${i + 1}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });
        
        marker.bindPopup(`
          <b>${agencies[i].name}</b><br>
          <span class="text-xs">Punto ${i + 1} de ${agencies.length}</span>
        `);
        
        return marker;
      },
      show: false,
      fitSelectedRoutes: false
    }).addTo(map);
    
    Swal.close();
    
    // Ajustar el mapa para mostrar toda la ruta
    setTimeout(() => {
      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [50, 50] });
      
      Swal.fire({
        icon: 'success',
        title: 'Ruta generada',
        text: `${agencies.length} agencias en la ruta`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }, 500);
    
  } catch (err) {
    Swal.close();
    console.error('Error generando ruta:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo generar la ruta',
      confirmButtonColor: '#4f46e5'
    });
  }
}

/**
 * Limpiar la ruta actual
 */
export function clearRoute() {
  if (routeControl) {
    const map = getMapInstance();
    if (map) map.removeControl(routeControl);
    routeControl = null;
  }
}