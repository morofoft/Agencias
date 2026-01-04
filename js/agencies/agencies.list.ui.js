import { getAllAgencies, updateAgency, deleteAgency } from './agencies.store.js';
import { goToAgency } from '../map/map.actions.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';

export async function renderAgenciesList() {
  const agencies = await getAllAgencies();
  const container = document.getElementById('agencies-list');

  container.innerHTML = '';

  if (!agencies.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-10 opacity-30">
        <i class="fas fa-folder-open text-4xl mb-2"></i>
        <p class="text-xs font-bold uppercase tracking-widest">No hay agencias</p>
      </div>`;
    return;
  }

  agencies.forEach(agency => {
    const item = document.createElement('div');
    // Clase de tarjeta moderna
    item.className = 'p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm mb-3';

    item.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <i class="fas fa-building"></i>
        </div>
        <div>
          <div class="font-bold text-slate-800 text-sm leading-tight">${agency.idReal}</div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${agency.zona}</span>
            <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase 
              ${agency.estado === 'verde' ? 'bg-emerald-100 text-emerald-600' : 
                agency.estado === 'amarillo' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}">
              ${agency.estado}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button title="Ir a ubicación" class="btn-go w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
          <i class="fas fa-location-dot text-xs"></i>
        </button>
        <button title="Editar" class="btn-edit w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center shadow-sm">
          <i class="fas fa-pen text-xs"></i>
        </button>
        <button title="Eliminar" class="btn-delete w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
          <i class="fas fa-trash text-xs"></i>
        </button>
      </div>
    `;

    // Asignación de eventos optimizada
    item.querySelector('.btn-go').onclick = () => goToAgency(agency);

    item.querySelector('.btn-edit').onclick = async () => {
      const { value: formValues } = await Swal.fire({
        title: 'Editar Agencia',
        customClass: {
          popup: 'rounded-3xl',
          confirmButton: 'rounded-xl px-6',
          cancelButton: 'rounded-xl'
        },
        html: `
          <div class="flex flex-col gap-3 mt-4 text-left">
            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Agencia</label>
            <input id="codigo" class="swal2-input !m-0 w-full rounded-xl border-slate-200" placeholder="Ej. Agencia Central" value="${agency.idReal}">
            
            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección Exacta</label>
            <input id="direccion" class="swal2-input !m-0 w-full rounded-xl border-slate-200" placeholder="Calle, número..." value="${agency.direccion}">
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Zona / Ruta</label>
                <select id="zona" class="swal2-select !m-0 !w-full rounded-xl border-slate-200">
                  ${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'OTRA'].map(z => 
                    `<option value="${z}" ${agency.zona === z ? 'selected' : ''}>Ruta ${z}</option>`
                  ).join('')}
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado Operativo</label>
                <select id="estado" class="swal2-select !m-0 !w-full rounded-xl border-slate-200">
                  <option value="verde" ${agency.estado === 'verde' ? 'selected' : ''}>🟢 Verde</option>
                  <option value="amarillo" ${agency.estado === 'amarillo' ? 'selected' : ''}>🟡 Amarillo</option>
                  <option value="rojo" ${agency.estado === 'rojo' ? 'selected' : ''}>🔴 Rojo</option>
                </select>
              </div>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        confirmButtonColor: '#4f46e5',
        preConfirm: () => {
          const idReal = document.getElementById('codigo').value.trim();
          const direccion = document.getElementById('direccion').value.trim();
          const zona = document.getElementById('zona').value;
          const estado = document.getElementById('estado').value;

          if (!idReal || !direccion) {
            Swal.showValidationMessage('Por favor completa los campos');
            return false;
          }
          return { idReal, direccion, zona, estado };
        }
      });

      if (formValues) {
        Object.assign(agency, formValues, { updated_at: Date.now() });
        await updateAgency(agency);
        renderAgenciesList();
      }
    };

    item.querySelector('.btn-delete').onclick = async () => {
      const result = await Swal.fire({
        title: '¿Confirmar eliminación?',
        text: `La agencia "${agency.idReal}" no podrá ser recuperada.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e11d48',
        customClass: { popup: 'rounded-3xl' }
      });

      if (result.isConfirmed) {
        await deleteAgency(agency.id);
        renderAgenciesList();
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-3xl' } });
      }
    };

    container.appendChild(item);
  });
}