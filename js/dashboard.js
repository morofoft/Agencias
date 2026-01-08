import { getCriticalPendingFindings, markFindingResolved } from './findings/findings.store.js';

import { getAgencyByIdReal } from './agencies/agencies.store.js';

const countEl = document.getElementById('criticalCount');
const listEl = document.getElementById('criticalList');

document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
  const findings = await getCriticalPendingFindings();

  countEl.textContent = findings.length;
  listEl.innerHTML = '';

  if (findings.length === 0) {
    listEl.innerHTML = `
      <p class="text-green-600 text-sm">
        ✔ No hay hallazgos críticos pendientes
      </p>`;
    return;
  }

  for (const f of findings) {
   
    const agency = await getAgencyByIdReal(f.agency_id);
    
    const div = document.createElement('div');
    div.className = 'border rounded p-3 bg-red-50';

    div.innerHTML = `
    <div class="flex justify-between items-start">
      <strong class="text-red-700">${f.titulo}</strong>
      <span class="text-xs text-gray-500">${f.fecha}</span>
    </div>
  
    <p class="text-sm text-gray-700">${f.descripcion}</p>
  
    <p class="text-xs mt-1">
      <i class="fas fa-building"></i>
      ${agency ? agency.nombre : 'Agencia desconocida'}
    </p>
  
    <button class="mt-3 w-full text-xs bg-green-600 text-white py-2 rounded"
      data-id="${f.id}">
      ✔ Marcar como resuelto
    </button>
  `;
  const btn = div.querySelector('button');

btn.addEventListener('click', async () => {
  await markFindingResolved(f.id);

  Swal.fire({
    icon: 'success',
    title: 'Resuelto',
    text: 'El hallazgo fue marcado como resuelto',
    timer: 1200,
    showConfirmButton: false
  });

  loadDashboard(); // refresca
});


    listEl.appendChild(div);
  }

  console.log('Hallazgos:', findings);
}



