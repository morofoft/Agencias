import { getAllAgencies, updateAgency } from './agencies.store.js';
import { goToAgency } from '../map/map.actions.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js';

export async function renderAgenciesList() {
  const agencies = await getAllAgencies();
  const container = document.getElementById('agencies-list');

  container.innerHTML = '';

  if (!agencies.length) {
    container.innerHTML = '<p class="text-gray-500">No hay agencias</p>';
    return;
  }

  agencies.forEach(agency => {
    const item = document.createElement('div');
    item.className =
      'flex justify-between items-center p-2 border-b text-sm';

    item.innerHTML = `
      <div>
        <div class="font-semibold">${agency.nombre}</div>
        <div class="text-xs text-gray-500">
          ${agency.zona} • ${agency.estado}
        </div>
      </div>

      <div class="flex space-x-1">
        <button
          class="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          data-id="${agency.id}">
          📍 IR
        </button>
        <button
          class="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
          data-id="${agency.id}">
          ✏️ Editar
        </button>
      </div>
    `;

    // IR
    item.querySelector('button:nth-child(1)').onclick = () =>
      goToAgency(agency);

    // Editar
    item.querySelector('button:nth-child(2)').onclick = async () => {
      const { value: formValues } = await Swal.fire({
        title: 'Editar agencia',
        html: `
          <input id="nombre" class="swal2-input" placeholder="Nombre" value="${agency.nombre}">
          <input id="direccion" class="swal2-input" placeholder="Dirección" value="${agency.direccion}">
          <select id="zona" class="swal2-select">
            <option value="A" ${agency.zona==='A'?'selected':''}>A</option>
            <option value="B" ${agency.zona==='B'?'selected':''}>B</option>
            <option value="C" ${agency.zona==='C'?'selected':''}>C</option>
            <option value="D" ${agency.zona==='D'?'selected':''}>D</option>
            <option value="E" ${agency.zona==='E'?'selected':''}>E</option>
            <option value="F" ${agency.zona==='F'?'selected':''}>F</option>
            <option value="G" ${agency.zona==='G'?'selected':''}>G</option>
            <option value="OTRA" ${agency.zona==='OTRA'?'selected':''}>OTRA</option>
          </select>
          <select id="estado" class="swal2-select">
            <option value="verde" ${agency.estado==='verde'?'selected':''}>Verde</option>
            <option value="amarillo" ${agency.estado==='amarillo'?'selected':''}>Amarillo</option>
            <option value="rojo" ${agency.estado==='rojo'?'selected':''}>Rojo</option>
          </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          const nombre = document.getElementById('nombre').value.trim();
          const direccion = document.getElementById('direccion').value.trim();
          const zona = document.getElementById('zona').value;
          const estado = document.getElementById('estado').value;

          if (!nombre || !direccion || !zona || !estado) {
            Swal.showValidationMessage('Todos los campos son obligatorios');
            return false;
          }

          return { nombre, direccion, zona, estado };
        }
      });

      if (formValues) {
        agency.nombre = formValues.nombre;
        agency.direccion = formValues.direccion;
        agency.zona = formValues.zona;
        agency.estado = formValues.estado;
        agency.updated_at = Date.now();

        await updateAgency(agency);
        await renderAgenciesList();
      }
    };

    container.appendChild(item);
  });
}
