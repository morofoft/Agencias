import { getAllAgencies } from './agencies.store.js';
import { goToAgency } from '../map/map.actions.js';

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

      <button
        class="px-2 py-1 bg-blue-500 text-white rounded text-xs"
        data-id="${agency.id}">
        📍 IR
      </button>
    `;

    item.querySelector('button').onclick = () =>
      goToAgency(agency);

    container.appendChild(item);
  });
}
