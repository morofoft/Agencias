import { dbPromise } from './db/db.js';

const list = document.getElementById('agenciesList');
const counter = document.getElementById('counter');
const form = document.getElementById('agencyForm');
const searchInput = document.getElementById('searchInput');
let cachedAgencies = [];
const resultsCounter = document.getElementById('resultsCounter');
const orderSelect = document.getElementById('orderSelect');
const stateFilter = document.getElementById('stateFilter');

function filterByState(list, state) {
    if (state === 'located') {
      return list.filter(a => a.lat !== null);
    }
  
    if (state === 'pending') {
      return list.filter(a => a.lat === null);
    }
  
    return list; // all
  }
  
function sortAgencies(list, order) {
    return [...list].sort((a, b) => {
      const A = a.idReal.toUpperCase();
      const B = b.idReal.toUpperCase();
  
      if (order === 'az') return A.localeCompare(B);
      return B.localeCompare(A);
    });
  }

  
function renderResultsCounter(total, filtered) {
    if (filtered === total) {
      resultsCounter.textContent = `Mostrando ${total} agencias`;
    } else {
      resultsCounter.textContent = `Mostrando ${filtered} de ${total} agencias`;
    }
  }
  
/* ======================
   INIT
====================== */
init();

async function init() {
    cachedAgencies = await getAllAgencies();
    renderCounter(cachedAgencies);
    renderResultsCounter(cachedAgencies.length, cachedAgencies.length);
    renderAgencies(cachedAgencies);
    
  }
  
/* ======================
   STORE
====================== */
async function getAllAgencies() {
  const db = await dbPromise;
  return db.getAll('agencies');
}

async function addAgency(data) {
  const db = await dbPromise;

  const agency = {
    id: crypto.randomUUID(),
    idReal: data.idReal,
    zona: data.zona,
    direccion: data.direccion || '',
    lat: null,
    lng: null,
    estado: 'pendiente',
    created_at: new Date().toISOString(),
    synced:false
  };

  await db.add('agencies', agency);
}

async function updateAgency(agency) {
  const db = await dbPromise;
  await db.put('agencies', agency);
}

async function deleteAgency(id) {
  const db = await dbPromise;
  await db.delete('agencies', id);
}

/* ======================
   RENDER
====================== */
function renderCounter(agencies) {
  const pending = agencies.filter(a => a.lat == null).length;
  counter.textContent = `Agencias sin ubicación: ${pending}`;
}

function renderAgencies(agencies) {
    list.innerHTML = '';
  
    if (!agencies.length) {
      list.innerHTML = `
        <div class="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200/60">
          <div class="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg class="h-10 w-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
          </div>
          <p class="text-slate-600 font-bold text-lg">No hay resultados</p>
          <p class="text-slate-400 text-sm max-w-xs mx-auto">No encontramos agencias que coincidan con tu búsqueda actual.</p>
        </div>`;
      return;
    }
  
    agencies.forEach(a => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 sm:p-5 rounded-3xl card-shadow border border-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-200 transition-all group relative overflow-hidden';
  
      const statusBadge = a.lat 
        ? '<span class="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border border-emerald-100">Localizada</span>'
        : '<span class="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border border-amber-100">Sin GPS</span>';
  
      card.innerHTML = `
        <div class="flex items-center gap-5">
          <div class="hidden sm:flex h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 font-bold text-sm border border-slate-100 shadow-inner">
            ${a.idReal.substring(0,2).toUpperCase()}
          </div>
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-lg font-bold text-slate-800 tracking-tight">${a.idReal}</h3>
              ${statusBadge}
            </div>
            <div class="flex flex-col">
              <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Zona ${a.zona}</p>
              <p class="text-xs font-medium text-slate-500 line-clamp-1 max-w-[200px] md:max-w-md">${a.direccion || 'Sin dirección registrada'}</p>
            </div>
          </div>
        </div>
  
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
          ${!a.lat ? `
            <button data-gps="${a.id}" class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 active:scale-95">
              Fijar GPS
            </button>` : ''}
          
          <button data-edit="${a.id}" class="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
  
          <button data-del="${a.id}" class="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;
      list.appendChild(card);
    });
  }

/* ======================
   FORM CREATE
====================== */
form.addEventListener('submit', async e => {
  e.preventDefault();

  await addAgency({
    idReal: idReal.value.trim(),
    zona: zona.value.trim(),
    direccion: direccion.value.trim()
  });

  form.reset();

  Swal.fire({
    icon: 'success',
    title: 'Agencia creada',
    timer: 1200,
    showConfirmButton: false
  });

  init();
});

/* ======================
   ACTIONS
====================== */
function applyFilters() {
    const q = searchInput.value.toLowerCase().trim();
    const order = orderSelect.value;
    const state = stateFilter.value;
  
    let filtered = cachedAgencies;
  
    // 🔍 Buscar
    if (q) {
      filtered = filtered.filter(a =>
        a.idReal.toLowerCase().includes(q) ||
        a.zona.toLowerCase().includes(q) ||
        (a.direccion || '').toLowerCase().includes(q)
      );
    }
  
    // 📍 Estado
    filtered = filterByState(filtered, state);
  
    // 🔠 Orden
    filtered = sortAgencies(filtered, order);
  
    // 📊 Contadores
    renderCounter(filtered);
    renderResultsCounter(cachedAgencies.length, filtered.length);
  
    // 🖼 Render
    renderAgencies(filtered);
  }
  
  
  searchInput.addEventListener('input', applyFilters);
  orderSelect.addEventListener('change', applyFilters);
  
  
list.addEventListener('click', async e => {

    const btn = e.target.closest('button');
    if (!btn) return;
  
    const id =
      btn.dataset.gps ||
      btn.dataset.del ||
      btn.dataset.edit;
  
    if (!id) return;
  
    const agencies = await getAllAgencies();
    const agency = agencies.find(a => a.id === id);
  
    /* 🗑️ ELIMINAR */
    if (btn.dataset.del) {
      const res = await Swal.fire({
        title: '¿Eliminar agencia?',
        text: agency.idReal,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Eliminar'
      });
  
      if (res.isConfirmed) {
        await deleteAgency(id);
        Swal.fire('Eliminada', '', 'success');
        init();
      }
    }
  
    /* 📍 GPS */
    if (btn.dataset.gps) {
      Swal.fire({
        title: 'Obteniendo ubicación...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
  
      navigator.geolocation.getCurrentPosition(
        async pos => {
          Swal.close();
  
          agency.lat = pos.coords.latitude;
          agency.lng = pos.coords.longitude;
          agency.estado = 'ubicada';
  
          await updateAgency(agency);
  
          Swal.fire({
            icon: 'success',
            title: 'Ubicación asignada',
            timer: 1200,
            showConfirmButton: false
          });
  
          init();
        },
        () => Swal.fire('Error', 'No se pudo obtener el GPS', 'error')
      );
    }
  
    /* ✏️ EDITAR */
    if (btn.dataset.edit) {
      const { value: formValues } = await Swal.fire({
        title: 'Editar agencia',
        html: `
          <input id="swal-id" class="swal2-input" value="${agency.idReal}">
          <input id="swal-zona" class="swal2-input" value="${agency.zona}">
          <input id="swal-dir" class="swal2-input" value="${agency.direccion}">
        `,
        showCancelButton: true,
        focusConfirm: false,
        preConfirm: () => ({
          idReal: document.getElementById('swal-id').value.trim(),
          zona: document.getElementById('swal-zona').value.trim(),
          direccion: document.getElementById('swal-dir').value.trim()
        })
      });
  
      if (formValues) {
        Object.assign(agency, formValues);
        await updateAgency(agency);
  
        Swal.fire({
          icon: 'success',
          title: 'Agencia actualizada',
          timer: 1200,
          showConfirmButton: false
        });
  
        init();
      }
    }
  });
  
  searchInput.addEventListener('input', applyFilters);
  orderSelect.addEventListener('change', applyFilters);
  stateFilter.addEventListener('change', applyFilters);
  