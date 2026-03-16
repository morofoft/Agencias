import { addFinding, getFindings, updateFinding  } from './findings.store.js';
import { getAllAgencies } from '../agencies/agencies.store.js';

const list = document.getElementById('findings-list');
const btnNew = document.getElementById('btn-new');

const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const btnFilter = document.getElementById('btnFilter');
const criticalBadge = document.getElementById('criticalBadge');

let agencies = [];

/* ===============================
   CARGAR HALLAZGOS
================================ */
async function loadFindings() {
  const data = await getFindings();
  render(data);
  updateCriticalBadge();
}

/* ===============================
   RENDER
================================ */
function render(data) {
  list.innerHTML = '';

  if (!data.length) {
    list.innerHTML = `
      <div class="text-center opacity-40 mt-20">
        <i class="fa fa-clipboard-list text-4xl mb-2"></i>
        <p>No hay hallazgos registrados</p>
      </div>`;
    return;
  }

  data.sort((a, b) => b.created_at - a.created_at);

  data.forEach(f => {
    const isPending = f.estado === 'Pendiente';

    list.innerHTML += `
      <div class="bg-white rounded-2xl shadow p-4 space-y-3">
        
        <div class="flex justify-between items-center">
          <h3 class="font-bold">${f.titulo}</h3>

          <span class="text-xs px-2 py-1 rounded-full font-bold
            ${f.gravedad === 'alta' || f.gravedad === 'critica'
              ? 'bg-red-100 text-red-600'
              : f.gravedad === 'media'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-emerald-100 text-emerald-600'}">
            ${f.gravedad.toUpperCase()}
          </span>
        </div>

        <p class="text-sm text-slate-600">${f.descripcion || ''}</p>

        <div class="text-xs text-slate-400 flex justify-between">
          
          <span>${f.fecha} ${f.hora}</span>
        </div>

        <div class="flex justify-between items-center text-xs font-bold">
          <span class="${isPending ? 'text-red-600' : 'text-emerald-600'}">
            ${f.estado}
          </span>

          ${isPending ? `
            <button 
              class="text-emerald-600 underline"
              data-id="${f.id}">
              ✔ Marcar como resuelto
            </button>` : `
            <span class="text-slate-400">
              Resuelto
            </span>`}
        </div>
      </div>
    `;
  });

  bindResolveButtons(data);
}
async function updateCriticalBadge() {
  const all = await getFindings();

  const critical = all.filter(f =>
    f.gravedad === 'critica' &&
    f.estado === 'Pendiente'
  );

  if (!critical.length) {
    criticalBadge.classList.add('hidden');
    return;
  }

  criticalBadge.textContent = `${critical.length} críticos`;
  criticalBadge.classList.remove('hidden');

}

function bindResolveButtons(data) {
  document.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const finding = data.find(f => f.id === id);
    
      if (!finding) return;
    
      const confirm = await Swal.fire({
        title: '¿Marcar como resuelto?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, resolver'
      });
    
      if (!confirm.isConfirmed) return;
    
      finding.estado = 'Resuelto';
      finding.resolved_at = Date.now();
    
      await updateFinding(finding);
      loadFindings();
    });
    
  });
}

/* ===============================
   NUEVO HALLAZGO
================================ */
btnNew.addEventListener('click', async () => {

  if (!agencies.length) agencies = await getAllAgencies();

  const agencyOptions = agencies
    .map(a => `<option value="${a.idReal}">${a.idReal}</option>`)
    .join('');

  const { value: form } = await Swal.fire({
    title: 'Nuevo Hallazgo',
    html: `
      <select id="agency" class="swal2-input">${agencyOptions}</select>
      <input id="titulo" class="swal2-input" placeholder="Título">
      <textarea id="desc" class="swal2-textarea" placeholder="Descripción"></textarea>
      <select id="tipo" class="swal2-input">
        <option>Operativo</option>
        <option>Administrativo</option>
        <option>Seguridad</option>
        <option>Limpieza</option>
        <option>Otro</option>
      </select>
      <select id="gravedad" class="swal2-input">
        <option value="baja">Baja</option>
        <option value="media">Media</option>
        <option value="alta">Alta</option>
        <option value="critica">Crítica</option>
      </select>
    `,
    showCancelButton: true,
    preConfirm: () => {
      const titulo = document.getElementById('titulo').value;
      if (!titulo) {
        Swal.showValidationMessage('El título es obligatorio');
        return false;
      }

      const now = new Date();
      const agencyId = document.getElementById('agency').value;
      const agencyData = agencies.find(a => a.idReal === agencyId);


      return {
        id: crypto.randomUUID(),
        agency_id: agencyId,

        titulo,
        descripcion: document.getElementById('desc').value,
        tipo: document.getElementById('tipo').value,
        gravedad: document.getElementById('gravedad').value,

        estado: 'Pendiente',
        resolved_at: null,

        fecha: now.toISOString().split('T')[0],
        hora: now.toTimeString().slice(0, 5),

        creado_por: 'Pedro Garcia',
        synced: false,
        created_at: Date.now(),
        synced:false
      };
    }
  });

  if (!form) return;

  await addFinding(form);
  loadFindings();
});

/* ===============================
   FILTRO POR FECHA
================================ */
btnFilter.addEventListener('click', async () => {
  const all = await getFindings();

  const from = fromDate.value
    ? new Date(fromDate.value).getTime()
    : 0;

  const to = toDate.value
    ? new Date(toDate.value).getTime() + 86400000
    : Date.now();

  const filtered = all.filter(f =>
    f.created_at >= from && f.created_at <= to
  );

  render(filtered);
});

/* ===============================
   INIT
================================ */
loadFindings();
