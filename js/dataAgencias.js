document.addEventListener('DOMContentLoaded', init);

    /* ======================
       INIT
    ====================== */
    async function init() {
      const agencies = await getAllAgencies();
      renderCounter(agencies);
      renderAgencies(agencies);
    }

    /* ======================
       INDEXED DB
    ====================== */
    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('agenciasDB', 1);

        request.onerror = () => reject('Error al abrir DB');

        request.onsuccess = e => resolve(e.target.result);
      });
    }

    async function getAllAgencies() {
      const db = await openDB();
      return new Promise(resolve => {
        const tx = db.transaction('agencies', 'readonly');
        const store = tx.objectStore('agencies');
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
      });
    }

    async function updateAgencyLocation(id, lat, lng) {
      const db = await openDB();

      return new Promise(resolve => {
        const tx = db.transaction('agencies', 'readwrite');
        const store = tx.objectStore('agencies');

        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const agency = getReq.result;
          agency.lat = lat;
          agency.lng = lng;
          store.put(agency);
          resolve();
        };
      });
    }

    /* ======================
       CONTADOR
    ====================== */
    function renderCounter(agencies) {
      const pending = agencies.filter(
        a => a.lat == null || a.lng == null
      ).length;

      document.getElementById('counter').innerText =
        `Faltan ${pending} agencias por ubicar`;
    }

    /* ======================
       RENDER
    ====================== */
    function renderAgencies(agencies) {
      const container = document.getElementById('agenciesList');
      container.innerHTML = '';

      if (!agencies.length) {
        container.innerHTML =
          '<p class="text-gray-500">No hay agencias registradas</p>';
        return;
      }

      agencies.forEach(a => {
        const hasLocation = a.lat != null && a.lng != null;

        const card = document.createElement('div');
        card.className =
          'bg-white p-4 rounded-lg shadow flex justify-between gap-4';

        card.innerHTML = `
          <div>
            <h3 class="font-semibold">${a.idReal}</h3>
            <p class="text-sm text-gray-600">Zona: ${a.zona}</p>
            <p class="text-sm text-gray-500">${a.direccion}</p>

            <p class="text-sm mt-2">
              ${
                hasLocation
                  ? '📍 Ubicación asignada'
                  : '⚠️ Sin ubicación'
              }
            </p>
          </div>

          <div class="text-right">
            ${
              hasLocation
                ? '<span class="text-green-600 font-medium text-sm">OK</span>'
                : `<button
                     class="btn-location bg-blue-600 text-white px-3 py-1 rounded text-sm"
                     data-id="${a.id}">
                     Agregar ubicación
                   </button>`
            }
          </div>
        `;

        container.appendChild(card);
      });
    }

    /* ======================
       EVENTOS
    ====================== */
    document.addEventListener('click', e => {
      if (e.target.classList.contains('btn-location')) {
        const id = Number(e.target.dataset.id);
        assignLocation(id);
      }
    });

    /* ======================
       GEOLOCATION
    ====================== */
    function assignLocation(id) {
      if (!navigator.geolocation) {
        alert('Geolocalización no soportada');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude, longitude } = pos.coords;

          await updateAgencyLocation(id, latitude, longitude);
          await init();
        },
        () => alert('No se pudo obtener la ubicación'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }