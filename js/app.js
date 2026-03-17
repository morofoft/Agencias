
import { getAgencies } from './agencies/agencies.store.js';
import { initMap, updateUserPosition } from './map/map.service.js';
import { agencyMarker } from './map/markers.service.js';
import { startLocationTracking } from './gps/location.service.js';
import { checkAgencies } from './gps/geofence.service.js';
import { onLocationUpdate } from './routes/tracking.service.js';
import { exportAll } from './export/excel.js';
import { renderAgenciesList } from './agencies/agencies.list.ui.js';
import { generateRouteByZone, stopRoute, startRouteByZone } from './map/map.routes.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let agencies = [];
let map = null;

let lastPos = null;
let lastTimestamp = null;
let speedHistory = [];
/**
 * Calcula la distancia en metros entre dos coordenadas (Haversine)
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la tierra en metros
  const toRad = x => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Resultado en metros
}

document.addEventListener('DOMContentLoaded', async () => {

  const btnOpenModal = document.getElementById('btn-open-copy-modal');
  const closestName = document.getElementById('closest-name');

  console.log('🚀 Control de Agencias iniciado');
  const accuracyValue = document.getElementById('accuracy-value');

  const btnToggle = document.getElementById('btn-toggle-list');
  const btnClose = document.getElementById('btn-close-list');
  const listContainer = document.getElementById('collapsible-list');

  if (btnToggle && listContainer) {
    // Función para cerrar la lista
    const closeAgenciesList = () => {
      listContainer.classList.remove('is-active');
      // Restaurar el icono a 'lista'
      const icon = btnToggle.querySelector('i');
      icon.className = 'fas fa-list-ul';
    };

    // Función para abrir la lista
    const openAgenciesList = () => {
      listContainer.classList.add('is-active');
      // Cambiar el icono a 'flecha abajo' para indicar que se puede cerrar
      const icon = btnToggle.querySelector('i');
      icon.className = 'fas fa-chevron-down';
    };

    // Evento en el botón del Widget
    btnToggle.onclick = () => {
      if (listContainer.classList.contains('is-active')) {
        closeAgenciesList();
      } else {
        openAgenciesList();
      }
    };

    // Evento en la 'X' de la lista
    if (btnClose) {
      btnClose.onclick = closeAgenciesList;
    }
  }

  if (btnOpenModal) {
    btnOpenModal.onclick = async () => {
      const idReal = closestName.textContent;

      if (!idReal || idReal === "Buscando...") {
        return Swal.fire({
          icon: 'info',
          title: 'Espera...',
          text: 'Aún no detecto una agencia cercana',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-3xl' }
        });
      }

      // El Modal de 3 Botones
      await Swal.fire({
        title: `<span class="text-lg font-black text-slate-700">Copiar ID: ${idReal}</span>`,
        html: `
          <div class="flex flex-col gap-4 mt-4">
            <button id="copy-only-id" class="p-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-base border-b-4 border-slate-300 active:border-b-0 transition-all flex justify-between items-center">
              <span>${idReal}</span>
              <i class="fas fa-fingerprint opacity-30"></i>
            </button>
            
            <button id="copy-abierta" class="p-5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-2xl font-bold text-base border-b-4 border-emerald-300 active:border-b-0 transition-all flex justify-between items-center text-left">
              <span>${idReal} abierta</span>
              <i class="fas fa-door-open opacity-30"></i>
            </button>
            
            <button id="copy-cerrada" class="p-5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-2xl font-bold text-base border-b-4 border-rose-300 active:border-b-0 transition-all flex justify-between items-center text-left">
              <span>${idReal} cerrada</span>
              <i class="fas fa-door-closed opacity-30"></i>
            </button>
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
          popup: 'rounded-t-[2rem] sm:rounded-3xl !p-6 !pb-10',
        },
        didOpen: () => {
          const copy = async (text) => {
            try {
              // Método moderno (funciona en la mayoría)
              if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
              } else {
                // 🔥 Fallback para móviles problemáticos
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
          
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
          
                const success = document.execCommand("copy");
                document.body.removeChild(textarea);
          
                if (!success) throw new Error("Fallback copy failed");
              }
          
              // ✅ Éxito
              Swal.close();
          
              const Toast = Swal.mixin({
                toast: true,
                position: 'bottom',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              });
          
              Toast.fire({
                icon: 'success',
                title: '¡Copiado al portapapeles!'
              });
          
            } catch (err) {
              console.error('Error al copiar', err);
          
              // 🔥 PLAN C (UX pro)
              Swal.fire({
                icon: 'info',
                title: 'Copia manual',
                html: `
                  <p class="mb-2">No se pudo copiar automáticamente.</p>
                  <input value="${text}" class="w-full p-2 border rounded" readonly onclick="this.select()" />
                  <small>Mantén presionado para copiar</small>
                `,
                confirmButtonText: 'OK'
              });
            }
          };

          document.getElementById('copy-only-id').onclick = () => copy(idReal);
          document.getElementById('copy-abierta').onclick = () => copy(`${idReal} abierta`);
          document.getElementById('copy-cerrada').onclick = () => copy(`${idReal} cerrada`);
        }
      });
    };
  }
  map = initMap();


  agencies = await getAgencies();
  agencies
    .filter(a => a.lat != null && a.lng != null)
    .forEach(agency => {
      agencyMarker(agency).addTo(map);
    });

  const speedValue = document.getElementById('speed-value');
  const accDot = document.getElementById('acc-dot');

  startLocationTracking(async (pos) => {
    // 1. Cálculos de sensores (Velocidad y Precisión)
    let speedKMH = 0;

    if (pos.speed !== null && pos.speed > 0) {
        speedKMH = pos.speed * 3.6;
    
    } else if (lastPos && lastTimestamp) {
    
        const dist = getDistance(lastPos.lat, lastPos.lng, pos.lat, pos.lng);
        const timeDiff = (Date.now() - lastTimestamp) / 1000;
    
        if (timeDiff > 0 && dist > 5) {
            speedKMH = (dist / timeDiff) * 3.6;
        }
    }
    
    // evitar valores locos
    if (speedKMH > 150) speedKMH = 0;
    
    // formatear al final
    speedKMH = speedKMH.toFixed(1);
    speedHistory.push(Number(speedKMH));
if (speedHistory.length > 5) speedHistory.shift();

const avgSpeed = speedHistory.reduce((a,b)=>a+b,0) / speedHistory.length;
    
    // Guardar estado para el siguiente ciclo
    lastPos = { lat: pos.lat, lng: pos.lng };
    lastTimestamp = Date.now();

    // 2. Lógica de Negocio (Geofencing y Lista)
    // Solo llamamos a estas funciones UNA VEZ
    updateUserPosition(map, pos); 
    renderAgenciesList(pos); // Esto suele ser pesado, asegúrate que esté optimizado
    const closest = await checkAgencies(pos, agencies);

    // 3. Actualización de Interfaz (DOM) con Validaciones "Anti-Crash"
    
    // Velocidad y Precisión
    if (speedValue) speedValue.textContent = avgSpeed.toFixed(1);;
    
    if (accuracyValue && accDot && pos.accuracy !== null) {

      const acc = Math.round(pos.accuracy);
      accuracyValue.textContent = acc;
  
      // reset base (pero sin romper todo)
      accDot.classList.remove(
          "bg-emerald-500",
          "bg-amber-500",
          "bg-red-500",
          "animate-pulse",
          "shadow-[0_0_5px_#10b981]"
      );
  
      if (acc < 20) {
          accDot.classList.add("bg-emerald-500", "shadow-[0_0_5px_#10b981]");
      } 
      else if (acc < 70) {
          accDot.classList.add("bg-amber-500");
      } 
      else {
          accDot.classList.add("bg-red-500", "animate-pulse");
      }
  }

    // Widget de Agencia Cercana
    const nameEl = document.getElementById('closest-name');
    const distEl = document.getElementById('closest-distance-text');

    if (closest) {
        if (nameEl) nameEl.textContent = `AG ${closest.idReal}`;
        if (distEl) {
            distEl.textContent = `${closest.currentDist} Metros`;
            // Cambio de color según cercanía
            const isNear = closest.currentDist < 20;
            distEl.classList.toggle('text-emerald-500', isNear);
            distEl.classList.toggle('text-indigo-600', !isNear);
        }
    } else {
        if (nameEl) nameEl.textContent = "Buscando...";
        if (distEl) {
            distEl.textContent = "--";
            distEl.className = "text-indigo-600"; // Reset de color
        }
    }
});
  await renderAgenciesList();


  const rutas = ['A', 'B', 'C', 'D'];
  rutas.forEach(id => {
    const btn = document.getElementById(`btnRoute${id}`);
    if (btn) {
      btn.onclick = () => generateRouteByZone(map, id);
    }
  });

  const botonesIrRutas = document.querySelectorAll('.btnRouteIr');
  botonesIrRutas.forEach(boton => {
    boton.addEventListener('click', (e) => {
      console.log('Iniciando ruta ' + e.currentTarget.dataset.ruta)
      stopRoute()
      startRouteByZone(map, e.currentTarget.dataset.ruta);
    })
  })
});

window.addEventListener('deviceorientationabsolute', (e) => {
  if (!map || e.alpha === null) return;

  const heading = 360 - e.alpha; // El ángulo real de la brújula
  const seguimientoActivo = document.getElementById('seguimiento')?.checked;
  const arrowDiv = document.getElementById('userArrow');

  if (seguimientoActivo) {
    // MODO A: El mapa gira, la flecha se queda fija mirando "adelante"
    map.setBearing(heading);
    if (arrowDiv) {
      arrowDiv.style.transform = `rotate(0deg)`;
    }
  } else {
    // MODO B: El mapa está quieto (Norte arriba), la flecha gira sola
    map.setBearing(0);
    if (arrowDiv) {
      // Ajustamos -45deg si usas fa-location-arrow porque apunta al noreste por defecto
      arrowDiv.style.transform = `rotate(${heading - 45}deg)`;
    }
  }
});
// Exportación global (botón HTML)
window.exportAll = exportAll;


import { syncAgencies } from "./firebase/firebase.sync.js";

window.addEventListener("online",()=>{

  console.log("Internet detectado");

  syncAgencies();

});

// sincronizar al iniciar
syncAgencies();

import { syncFromFirebase } from "./firebase/firebase.sync.js";

window.addEventListener("load",()=>{

  if(navigator.onLine){
    syncFromFirebase();
  }

});

