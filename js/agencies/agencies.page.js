import { createAgencyFromGPS } from './agencies.actions.js';
import { getAllAgencies } from './agencies.store.js';

const list = document.getElementById('agencies-list');
const search = document.getElementById('search');
const btnAdd = document.getElementById('btn-add-current');
const countBadge = document.getElementById('count-badge');

let agencies = [];

/* ===============================
   CARGAR Y RENDERIZAR AGENCIAS
================================ */

async function loadAgencies() {
  agencies = await getAllAgencies();
  renderList(agencies);
}

function renderList(data) {
  list.innerHTML = '';

  if (countBadge) countBadge.textContent = data.length;

  if (!data.length) {
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 opacity-40">
        <i class="fa fa-folder-open text-4xl mb-2"></i>
        <p class="text-sm font-medium">No hay agencias registradas</p>
      </div>`;
    return;
  }

  data.forEach(a => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-md p-4 space-y-3';

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-lg">AG ${a.idReal}</h3>
          <p class="text-xs text-slate-400">Zona ${a.zona}</p>
        </div>

        <span class="px-2 py-1 text-xs rounded-full font-bold
          ${a.estado === 'verde'
            ? 'bg-emerald-100 text-emerald-600'
            : a.estado === 'amarillo'
            ? 'bg-amber-100 text-amber-600'
            : 'bg-red-100 text-red-600'}">
          ${a.estado.toUpperCase()}
        </span>
      </div>

      <div class="text-sm text-slate-600 space-y-1">
        <div class="flex items-center gap-2">
          <i class="fa fa-location-dot"></i>
          <span>${a.direccion || 'Sin dirección'}</span>
        </div>

        <div class="flex items-center gap-2">
          <i class="fa fa-map"></i>
          <span>${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}</span>
        </div>

        <div class="flex items-center gap-2">
          <i class="fa fa-repeat"></i>
          <span>Visitas: ${a.contador_visitas || 0}</span>
        </div>
      </div>

      <div class="flex justify-between pt-2 border-t text-xs font-bold">
        <button class="text-blue-600 btn-go" data-id="${a.id}">📍 IR</button>
        <button class="text-amber-600 btn-edit" data-id="${a.id}">✏️ EDITAR</button>
        <button class="text-emerald-600 btn-visit" data-id="${a.id}">✔ VISITAR</button>
      </div>
    `;

    list.appendChild(card);
  });
}

/* ===============================
   BUSCADOR
================================ */

search.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
console.log(agencies)
  const filtered = agencies.filter(a =>
    a.zona.toLowerCase().includes(q) ||
    (a.idReal && a.idReal.toLowerCase().includes(q))
  );

  renderList(filtered);
});

/* ===============================
   CREAR AGENCIA DESDE GPS
================================ */

btnAdd.addEventListener('click', async () => {

  if (!navigator.geolocation) {
    Swal.fire('Error', 'Tu dispositivo no soporta GPS', 'error');
    return;
  }

  Swal.fire({
    title: 'Obteniendo ubicación…',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false
  });

  navigator.geolocation.getCurrentPosition(async pos => {

    Swal.close();

    const { value: form } = await Swal.fire({
      title: 'Nueva Agencia',
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
        const codigo = document.getElementById('codigo').value;
        const zona = document.getElementById('zona').value;

        if (!codigo || !zona) {
          Swal.showValidationMessage('Código y zona son obligatorios');
          return false;
        }

        return {
          codigo: document.getElementById('codigo').value,
          zona: document.getElementById('zona').value,
          direccion: document.getElementById('direccion').value
        };
      }
    });

    if (!form) return;

    await createAgencyFromGPS(pos.coords, form);

    Swal.fire({
      icon: 'success',
      title: 'Agencia creada',
      timer: 1500,
      showConfirmButton: false
    });

    await loadAgencies();

  }, () => {
    Swal.fire('Error', 'No se pudo obtener tu ubicación', 'error');
  }, {
    enableHighAccuracy: true,
    timeout: 10000
  });
});

/* ===============================
   INIT
================================ */

loadAgencies();