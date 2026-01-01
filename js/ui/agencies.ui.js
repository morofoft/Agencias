import { getAgencies } from '../db/agencies.store.js';

export async function renderAgencies(container) {
  const agencies = await getAgencies();

  container.innerHTML = agencies.map(a => `
    <div class="p-3 border rounded mb-2">
      <strong>${a.nombre}</strong><br>
      <span class="text-sm">${a.direccion}</span><br>
      <span class="text-xs">Visitas: ${a.contador_visitas}</span>
    </div>
  `).join('');
}

export function renderAgencyList(agencies, user) {
    const ul = document.querySelector('#agencyList');
    ul.innerHTML = '';
  
    agencies.forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = `
        <b>${a.name}</b><br>
        <button data-id="${a.id}">Ir</button>
      `;
      li.querySelector('button').onclick = () => {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`
        );
      };
      ul.appendChild(li);
    });
  }
  