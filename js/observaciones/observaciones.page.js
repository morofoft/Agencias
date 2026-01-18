import { getAllObservations } from '../agencies/agencies.store.js';

let allObservations = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadHistory();

    // Evento para el buscador
    document.getElementById('searchAgency').addEventListener('input', (e) => {
        const term = e.target.value.toUpperCase();
        const filtered = allObservations.filter(o => o.idReal.includes(term));
        renderList(filtered);
    });
});

async function loadHistory() {
    allObservations = await getAllObservations();
    // Ordenar por las más recientes primero (usando timestamp)
    allObservations.sort((a, b) => b.timestamp - a.timestamp);
    renderList(allObservations);
}

function renderList(data) {
    const container = document.getElementById('historyContainer');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 text-slate-400">
                <i class="fa-regular fa-folder-open text-5xl mb-4"></i>
                <p class="font-bold">No se encontraron notas</p>
            </div>`;
        return;
    }

    container.innerHTML = data.map(obs => {
        const colors = {
            'Excelente': 'emerald',
            'Regular': 'amber',
            'Crítico': 'rose'
        };
        const c = colors[obs.estado] || 'slate';

        return `
        <div class="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-black text-slate-800">${obs.idReal}</h3>
                    <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <span><i class="fa fa-calendar"></i> ${obs.fecha}</span>
                        <span><i class="fa fa-clock"></i> ${obs.hora}</span>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-[9px] font-black bg-${c}-50 text-${c}-600 border border-${c}-100 uppercase">
                    ${obs.estado}
                </span>
            </div>
            
            <div class="bg-slate-50 rounded-2xl p-4">
                <p class="text-sm text-slate-600 leading-relaxed italic">
                    "${obs.descripcion}"
                </p>
            </div>
        </div>
        `;
    }).join('');
}

// Filtro global expuesto
window.filterBy = function(estado) {
    if (estado === 'TODAS') {
        renderList(allObservations);
    } else {
        const filtered = allObservations.filter(o => o.estado === estado);
        renderList(filtered);
    }
};