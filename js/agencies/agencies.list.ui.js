import { getAllAgencies, updateAgency, deleteAgency } from './agencies.store.js';
import { goToAgency } from '../map/map.actions.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function renderAgenciesList(currentPos = null) {
  const agencies = await getAllAgencies();
  const container = document.getElementById('agencies-list');
  if (!container) return;
  container.innerHTML = '';

  if (!agencies.length) {
    container.innerHTML = `<div class="flex flex-col items-center justify-center py-10 opacity-30"><i class="fas fa-folder-open text-4xl mb-2"></i><p class="text-xs font-bold uppercase tracking-widest">No hay agencias</p></div>`;
    return;
  }

  if (currentPos?.lat && currentPos?.lng) {
    agencies.forEach(a => a.currentDistance = getDistance(currentPos.lat, currentPos.lng, a.lat, a.lng));
    agencies.sort((a, b) => a.currentDistance - b.currentDistance);
  }

  agencies.forEach(agency => {
    const item = document.createElement('div');
    item.className = 'p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm mb-3';

    let distanceHTML = '';
    if (agency.currentDistance !== undefined) {
      const d = agency.currentDistance;
      distanceHTML = `<div class="flex flex-col items-end mr-2"><span class="text-indigo-600 font-black text-xs">${d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'}</span><span class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Distancia</span></div>`;
    }

    item.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><i class="fas fa-building"></i></div>
        <div>
          <div class="font-bold text-slate-800 text-sm leading-tight">${agency.idReal}</div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ruta ${agency.zona}</span>
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${agency.estado === 'verde' ? 'bg-emerald-100 text-emerald-600' : agency.estado === 'amarillo' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}">${agency.estado}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${distanceHTML}
        <div class="flex items-center gap-1 border-l border-slate-200 pl-2">
          <button title="Ir" class="btn-go w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-location-dot text-xs"></i></button>
          <button title="Editar" class="btn-edit w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-pen text-xs"></i></button>
          <button title="Eliminar" class="btn-delete w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
        </div>
      </div>`;

    item.querySelector('.btn-go').onclick = () => goToAgency(agency);
    item.querySelector('.btn-delete').onclick = async () => { /* ... lógica delete igual ... */ };

    // --- LÓGICA DE EDICIÓN CON BOTÓN DE GPS ---
    item.querySelector('.btn-edit').onclick = async () => {
      let tempCoords = { lat: agency.lat, lng: agency.lng };

      const { value: formValues } = await Swal.fire({
        title: 'Editar Agencia',
        html: `
          <div class="flex flex-col gap-3 mt-4 text-left">
            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre de Agencia</label>
            <input id="swal-codigo" class="swal2-input !m-0 w-full rounded-xl" value="${agency.idReal}">
            
            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección</label>
            <input id="swal-direccion" class="swal2-input !m-0 w-full rounded-xl" value="${agency.direccion}">
            
            <div class="mt-2">
              <button type="button" id="btn-update-gps" class="w-full py-4 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-1">
                <div class="flex items-center gap-2">
                  <i class="fas fa-crosshairs"></i>
                  <span class="text-xs font-bold uppercase" id="gps-status">Actualizar a ubicación actual</span>
                </div>
                <span id="gps-diff" class="text-[10px] font-medium hidden"></span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Ruta</label>
                <select id="swal-zona" class="swal2-select !m-0 !w-full rounded-xl">
                  ${['A', 'B', 'C', 'D', 'OTRA'].map(z => `<option value="${z}" ${agency.zona === z ? 'selected' : ''}>${z}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado</label>
                <select id="swal-estado" class="swal2-select !m-0 !w-full rounded-xl">
                  <option value="verde" ${agency.estado === 'verde' ? 'selected' : ''}>🟢 Verde</option>
                  <option value="amarillo" ${agency.estado === 'amarillo' ? 'selected' : ''}>🟡 Amarillo</option>
                  <option value="rojo" ${agency.estado === 'rojo' ? 'selected' : ''}>🔴 Rojo</option>
                </select>
              </div>
            </div>
          </div>`,
        didOpen: () => {
          const btnGps = document.getElementById('btn-update-gps');
          const statusText = document.getElementById('gps-status');
          const diffText = document.getElementById('gps-diff');

          btnGps.onclick = () => {
            if (currentPos?.lat && currentPos?.lng) {
              // Calculamos la diferencia entre la vieja y la nueva
              const offset = getDistance(agency.lat, agency.lng, currentPos.lat, currentPos.lng);
              
              tempCoords = { lat: currentPos.lat, lng: currentPos.lng };
              
              // Feedback visual
              statusText.innerText = "¡Ubicación capturada!";
              diffText.innerText = `Desplazamiento: ${Math.round(offset)} metros desde el punto original`;
              diffText.classList.remove('hidden');
              
              btnGps.classList.replace('bg-slate-100', 'bg-emerald-50');
              btnGps.classList.replace('border-slate-200', 'border-emerald-200');
              btnGps.classList.replace('text-slate-600', 'text-emerald-700');

              Swal.showValidationMessage(`Nueva posición a ${Math.round(offset)}m de la anterior`);
            } else {
              Swal.showValidationMessage('Esperando señal GPS válida...');
            }
          };
        },
        preConfirm: () => {
          return {
            idReal: document.getElementById('swal-codigo').value,
            direccion: document.getElementById('swal-direccion').value,
            zona: document.getElementById('swal-zona').value,
            estado: document.getElementById('swal-estado').value,
            lat: tempCoords.lat,
            lng: tempCoords.lng
          };
        }
      });

      if (formValues) {
        Object.assign(agency, formValues, { updated_at: Date.now() });
        await updateAgency(agency);
        renderAgenciesList(currentPos);
        Swal.fire({ icon: 'success', title: 'Agencia Actualizada', timer: 1000, showConfirmButton: false });
      }
    };

    container.appendChild(item);
  });
}