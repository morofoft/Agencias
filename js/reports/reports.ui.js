export function renderTimeline(list, data) {
    list.innerHTML = '';
  
    if (!data.length) {
      list.innerHTML = `
        <div class="text-center opacity-40 mt-20">
          <i class="fa fa-clock text-4xl mb-2"></i>
          <p>No hay registros hoy</p>
        </div>`;
      return;
    }
  
    data.sort((a,b) => a.timestamp - b.timestamp);
  
    data.forEach(r => {
      list.innerHTML += `
        <div class="bg-white rounded-2xl shadow p-4 space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-bold text-indigo-600">${r.hora}</span>
            <span class="text-xs px-2 py-1 rounded-full bg-slate-100 font-bold">
              ${r.tipo.toUpperCase()}
            </span>
          </div>
  
          <p class="text-sm text-slate-700">${r.descripcion}</p>
  
          <div class="text-xs text-slate-400 flex justify-between">
            <span>${r.agencia_nombre || r.zona}</span>
            <span>${r.tarea_completada ? '✔ Completada' : ''}</span>
          </div>
        </div>
      `;
    });
  }
  