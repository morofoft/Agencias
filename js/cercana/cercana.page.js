import { saveObservation, getAllAgencies, updateAgency } from '../agencies/agencies.store.js';
import { createAgencyFromGPS } from '../agencies/agencies.actions.js';
import { decir } from '../speech/speech.js';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

const nearestBox = document.getElementById('closestAgency');
const list = document.getElementById('agencyList');
const btnAdd = document.getElementById('btnAddAgency');

let allEnrichedAgencies = []; 
const inputSearch = document.getElementById('inputSearch');

const avisosDados = {};
let currentPos = null;
let isFirstLoad = true;
// MOSTRAR LOADING INICIAL
Swal.fire({
  title: 'Localizando...',
  text: 'Esperando señal de GPS para calcular distancias.',
  allowOutsideClick: false,
  didOpen: () => {
      Swal.showLoading();
  }
});
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function isVisitedToday(a) {
  if (!a.fecha_ultima_visita) return false;

  const visitDate = new Date(a.fecha_ultima_visita);
  const today = new Date();

  return (
    visitDate.getFullYear() === today.getFullYear() &&
    visitDate.getMonth() === today.getMonth() &&
    visitDate.getDate() === today.getDate()
  );
}


async function loadNearby() {
  if (!currentPos) return;

  if (isFirstLoad) {
    Swal.close();
    isFirstLoad = false;
  }

  const agencies = await getAllAgencies();

  // Guardamos en la variable global
  allEnrichedAgencies = agencies.map(a => ({
    ...a,
    distance: distanceMeters(
      currentPos.latitude,
      currentPos.longitude,
      a.lat,
      a.lng
    )
  })).sort((a, b) => a.distance - b.distance);

  if (!allEnrichedAgencies.length) {
    nearestBox.innerHTML = `<div class="bg-white rounded-3xl p-6 shadow text-center opacity-60">
        <i class="fa fa-location-dot text-4xl mb-2"></i>
        <p>No hay agencias registradas</p>
      </div>`;
    return;
  }

  renderNearest(allEnrichedAgencies[0]);
  
  // Si el buscador está vacío, renderiza normal, si no, mantén el filtro
  const term = inputSearch?.value.toLowerCase() || '';
  if (!term) {
    renderList(allEnrichedAgencies.slice(1));
  } else {
    // Si ya había algo escrito, mantén el filtro aplicado
    const filtered = allEnrichedAgencies.slice(1).filter(a => 
      a.idReal.toString().toLowerCase().includes(term) || 
      (a.direccion && a.direccion.toLowerCase().includes(term))
    );
    renderList(filtered);
  }

  renderObservations(allEnrichedAgencies);
}

function renderNearest(a) {
  const isNear = a.distance <= 75;
  const colorClass = isNear ? 'from-emerald-500 to-teal-600' : 'from-slate-400 to-slate-500';

  const id = a.idReal;
  
  // 1. INICIALIZACIÓN: Si no existe la agencia en el registro, la creamos
  if (!avisosDados[id]) {
    avisosDados[id] = [];
  }

  // 2. REINICIO: Si la distancia es > 200m, vaciamos sus avisos previos
  if (a.distance > 200) {
    if (avisosDados[id].length > 0) {
      console.log(`Reseteando avisos para agencia ${id} por distancia (>200m)`);
      avisosDados[id] = []; 
    } 
  }

  // 3. LÓGICA DE AVISOS (Solo si está a menos de 200m)
  // Usamos una pequeña función para evitar repetir código
  const dispararAviso = (metros) => {
    if (a.distance <= metros && !avisosDados[id].includes(metros)) {
      decir(id, `está a ${metros} metros o menos`);
      avisosDados[id].push(metros);
      return true;
    }
    return false;
  };

  // Evaluamos de menor a mayor distancia para que el aviso sea preciso
  if (!dispararAviso(10)) {
    if (!dispararAviso(30)) {
      if (!dispararAviso(50)) {
        dispararAviso(75);
      }
    }
  }

  nearestBox.classList.remove('hidden');
  nearestBox.innerHTML = `
      <div class="bg-gradient-to-br ${colorClass} text-white rounded-[2rem] p-6 shadow-xl shadow-emerald-200/50 relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div class="relative z-10">
            <div class="flex justify-between items-start mb-6">
                <span class="bg-white/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Destacada</span>
                <div class="text-right">
                    <p class="text-2xl font-black">${Math.round(a.distance)}m</p>
                    <p class="text-[10px] opacity-70 uppercase font-bold leading-none">de distancia</p>
                </div>
            </div>

            <h2 class="text-3xl font-black leading-tight mb-1">AG ${a.idReal}</h2>
            <div class="flex items-center gap-2 opacity-90 text-sm mb-8">
                <i class="fa-solid fa-location-dot"></i>
                <span>Zona ${a.zona || 'Zona'} | ${a.direccion || 'Direccion fisica!'}</span>
            </div>

            <div class="grid grid-cols-4 gap-3">
                <button onclick="goTo(${a.lat}, ${a.lng})" 
                    class="bg-white/20 hover:bg-white/30 backdrop-blur-md py-4 rounded-2xl font-bold text-sm transition">
                    <i class="fa fa-map-location-dot mr-2"></i> Mapa
                </button>
                <button onclick="copiar(${a.idReal})" 
                    class="bg-white/20 hover:bg-white/30 backdrop-blur-md py-4 rounded-2xl font-bold text-sm transition">
                    <i class="fa fa-copy mr-2"></i> Copiar
                </button>
                <button onclick="copiar(${a.idReal} + ' cerrada')" 
                    ${!isNear ? 'disabled' : ''}
                    class="bg-red-800 text-white-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                    ${isNear ? 'Cerrada' : '<i class="fa fa-lock"></i> Bloqueo'}
                </button>
                
                <button onclick="registrarVisita('${a.id}')" 
                    ${!isNear ? 'disabled' : ''}
                    class="bg-white text-emerald-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                    ${isNear ? 'Visitar' : '<i class="fa fa-lock"></i> Bloqueo'}
                </button>
            </div>
        </div>
      </div>`;
}

function renderList(data) {
  list.innerHTML = '';

  if (data.length === 0) {
    list.innerHTML = `
      <div class="text-center py-10 opacity-50">
        <i class="fa fa-magnifying-glass text-2xl mb-2"></i>
        <p class="text-xs font-bold uppercase tracking-widest">No hay coincidencias</p>
      </div>`;
    return;
  }

  // USAMOS 'data' directamente, sin .slice(1)
  data.forEach(a => {
// Dentro del data.forEach de renderList
list.innerHTML += `
  <div class="bg-white rounded-2xl p-5 shadow-md border-2 border-slate-100 flex justify-between items-center active:bg-slate-50">
      <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-inner">
              <i class="fa-solid fa-building text-xl"></i>
          </div>
          <div>
              <h4 class="font-extrabold text-lg text-slate-900">${a.idReal}</h4>
              <p class="text-[11px] font-black text-slate-600 uppercase">
                Zona ${a.zona || 'D'}
              </p>
          </div>
      </div>
      <div class="text-right">
          <p class="font-black text-xl text-indigo-700">${Math.round(a.distance)}m</p>
          <button onclick="goTo(${a.lat}, ${a.lng})"
            class="mt-1 px-4 py-2 text-xs font-black rounded-lg bg-slate-900 text-white shadow-md">
            RUTA
          </button>
      </div>
  </div>`;
  });
}

function renderObservations(agencies) {
  const panel = document.getElementById('observationsPanel');
  if (!panel) return;

  const today = new Date();

  // Filtrar solo las agencias con notas de hoy
  const withNotes = agencies.filter(a => {
    if (!a.ultima_nota || !a.fecha_ultima_visita) return false;
    const visitDate = new Date(a.fecha_ultima_visita);
    if (isNaN(visitDate)) return false;

    return (
      visitDate.getFullYear() === today.getFullYear() &&
      visitDate.getMonth() === today.getMonth() &&
      visitDate.getDate() === today.getDate()
    );
  });

  // CASO: No hay reportes
  if (withNotes.length === 0) {
    panel.innerHTML = `
      <div class="text-center py-10 opacity-70 fade-in">
        <i class="fa-solid fa-clipboard-check text-3xl mb-3 text-slate-300"></i>
        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
          Sin reportes registrados hoy
        </p>
      </div>`;
    return;
  }

  // CASO: Renderizar Notas
  panel.innerHTML = withNotes.map(a => {
    const estado = a.ultimo_estado || 'Regular';
    
    // Mapeo de colores basado en el estado
    const config = {
        'Excelente': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500' },
        'Regular': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500' },
        'Crítico': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-500' }
    };

    const style = config[estado] || config['Regular'];
    const hora = new Date(a.fecha_ultima_visita).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="relative pl-10 transition-all duration-700 fade-in">
        <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-4 ${style.border} z-10 shadow-sm"></div>

        <div class="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h4 class="font-black text-slate-800 text-sm leading-tight">
                AG ${a.idReal}
              </h4>
              <p class="text-[9px] text-slate-400 font-bold uppercase">
                <i class="fa fa-clock mr-1"></i> ${hora} | ${a.zona}
              </p>
            </div>

            <span class="text-[9px] font-black px-2 py-1 rounded-lg ${style.bg} ${style.text} uppercase border">
              ${estado}
            </span>
          </div>

          <p class="text-slate-600 text-xs leading-relaxed border-l-2 border-slate-100 pl-3 italic">
            "${a.ultima_nota}"
          </p>
        </div>
      </div>
    `;
  }).join('');
}


window.goTo = function (lat, lng) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
};

window.copiar = async function (texto) {
  try {
    await navigator.clipboard.writeText(texto);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Agencia ${texto} copiada`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });

  } catch (error) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'No se pudo copiar',
      showConfirmButton: false,
      timer: 3000
    });
  }
}


btnAdd?.addEventListener('click', async () => {

  Swal.fire({
    title: 'Obteniendo ubicación...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  navigator.geolocation.getCurrentPosition(async pos => {
    Swal.close();

    const { value: form } = await Swal.fire({
      title: '<span class="text-indigo-600">Nueva Agencia</span>',
      html: `
          <div class="p-1">
            <input id="codigo" class="swal2-input !m-2 !w-full" placeholder="Código de Agencia">
            <select id="zona" class="swal2-select !m-2 !w-full">
              <option value="">Seleccione zona</option>
              <option value="A">Zona A</option>
              <option value="B">Zona B</option>
              <option value="C">Zona C</option>
              <option value="D">Zona D</option>
              <option value="OTRA">OTRA</option>
            </select>
            <input id="direccion" class="swal2-input !m-2 !w-full" placeholder="Dirección (Opcional)">
          </div>
        `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Agencia',
      confirmButtonColor: '#4f46e5',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const codigo = document.getElementById('codigo').value;
        const zona = document.getElementById('zona').value;

        if (!codigo || !zona) {
          Swal.showValidationMessage('Código y zona son obligatorios');
          return false;
        }

        return {
          codigo: codigo,
          zona: zona,
          direccion: document.getElementById('direccion').value
        };
      }
    });

    if (!form) return;

    try {
      await createAgencyFromGPS(pos.coords, form);

      Swal.fire({
        icon: 'success',
        title: '¡Agencia Guardada!',
        text: 'Se registró en tu ubicación actual.',
        timer: 1500,
        showConfirmButton: false
      });

      await loadNearby();

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar la agencia', 'error');
    }

  }, () => {
    Swal.fire('Error', 'No se pudo obtener tu ubicación precisa', 'error');
  }, {
    enableHighAccuracy: true,
    timeout: 10000
  });
});


navigator.geolocation.watchPosition(
  pos => {
      currentPos = pos.coords;
      loadNearby();
  },
  err => {
      console.error(err);
      Swal.fire({
          icon: 'error',
          title: 'GPS no detectado',
          text: 'Activa la ubicación para ver las agencias cercanas.',
          confirmButtonText: 'Reintentar'
      }).then(() => location.reload());
  },
  { enableHighAccuracy: true }
);


window.registrarVisita = async function (id) {
  const agencies = await getAllAgencies();
  const agency = agencies.find(a => a.id === id);

  if (!agency) return;

  const { value: formValues } = await Swal.fire({
    title: `Visita: ${agency.idReal}`,
    html: `
        <div class="text-left">
          <label class="block text-xs font-bold mb-1">ESTADO DE AGENCIA</label>
          <select id="swal-estado" class="swal2-input w-full m-0 mb-4">
            <option value="Excelente">Excelente</option>
            <option value="Regular">Regular</option>
            <option value="Crítico">Crítico</option>
          </select>
          
          <label class="block text-xs font-bold mb-1">OBSERVACIONES</label>
          <textarea id="swal-notas" class="swal2-textarea w-full m-0" placeholder="Escribe aquí..."></textarea>
        </div>
      `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar Visita',
    confirmButtonColor: '#10b981',
    preConfirm: () => {
      return {
        estado_visita: document.getElementById('swal-estado').value,
        notas: document.getElementById('swal-notas').value,
        fecha: new Date().toISOString()
      }
    }
  });

  if (formValues) {
    const ahora = new Date();

    
    const nuevaObservacion = {
      agenciaId: id, // ID de la agencia
      idReal: agency.idReal, // El código AG-XXXX
      descripcion: formValues.notas,
      fecha: ahora.toLocaleDateString(), // Ejemplo: "18/01/2026"
      hora: ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // "12:15 PM"
      estado: formValues.estado_visita,
      timestamp: ahora.getTime() // Útil para ordenar por fecha real
    };

    await saveObservation(nuevaObservacion);
    const updatedAgency = {
      ...agency,
      fecha_ultima_visita: formValues.fecha,
      ultimo_estado: formValues.estado_visita,
      ultima_nota: formValues.notas,
      contador_visitas: (agency.contador_visitas || 0) + 1
    };


    await updateAgency(updatedAgency);

    Toast.fire({
      icon: 'success',
      title: '¡Visita Registrada!',
      text: `Agencia ${agency.idReal} actualizada`
    });

    loadNearby();
  }
};

inputSearch?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase().trim();
  
  if (term === "") {
    // Si está vacío, mostramos la lista normal (quitando la primera que ya se ve arriba)
    renderList(allEnrichedAgencies.slice(1));
    return;
  }

  // Buscamos en TODAS las agencias (sin slice) para que encuentre incluso la que tienes cerca
  const filtered = allEnrichedAgencies.filter(a => {
    const idReal = String(a.idReal).toLowerCase();
    const direccion = a.direccion ? String(a.direccion).toLowerCase() : "";
    
    // Comprobamos si el término está incluido en el ID o la dirección
    return idReal.includes(term) || direccion.includes(term);
  });

  renderList(filtered);
  const container = document.getElementById('scrollContainer');
  if (container) container.scrollTop = 0;
});