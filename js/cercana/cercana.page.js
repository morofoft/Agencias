import { getAllAgencies, updateAgency } from '../agencies/agencies.store.js';
import { createAgencyFromGPS } from '../agencies/agencies.actions.js';

const nearestBox = document.getElementById('closestAgency');
const list = document.getElementById('agencyList');
const btnAdd = document.getElementById('btnAddAgency');

let currentPos = null;

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

  const agencies = await getAllAgencies();

  const enriched = agencies.map(a => ({
    ...a,
    distance: distanceMeters(
      currentPos.latitude,
      currentPos.longitude,
      a.lat,
      a.lng
    )
  }))
    .sort((a, b) => a.distance - b.distance);

  if (!enriched.length) {
    nearestBox.innerHTML = `
      <div class="bg-white rounded-3xl p-6 shadow text-center opacity-60">
        <i class="fa fa-location-dot text-4xl mb-2"></i>
        <p>No hay agencias registradas</p>
      </div>`;
    return;
  }

  renderNearest(enriched[0]);
  renderList(enriched);
  renderObservations(enriched);
}

function renderNearest(a) {
  const isNear = a.distance <= 100;
  const colorClass = isNear ? 'from-emerald-500 to-teal-600' : 'from-slate-400 to-slate-500';

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
                <span>Zona ${a.zona || 'Sucursal Principal'}</span>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button onclick="goTo(${a.lat}, ${a.lng})" 
                    class="bg-white/20 hover:bg-white/30 backdrop-blur-md py-4 rounded-2xl font-bold text-sm transition">
                    <i class="fa fa-map-location-dot mr-2"></i> MAPA
                </button>
                <button onclick="registrarVisita('${a.id}')" 
                    ${!isNear ? 'disabled' : ''}
                    class="bg-white text-emerald-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                    ${isNear ? '<i class="fa fa-check-circle"></i> VISITAR' : '<i class="fa fa-lock"></i> BLOQUEDO'}
                </button>
            </div>
        </div>
      </div>`;
}
console.log("Test")
function renderList(data) {
  list.innerHTML = '';
  data.slice(1).forEach(a => {
    list.innerHTML += `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.97] transition-transform">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-500">
                        <i class="fa-solid fa-building text-lg"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800">${a.idReal}</h4>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Zona ${a.zona || 'Sucursal'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-black text-indigo-600">${Math.round(a.distance)}m</p>
                    <button onclick="goTo(${a.lat}, ${a.lng})" class="text-[10px] font-black text-slate-300 hover:text-indigo-400 uppercase">Ver ruta</button>
                </div>
            </div>
        `;
  });
}

function renderObservations(agencies) {
  const panel = document.getElementById('observationsPanel');
  if (!panel) return;

  const today = new Date();

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

  if (withNotes.length === 0) {
    panel.innerHTML = `
      <div class="text-center py-10 opacity-70">
        <i class="fa-solid fa-clipboard-list text-3xl mb-3"></i>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest italic">
          Sin reportes hoy
        </p>
      </div>`;
    return;
  }

  panel.innerHTML = withNotes.map(a => {
    const estado = a.ultimo_estado || 'Regular';

    const color =
      estado === 'Excelente' ? 'emerald' :
      estado === 'Regular'   ? 'amber'   :
      'rose';

    const hora = new Date(a.fecha_ultima_visita).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="relative pl-10">
        <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-4 border-${color}-500 z-10 shadow-sm"></div>

        <div class="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-black text-slate-800 text-sm leading-none">
                AG ${a.idReal}
              </h4>
              <span class="text-[9px] text-slate-400 font-bold uppercase">
                Hora ${hora}
              </span>
            </div>

            <span class="text-[9px] font-black px-2 py-1 rounded-lg
              bg-${color}-50 text-${color}-600 uppercase
              border border-${color}-100">
              ${estado}
            </span>
          </div>

          <p class="text-slate-500 text-xs italic leading-relaxed
            border-l-2 border-slate-100 pl-3">
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
    Swal.fire('Error', 'No se pudo acceder al GPS', 'error');
  },
  { enableHighAccuracy: true }
);


window.registrarVisita = async function (id) {
  const agencies = await getAllAgencies();
  const agency = agencies.find(a => a.id === id);

  if (!agency) return;

  const { value: formValues } = await Swal.fire({
    title: `Visita: ${agency.nombre}`,
    html: `
        <div class="text-left">
          <label class="block text-xs font-bold mb-1">ESTADO DE AGENCIA</label>
          <select id="swal-estado" class="swal2-input w-full m-0 mb-4">
            <option value="Excelente">Excelente ✅</option>
            <option value="Regular">Regular ⚠️</option>
            <option value="Crítico">Crítico ❌</option>
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

    const updatedAgency = {
      ...agency,
      fecha_ultima_visita: formValues.fecha,
      ultimo_estado: formValues.estado_visita,
      ultima_nota: formValues.notas,
      contador_visitas: (agency.contador_visitas || 0) + 1
    };

    await updateAgency(updatedAgency);

    await Swal.fire({
      icon: 'success',
      title: '¡Visita Registrada!',
      text: 'Se ha guardado en el historial local.',
      timer: 2000,
      showConfirmButton: false
    });

    loadNearby();
  }
};