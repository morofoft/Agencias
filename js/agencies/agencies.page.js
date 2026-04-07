// js/agencies/agencies.page.js - VERSIÓN OPTIMIZADA

import { createAgencyFromGPS } from './agencies.actions.js';
import { getAllAgencies, deleteAgency, updateAgency } from './agencies.store.js';

const list = document.getElementById('agencies-list');
const search = document.getElementById('search');
const btnAdd = document.getElementById('btn-add-current');
const countBadge = document.getElementById('count-badge');

let agencies = [];
let filteredAgencies = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
let searchTimeout = null;
let renderTimeout = null;
let isLoading = false;

// 🔍 Búsqueda con debounce
search.addEventListener('input', (e) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    const term = e.target.value.toLowerCase().trim();
    filterAgencies(term);
  }, 300);
});

function filterAgencies(term) {
  if (!term) {
    filteredAgencies = [...agencies];
  } else {
    filteredAgencies = agencies.filter(a =>
      a.zona?.toLowerCase().includes(term) ||
      a.idReal?.toLowerCase().includes(term) ||
      a.direccion?.toLowerCase().includes(term)
    );
  }
  
  currentPage = 1;
  renderCurrentPage();
}

// 📄 Paginación
function renderCurrentPage() {
  if (renderTimeout) clearTimeout(renderTimeout);
  
  renderTimeout = setTimeout(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredAgencies.slice(start, end);
    
    renderListOptimized(pageItems);
    renderPagination();
    updateCounters();
  }, 50);
}

// 🎨 Renderizado optimizado (usando DocumentFragment)
function renderListOptimized(data) {
  if (!list) return;
  
  const fragment = document.createDocumentFragment();
  
  if (!data.length) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'flex flex-col items-center justify-center py-12 opacity-40';
    emptyDiv.innerHTML = `
      <i class="fa fa-folder-open text-4xl mb-2"></i>
      <p class="text-sm font-medium">No hay agencias registradas</p>
    `;
    fragment.appendChild(emptyDiv);
    list.innerHTML = '';
    list.appendChild(fragment);
    return;
  }
  
  data.forEach(a => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-md p-4 space-y-3 transition-all hover:shadow-lg hover:-translate-y-0.5';
    card.setAttribute('data-id', a.id);
    
    // Determinar color de estado
    let estadoColor = '';
    let estadoText = '';
    switch (a.estado) {
      case 'verde':
        estadoColor = 'bg-emerald-100 text-emerald-600';
        estadoText = 'VERDE';
        break;
      case 'amarillo':
        estadoColor = 'bg-amber-100 text-amber-600';
        estadoText = 'AMARILLO';
        break;
      default:
        estadoColor = 'bg-red-100 text-red-600';
        estadoText = 'ROJO';
    }
    
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-lg">AG ${a.idReal || 'Sin código'}</h3>
          <p class="text-xs text-slate-400">Zona ${a.zona || 'Sin zona'}</p>
        </div>
        <span class="px-2 py-1 text-xs rounded-full font-bold ${estadoColor}">
          ${estadoText}
        </span>
      </div>
      <div class="text-sm text-slate-600 space-y-1">
        <div class="flex items-center gap-2">
          <i class="fa fa-location-dot w-4 text-slate-400"></i>
          <span class="truncate">${a.direccion || 'Sin dirección'}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-map w-4 text-slate-400"></i>
          <span>${a.lat ? `${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}` : 'Sin coordenadas'}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-repeat w-4 text-slate-400"></i>
          <span>Visitas: ${a.contador_visitas || 0}</span>
        </div>
      </div>
      <div class="flex justify-between pt-2 border-t text-xs font-bold">
        <button class="text-blue-600 hover:text-blue-800 transition-colors btn-go" data-id="${a.id}">
          <i class="fa fa-location-dot mr-1"></i> IR
        </button>
        <button class="text-amber-600 hover:text-amber-800 transition-colors btn-edit" data-id="${a.id}">
          <i class="fa fa-pen mr-1"></i> EDITAR
        </button>
        <button class="text-emerald-600 hover:text-emerald-800 transition-colors btn-visit" data-id="${a.id}">
          <i class="fa fa-check-circle mr-1"></i> VISITAR
        </button>
        <button class="text-red-600 hover:text-red-800 transition-colors btn-delete" data-id="${a.id}">
          <i class="fa fa-trash mr-1"></i> ELIMINAR
        </button>
      </div>
    `;
    
    fragment.appendChild(card);
  });
  
  // Reemplazar contenido de forma eficiente
  list.innerHTML = '';
  list.appendChild(fragment);
}

// 📑 Renderizar paginación
function renderPagination() {
  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
  
  if (totalPages <= 1) {
    const existingPag = document.querySelector('.pagination-container');
    if (existingPag) existingPag.remove();
    return;
  }
  
  let pagContainer = document.querySelector('.pagination-container');
  if (!pagContainer) {
    pagContainer = document.createElement('div');
    pagContainer.className = 'pagination-container flex justify-center gap-2 mt-6 mb-4';
    list.parentNode.insertBefore(pagContainer, list.nextSibling);
  }
  
  pagContainer.innerHTML = `
    <button class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
      ${currentPage === 1 ? 'disabled' : ''} data-page="prev">
      <i class="fa fa-chevron-left"></i>
    </button>
    <span class="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold">${currentPage} / ${totalPages}</span>
    <button class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
      ${currentPage === totalPages ? 'disabled' : ''} data-page="next">
      <i class="fa fa-chevron-right"></i>
    </button>
  `;
  
  // Event listeners para paginación
  pagContainer.querySelectorAll('[data-page]').forEach(btn => {
    btn.removeEventListener('click', handlePagination);
    btn.addEventListener('click', handlePagination);
  });
}

function handlePagination(e) {
  const btn = e.currentTarget;
  const direction = btn.dataset.page;
  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
  
  if (direction === 'prev' && currentPage > 1) {
    currentPage--;
  } else if (direction === 'next' && currentPage < totalPages) {
    currentPage++;
  }
  
  renderCurrentPage();
  // Scroll suave al inicio de la lista
  list.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateCounters() {
  if (countBadge) {
    countBadge.textContent = filteredAgencies.length;
  }
}

// 🚀 Cargar agencias (con cache)
let agenciesCache = null;
let lastLoadTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

async function loadAgencies(force = false) {
  if (isLoading) return;
  
  const now = Date.now();
  if (!force && agenciesCache && (now - lastLoadTime) < CACHE_DURATION) {
    agencies = agenciesCache;
    filteredAgencies = [...agencies];
    renderCurrentPage();
    return;
  }
  
  isLoading = true;
  
  // Mostrar skeleton loading
  showSkeleton();
  
  try {
    agencies = await getAllAgencies();
    agenciesCache = agencies;
    lastLoadTime = now;
    filteredAgencies = [...agencies];
    renderCurrentPage();
  } catch (error) {
    console.error('Error loading agencies:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las agencias',
      timer: 2000,
      showConfirmButton: false
    });
  } finally {
    isLoading = false;
  }
}

function showSkeleton() {
  if (!list) return;
  
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 5; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'bg-white rounded-2xl shadow-md p-4 space-y-3 animate-pulse';
    skeleton.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div class="h-5 bg-slate-200 rounded w-32 mb-1"></div>
          <div class="h-3 bg-slate-100 rounded w-20"></div>
        </div>
        <div class="h-6 bg-slate-200 rounded-full w-16"></div>
      </div>
      <div class="space-y-2">
        <div class="h-4 bg-slate-100 rounded w-full"></div>
        <div class="h-4 bg-slate-100 rounded w-3/4"></div>
      </div>
      <div class="flex justify-between pt-2">
        <div class="h-6 bg-slate-200 rounded w-12"></div>
        <div class="h-6 bg-slate-200 rounded w-12"></div>
        <div class="h-6 bg-slate-200 rounded w-12"></div>
      </div>
    `;
    fragment.appendChild(skeleton);
  }
  list.innerHTML = '';
  list.appendChild(fragment);
}

// ✏️ Editar agencia
async function editAgency(agency) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar Agencia',
    html: `
      <div class="text-left space-y-3">
        <div>
          <label class="text-xs font-bold text-slate-500">Código</label>
          <input id="edit-codigo" class="swal2-input w-full mt-1" value="${agency.idReal || ''}">
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500">Zona</label>
          <select id="edit-zona" class="swal2-select w-full mt-1">
            <option value="A" ${agency.zona === 'A' ? 'selected' : ''}>Zona A</option>
            <option value="B" ${agency.zona === 'B' ? 'selected' : ''}>Zona B</option>
            <option value="C" ${agency.zona === 'C' ? 'selected' : ''}>Zona C</option>
            <option value="D" ${agency.zona === 'D' ? 'selected' : ''}>Zona D</option>
            <option value="OTRA" ${agency.zona === 'OTRA' ? 'selected' : ''}>OTRA</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500">Dirección</label>
          <input id="edit-direccion" class="swal2-input w-full mt-1" value="${agency.direccion || ''}">
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500">Estado</label>
          <select id="edit-estado" class="swal2-select w-full mt-1">
            <option value="verde" ${agency.estado === 'verde' ? 'selected' : ''}>🟢 Verde</option>
            <option value="amarillo" ${agency.estado === 'amarillo' ? 'selected' : ''}>🟡 Amarillo</option>
            <option value="rojo" ${agency.estado === 'rojo' ? 'selected' : ''}>🔴 Rojo</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    confirmButtonColor: '#f59e0b',
    preConfirm: () => ({
      idReal: document.getElementById('edit-codigo').value.trim(),
      zona: document.getElementById('edit-zona').value,
      direccion: document.getElementById('edit-direccion').value.trim(),
      estado: document.getElementById('edit-estado').value
    })
  });
  
  if (formValues) {
    Object.assign(agency, formValues, { updated_at: Date.now() });
    await updateAgency(agency);
    
    // Actualizar cache
    const index = agencies.findIndex(a => a.id === agency.id);
    if (index !== -1) agencies[index] = agency;
    if (agenciesCache) {
      const cacheIndex = agenciesCache.findIndex(a => a.id === agency.id);
      if (cacheIndex !== -1) agenciesCache[cacheIndex] = agency;
    }
    
    filteredAgencies = [...agencies];
    renderCurrentPage();
    
    Swal.fire({
      icon: 'success',
      title: 'Actualizada',
      text: 'Agencia modificada correctamente',
      timer: 1500,
      showConfirmButton: false
    });
  }
}

// 🗑️ Eliminar agencia
async function deleteAgencyById(id, agencyName) {
  const result = await Swal.fire({
    title: '¿Eliminar agencia?',
    text: `AG ${agencyName} será eliminada permanentemente`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  
  if (result.isConfirmed) {
    await deleteAgency(id);
    
    // Actualizar cache
    agencies = agencies.filter(a => a.id !== id);
    agenciesCache = agencies;
    filteredAgencies = [...agencies];
    
    // Ajustar página si es necesario
    const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    
    renderCurrentPage();
    
    Swal.fire({
      icon: 'success',
      title: 'Eliminada',
      text: 'Agencia removida del sistema',
      timer: 1500,
      showConfirmButton: false
    });
  }
}

// 📍 Visitar agencia (abrir en maps)
function visitAgency(agency) {
  if (agency.lat && agency.lng) {
    window.open(`https://www.google.com/maps?q=${agency.lat},${agency.lng}`, '_blank');
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Sin coordenadas',
      text: 'Esta agencia no tiene ubicación GPS registrada',
      timer: 2000,
      showConfirmButton: false
    });
  }
}

// 🎯 Manejo de eventos con delegación (más eficiente)
list.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const card = btn.closest('[data-id]');
  if (!card) return;
  
  const agencyId = card.dataset.id;
  const agency = agencies.find(a => a.id === agencyId);
  if (!agency) return;
  
  if (btn.classList.contains('btn-go')) {
    visitAgency(agency);
  } else if (btn.classList.contains('btn-edit')) {
    await editAgency(agency);
  } else if (btn.classList.contains('btn-delete')) {
    await deleteAgencyById(agencyId, agency.idReal);
  } else if (btn.classList.contains('btn-visit')) {
    visitAgency(agency);
  }
});

// ➕ Crear agencia desde GPS
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
        <div class="text-left space-y-3">
          <div>
            <label class="text-xs font-bold text-slate-500">Código *</label>
            <input id="codigo" class="swal2-input w-full mt-1" placeholder="Ej: 8125001">
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500">Zona *</label>
            <select id="zona" class="swal2-select w-full mt-1">
              <option value="">Seleccione zona</option>
              <option value="A">Zona A</option>
              <option value="B">Zona B</option>
              <option value="C">Zona C</option>
              <option value="D">Zona D</option>
              <option value="OTRA">OTRA</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500">Dirección</label>
            <input id="direccion" class="swal2-input w-full mt-1" placeholder="Calle, número...">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const codigo = document.getElementById('codigo').value.trim();
        const zona = document.getElementById('zona').value;
        
        if (!codigo || !zona) {
          Swal.showValidationMessage('Código y zona son obligatorios');
          return false;
        }
        
        return {
          codigo,
          zona,
          direccion: document.getElementById('direccion').value.trim()
        };
      }
    });
    
    if (form) {
      await createAgencyFromGPS(pos.coords, form);
      
      // Recargar datos (forzar)
      agenciesCache = null;
      await loadAgencies(true);
      
      Swal.fire({
        icon: 'success',
        title: '¡Agencia creada!',
        text: 'Se ha registrado en tu ubicación actual',
        timer: 1500,
        showConfirmButton: false
      });
    }
    
  }, () => {
    Swal.fire('Error', 'No se pudo obtener tu ubicación', 'error');
  }, {
    enableHighAccuracy: true,
    timeout: 10000
  });
});

// 🔄 Recargar manual (pull to refresh opcional)
let touchStart = 0;
list.addEventListener('touchstart', (e) => {
  touchStart = e.touches[0].clientY;
});
list.addEventListener('touchend', async (e) => {
  const touchEnd = e.changedTouches[0].clientY;
  if (touchEnd - touchStart > 100 && list.scrollTop === 0) {
    agenciesCache = null;
    await loadAgencies(true);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Actualizado',
      showConfirmButton: false,
      timer: 1500
    });
  }
});

// 🚀 Inicializar
loadAgencies();