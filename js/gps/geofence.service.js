import { registerVisit } from '../db/visits.store.js';
import { vibrate } from '../feedback/vibration.js';
import { playSound } from '../feedback/sound.js';

const ENTER_RADIUS = 20;
const EXIT_RADIUS = 25;
const COOLDOWN = 30 * 60 * 1000; // 30 minutos

const state = new Map();

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
    const dist = distance(
      position.lat,
      position.lng,
      agency.lat,
      agency.lng
    );

    if (dist < minDistance) {
      minDistance = dist;
      closest = { ...agency, currentDist: Math.round(dist) };
    }

    const info = state.get(agency.id) || {
      inside: false,
      lastVisit: 0
    };

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
      playSound();

      Swal.fire({
        icon: 'success',
        title: 'Agencia visitada',
        text: agency.idReal,
        timer: 1800,
        showConfirmButton: false
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
