// js/cercana/cercana.page.js - VERSIÓN ULTRA RÁPIDA

import { getAllAgencies, updateAgency } from '../agencies/agencies.store.js';
import { createAgencyFromGPS } from '../agencies/agencies.actions.js';
import { decir } from '../speech/speech.js';

// ============================================
// CONFIGURACIÓN DE RENDIMIENTO
// ============================================
const UPDATE_INTERVAL = 5000; // 5 segundos entre actualizaciones
const MIN_DISTANCE_CHANGE = 3; // Solo actualizar si cambió más de 3 metros
const MAX_AGENCIES_TO_RENDER = 50; // Máximo de agencias a mostrar

// Cache de datos
let agenciesLight = []; // Solo datos necesarios: { id, idReal, zona, lat, lng }
let currentPos = null;
let lastRenderDistance = null;
let lastUpdateTime = 0;
let renderTimeout = null;
let searchTimeout = null;
let isFirstLoad = true;
let lastClosestId = null;

// Cache de distancias para evitar recálculos
const distanceCache = new Map();
const CACHE_MAX_SIZE = 500;

// Toast config
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true
});

// ============================================
// FUNCIONES DE DISTANCIA OPTIMIZADAS
// ============================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const cacheKey = `${lat1.toFixed(4)},${lon1.toFixed(4)}-${lat2.toFixed(4)},${lon2.toFixed(4)}`;
  
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey);
  }
  
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  
  // Cache solo distancias menores a 2km
  if (distance < 2000 && distanceCache.size < CACHE_MAX_SIZE) {
    distanceCache.set(cacheKey, distance);
  }
  
  return distance;
}

// Limpiar caché periódicamente
setInterval(() => {
  if (distanceCache.size > CACHE_MAX_SIZE) {
    const keys = Array.from(distanceCache.keys());
    const toDelete = keys.slice(0, CACHE_MAX_SIZE / 2);
    toDelete.forEach(key => distanceCache.delete(key));
  }
}, 60000);

// ============================================
// CARGA LIGERA DE AGENCIAS (solo datos necesarios)
// ============================================
async function loadAgenciesLight() {
  const fullAgencies = await getAllAgencies();
  
  // Filtrar y mapear solo lo necesario
  agenciesLight = fullAgencies
    .filter(a => a.lat && a.lng && a.idReal)
    .map(a => ({
      id: a.id,
      idReal: a.idReal,
      zona: a.zona || 'Sin zona',
      lat: a.lat,
      lng: a.lng,
      // Datos adicionales solo para la agencia más cercana
      direccion: a.direccion,
      estado: a.estado,
      contador_visitas: a.contador_visitas,
      ultima_nota: a.ultima_nota,
      ultimo_estado: a.ultimo_estado,
      fecha_ultima_visita: a.fecha_ultima_visita
    }));
  
  console.log(`📋 ${agenciesLight.length} agencias cargadas (modo ligero)`);
  return agenciesLight;
}

// ============================================
// CÁLCULO DE DISTANCIAS (solo para las necesarias)
// ============================================
function calculateDistances() {
  if (!currentPos) return [];
  
  // Calcular distancias solo para las primeras N agencias (optimización)
  const withDistances = agenciesLight.map(agency => ({
    ...agency,
    distance: haversineDistance(
      currentPos.latitude, currentPos.longitude,
      agency.lat, agency.lng
    )
  }));
  
  // Ordenar y limitar
  withDistances.sort((a, b) => a.distance - b.distance);
  
  return withDistances;
}

// ============================================
// RENDERIZADO ULTRARÁPIDO (solo lo visible)
// ============================================
function renderNearest(agency) {
  const nearestBox = document.getElementById('closestAgency');
  if (!nearestBox || !agency) return;
  
  const isNear = agency.distance <= 75;
  const colorClass = isNear ? 'from-emerald-500 to-teal-600' : 'from-slate-400 to-slate-500';
  
  nearestBox.innerHTML = `
    <div class="bg-gradient-to-br ${colorClass} text-white rounded-[2rem] p-5 shadow-xl relative overflow-hidden">
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-4">
          <span class="bg-white/20 text-[10px] font-black px-3 py-1 rounded-full">DESTACADA</span>
          <div class="text-right">
            <p class="text-2xl font-black">${Math.round(agency.distance)}<span class="text-sm">m</span></p>
          </div>
        </div>
        <h2 class="text-2xl font-black mb-1">AG ${agency.idReal}</h2>
        <div class="flex items-center gap-2 text-xs opacity-90 mb-5">
          <i class="fa-solid fa-location-dot"></i>
          <span>Zona ${agency.zona}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.goTo(${agency.lat}, ${agency.lng})" 
            class="bg-white/20 hover:bg-white/30 py-3 rounded-xl text-sm font-bold transition">
            <i class="fa fa-map"></i> Mapa
          </button>
          <button onclick="window.copiar('${agency.idReal}')" 
            class="bg-white/20 hover:bg-white/30 py-3 rounded-xl text-sm font-bold transition">
            <i class="fa fa-copy"></i> Copiar
          </button>
          <button onclick="window.registrarVisita('${agency.id}')" 
            ${!isNear ? 'disabled' : ''}
            class="col-span-2 bg-white text-emerald-600 py-3 rounded-xl font-black text-sm transition active:scale-95 ${!isNear ? 'opacity-50' : ''}">
            ${isNear ? '📝 Registrar Visita' : '🔒 Demasiado lejos'}
          </button>
        </div>
      </div>
    </div>`;
}

function renderList(agencies) {
  const listContainer = document.getElementById('agencyList');
  if (!listContainer) return;
  
  // Limitar cantidad de agencias a mostrar
  const toShow = agencies.slice(0, MAX_AGENCIES_TO_RENDER);
  
  if (toShow.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-10 opacity-50">
        <i class="fa fa-magnifying-glass text-2xl mb-2"></i>
        <p class="text-xs font-bold">No hay agencias cercanas</p>
      </div>`;
    return;
  }
  
  // Build HTML de forma eficiente
  let html = '';
  for (const a of toShow) {
    html += `
      <div class="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <i class="fa-solid fa-building text-sm"></i>
          </div>
          <div>
            <h4 class="font-bold text-base">${a.idReal}</h4>
            <p class="text-[10px] font-bold text-slate-500">Zona ${a.zona}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-black text-lg text-indigo-700">${Math.round(a.distance)}<span class="text-xs">m</span></p>
          <button onclick="window.goTo(${a.lat}, ${a.lng})" class="mt-1 px-3 py-1.5 text-[10px] font-black rounded-lg bg-slate-900 text-white">
            RUTA
          </button>
        </div>
      </div>`;
  }
  
  listContainer.innerHTML = html;
}

function renderObservations(agencies) {
  const panel = document.getElementById('observationsPanel');
  if (!panel) return;
  
  const today = new Date().toDateString();
  
  const withNotes = agencies.filter(a => {
    if (!a.ultima_nota || !a.fecha_ultima_visita) return false;
    const visitDate = new Date(a.fecha_ultima_visita).toDateString();
    return visitDate === today;
  });
  
  if (withNotes.length === 0) {
    panel.innerHTML = `
      <div class="text-center py-8 opacity-60">
        <i class="fa-solid fa-clipboard-list text-2xl mb-2 text-slate-300"></i>
        <p class="text-[10px] text-slate-400 font-bold">Sin reportes hoy</p>
      </div>`;
    return;
  }
  
  let html = '';
  for (const a of withNotes.slice(0, 5)) { // Máximo 5 observaciones
    const estado = a.ultimo_estado || 'Regular';
    const color = estado === 'Excelente' ? 'emerald' : (estado === 'Crítico' ? 'rose' : 'amber');
    const hora = new Date(a.fecha_ultima_visita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    html += `
      <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-${color}-500">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-bold text-sm">AG ${a.idReal}</h4>
            <p class="text-[9px] text-slate-400">${hora} • Zona ${a.zona}</p>
          </div>
          <span class="text-[9px] font-bold px-2 py-1 rounded-full bg-${color}-50 text-${color}-600">
            ${estado}
          </span>
        </div>
        <p class="text-xs text-slate-600 italic">"${a.ultima_nota.substring(0, 80)}${a.ultima_nota.length > 80 ? '...' : ''}"</p>
      </div>`;
  }
  
  panel.innerHTML = html;
}

// ============================================
// ACTUALIZACIÓN PRINCIPAL (con throttle)
// ============================================
async function updateNearby(force = false) {
  if (!currentPos) return;
  
  const now = Date.now();
  if (!force && (now - lastUpdateTime) < UPDATE_INTERVAL) return;
  lastUpdateTime = now;
  
  // Calcular distancias
  const agenciesWithDist = calculateDistances();
  if (agenciesWithDist.length === 0) return;
  
  const closest = agenciesWithDist[0];
  const closestDistance = Math.round(closest.distance);
  
  // Verificar si hubo cambio significativo
  const needsUpdate = force || 
    lastClosestId !== closest.id ||
    Math.abs((lastRenderDistance || 0) - closestDistance) > MIN_DISTANCE_CHANGE;
  
  if (!needsUpdate && !force) return;
  
  lastClosestId = closest.id;
  lastRenderDistance = closestDistance;
  
  // Renderizar
  renderNearest(closest);
  renderList(agenciesWithDist.slice(1));
  renderObservations(agenciesWithDist);
  
  // Aviso de voz (solo si cambió significativamente)
  if (needsUpdate && closestDistance <= 75) {
    const thresholds = [10, 30, 50, 75];
    for (const t of thresholds) {
      if (closestDistance <= t && !window[`avisado_${closest.id}_${t}`]) {
        decir(closest.idReal, `está a ${t} metros`);
        window[`avisado_${closest.id}_${t}`] = true;
        break;
      }
    }
  }
  
  // Cerrar loading inicial
  if (isFirstLoad) {
    Swal.close();
    isFirstLoad = false;
  }
}

// ============================================
// BÚSQUEDA CON DEBOUNCE
// ============================================
function setupSearch() {
  const input = document.getElementById('inputSearch');
  if (!input) return;
  
  input.addEventListener('input', (e) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        const agencies = calculateDistances();
        renderList(agencies.slice(1));
        return;
      }
      
      const agencies = calculateDistances();
      const filtered = agencies.slice(1).filter(a => 
        a.idReal.toLowerCase().includes(term) ||
        a.zona.toLowerCase().includes(term)
      );
      renderList(filtered);
    }, 300);
  });
}

// ============================================
// GPS WATCH (optimizado)
// ============================================
let lastGpsUpdate = 0;
let lastValidLat = null;
let lastValidLng = null;

function startGpsWatch() {
  if (!navigator.geolocation) {
    Swal.fire('Error', 'GPS no disponible', 'error');
    return;
  }
  
  // Mostrar loading inicial
  Swal.fire({
    title: 'Localizando...',
    text: 'Esperando señal GPS',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
  
  navigator.geolocation.watchPosition(
    (pos) => {
      const now = Date.now();
      const { latitude, longitude, accuracy } = pos.coords;
      
      // Filtrar lecturas de baja precisión
      if (accuracy > 100) return;
      
      // Verificar si la posición cambió significativamente
      const hasChanged = !lastValidLat || 
        Math.abs(latitude - lastValidLat) > 0.0001 ||
        Math.abs(longitude - lastValidLng) > 0.0001;
      
      if (!hasChanged && (now - lastGpsUpdate) < UPDATE_INTERVAL) return;
      
      lastGpsUpdate = now;
      lastValidLat = latitude;
      lastValidLng = longitude;
      currentPos = { latitude, longitude, accuracy };
      
      updateNearby();
    },
    (err) => {
      console.error('GPS error:', err);
      Swal.fire({
        icon: 'error',
        title: 'GPS no disponible',
        text: 'Activa la ubicación para ver agencias cercanas',
        confirmButtonText: 'Reintentar'
      }).then(() => location.reload());
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );
}

// ============================================
// FUNCIONES GLOBALES
// ============================================
window.goTo = (lat, lng) => {
  //window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
};

window.copiar = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    Toast.fire({ icon: 'success', title: `Copiado: ${texto}` });
  } catch {
    Toast.fire({ icon: 'error', title: 'No se pudo copiar' });
  }
};

window.registrarVisita = async (id) => {
  const agency = agenciesLight.find(a => a.id === id);
  if (!agency) return;
  
  const { value: form } = await Swal.fire({
    title: `Visita: AG ${agency.idReal}`,
    html: `
      <div class="text-left">
        <label class="block text-xs font-bold mb-1">ESTADO</label>
        <select id="estado" class="swal2-input w-full mb-3">
          <option value="Excelente">✅ Excelente</option>
          <option value="Regular">⚠️ Regular</option>
          <option value="Crítico">🔴 Crítico</option>
        </select>
        <label class="block text-xs font-bold mb-1">OBSERVACIÓN</label>
        <textarea id="notas" class="swal2-textarea w-full" placeholder="Escribe aquí..." rows="3"></textarea>
      </div>
    `,
    confirmButtonText: 'Guardar',
    confirmButtonColor: '#10b981',
    preConfirm: () => ({
      estado: document.getElementById('estado').value,
      notas: document.getElementById('notas').value
    })
  });
  
  if (form) {
    const fullAgency = await (await getAllAgencies()).find(a => a.id === id);
    if (fullAgency) {
      fullAgency.fecha_ultima_visita = new Date().toISOString();
      fullAgency.ultimo_estado = form.estado;
      fullAgency.ultima_nota = form.notas;
      fullAgency.contador_visitas = (fullAgency.contador_visitas || 0) + 1;
      await updateAgency(fullAgency);
      
      // Recargar datos ligeros
      await loadAgenciesLight();
      
      Toast.fire({ icon: 'success', title: 'Visita registrada' });
      updateNearby(true);
    }
  }
};

// ============================================
// BOTÓN AGREGAR AGENCIA
// ============================================
document.getElementById('btnAddAgency')?.addEventListener('click', async () => {
  Swal.fire({ title: 'Obteniendo ubicación...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    Swal.close();
    
    const { value: form } = await Swal.fire({
      title: 'Nueva Agencia',
      html: `
        <input id="codigo" class="swal2-input" placeholder="Código (ej: 8125001)">
        <select id="zona" class="swal2-select">
          <option value="">Seleccione zona</option>
          <option value="A">Zona A</option><option value="B">Zona B</option>
          <option value="C">Zona C</option><option value="D">Zona D</option>
        </select>
        <input id="direccion" class="swal2-input" placeholder="Dirección">
      `,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const codigo = document.getElementById('codigo').value;
        const zona = document.getElementById('zona').value;
        if (!codigo || !zona) return Swal.showValidationMessage('Código y zona requeridos');
        return { codigo, zona, direccion: document.getElementById('direccion').value };
      }
    });
    
    if (form) {
      await createAgencyFromGPS(pos.coords, form);
      await loadAgenciesLight();
      Toast.fire({ icon: 'success', title: 'Agencia creada' });
      updateNearby(true);
    }
  }, () => Swal.fire('Error', 'No se pudo obtener ubicación', 'error'));
});

// ============================================
// INICIALIZACIÓN
// ============================================
(async function init() {
  await loadAgenciesLight();
  setupSearch();
  startGpsWatch();
})();