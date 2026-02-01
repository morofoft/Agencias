import { getAgencies } from './agencies/agencies.store.js'; // Seguimos usando idb por ahora
import { ZONE_COLORS } from './utils/zoneColors.js';

const zoneSelect = document.getElementById('zoneSelect');
const agenciesList = document.getElementById('agenciesList');

zoneSelect.addEventListener('change', async (e) => {
    const zone = e.target.value;
    if (!zone) return;

    renderAgencias(zone);
});

async function renderAgencias(zone) {
    agenciesList.innerHTML = '<div class="text-center p-5">Cargando...</div>';
    
    const allAgencies = await getAgencies();

    const filtered = allAgencies.filter(a => a.zona === zone);

    if (filtered.length === 0) {
        agenciesList.innerHTML = `<p class="text-center text-slate-500 mt-5">No hay agencias en la Zona ${zone}</p>`;
        return;
    }

    agenciesList.innerHTML = ''; // Limpiar

    filtered.forEach(agencia => {
        const color = ZONE_COLORS[agencia.zona] || '#64748b';
        
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-2xl shadow-sm border-l-4 flex justify-between items-center transition-transform active:scale-95";
        card.style.borderLeftColor = color;

        card.innerHTML = `
            <div>
                <h3 class="font-bold text-slate-800">${agencia.idReal}</h3>
                <p class="text-xs text-slate-500">Direccion: ${agencia.direccion}</p>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 mt-2 inline-block">
                    ${agencia.estado || 'Pendiente'}
                </span>
            </div>
            <div class="flex gap-2">
                <button onclick="window.location.href='mapa.html?id=${agencia.idReal}'" class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i class="fas fa-location-arrow"></i>
                </button>
                <button onclick="window.location.href='hallazgos.html?id=${agencia.idReal}'" class="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        agenciesList.appendChild(card);
    });
}