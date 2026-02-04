import { registerVisit } from '../db/visits.store.js';
import { vibrate } from '../feedback/vibration.js';

const ENTER_RADIUS = 20;
const EXIT_RADIUS = 25;
const COOLDOWN = 30 * 60 * 1000; // 30 minutos

const state = new Map();

// --- Función para leer texto ---
function speak(text, idReal) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    // Transformamos "12-58-78" en "1 2 5 8 7 8 " para que la voz no diga "ciento veinticinco mil..."
    const idDeletreado = idReal.toString().replace(/[-_]/g, '').split('').join(' ');
    
    const mensajeFinal = `Agencia ${idDeletreado} está cerca`;
    
    const utterance = new SpeechSynthesisUtterance(mensajeFinal);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Un poco más lento para que se entienda mejor el código
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function checkAgencies(position, agencies) {
  let closest = null;
  let minDistance = Infinity;

  for (const agency of agencies) {
    const dist = distance(position.lat, position.lng, agency.lat, agency.lng);

    if (dist < minDistance) {
      minDistance = dist;
      closest = { ...agency, currentDist: Math.round(dist) };
    }

    const info = state.get(agency.id) || { inside: false, lastVisit: 0 };

    // 🟢 ENTRADA
    if (!info.inside && dist <= ENTER_RADIUS) {
      const now = Date.now();

      if (now - info.lastVisit < COOLDOWN) continue;

      info.inside = true;
      info.lastVisit = now;

      agency.visited = true;
      agency.visits = (agency.visits || 0) + 1;
      agency.lastVisit = now;

      await registerVisit(agency.id, now);

      vibrate();
      
      // CAMBIO: Ahora usa voz en lugar de playSound()
      speak("Agencia está cerca", agency.idReal);

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end', // Puedes usar 'top', 'bottom', o 'top-end'
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        },
        customClass: {
          popup: 'rounded-2xl shadow-lg border-l-4 border-emerald-500'
        }
      });
      
      Toast.fire({
        icon: 'success',
        title: 'Agencia visitada',
        text: `ID: ${agency.idReal}`
      });
    }

    // 🔴 SALIDA
    if (info.inside && dist > EXIT_RADIUS) {
      info.inside = false;
    }

    state.set(agency.id, info);
  }
  return closest;
}