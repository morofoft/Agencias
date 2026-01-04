let map;
let userMarker = null;
let firstFix = true;
const SAN_JUAN = [18.8059, -71.2299];
import { setMapInstance } from './map.instance.js';


export function initMap() {
  map = L.map('map').setView(SAN_JUAN, 17);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19 }
  ).addTo(map);

  
  renderAgencies(map);
  setupCreateAgency(map);
  setMapInstance(map)
  
  return map;
}

export function updateUserPosition(map, position) {
  if (!map || !position?.lat || !position?.lng) return;

  if (!userMarker) {
    userMarker = L.circleMarker([position.lat, position.lng], {
      radius: 10,
    //   color: '#2563eb',
    //   fillColor: '#3b82f6',
      fillOpacity: 0.9
    }).addTo(map);

    userMarker.bindPopup('Mi ubicación');

    
    if (firstFix) {
      map.setView([position.lat, position.lng], 17);
      firstFix = false;
    }

    return;
  }

  userMarker.setLatLng([position.lat, position.lng]);
}

/* ============================= */
/* Helpers */
/* ============================= */

import { renderAgencies, createAgencyFromMap } from '../agencies/agencies.ui.js';

function setupCreateAgency(map) {
  map.on('click', async (e) => {
    const confirm = await Swal.fire({
      title: 'Crear agencia',
      text: '¿Agregar agencia en este punto?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    const { value: formValues } = await Swal.fire({
      title: 'Datos de la agencia',
      html: `
        <input id="codigo" class="swal2-input" placeholder="Código">
        <select id="zona" class="swal2-select">
          <option value="">Seleccione zona</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="OTRA">OTRA</option>
        </select>
        <input id="direccion" class="swal2-input" placeholder="Dirección">
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const codigo = document.getElementById('codigo').value.trim();
        const zona = document.getElementById('zona').value;
        const direccion = document.getElementById('direccion').value.trim();

        if (!codigo || !zona || !direccion) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        return { codigo, zona, direccion };
      }
    });

    if (formValues) {
      await createAgencyFromMap(e.latlng, map, formValues);
    }
  });
}
