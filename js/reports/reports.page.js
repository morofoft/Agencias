import { getAllAgencies } from '../agencies/agencies.store.js';

const todayEl = document.getElementById('today');
const nameEl = document.getElementById('nearest-name');
const distEl = document.getElementById('nearest-distance');
const timeline = document.getElementById('timeline');

todayEl.textContent = new Date().toLocaleDateString('es-DO', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// 📍 GPS + agencia cercana
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async pos => {
    const agencies = await getAllAgencies();
    if (!agencies.length) return;

    const nearest = findNearest(
      pos.coords.latitude,
      pos.coords.longitude,
      agencies
    );

    nameEl.textContent = nearest.nombre || nearest.idReal;
    distEl.textContent = `${nearest.distance.toFixed(2)} km`;

  }, () => {
    nameEl.textContent = 'GPS no disponible';
  }, { enableHighAccuracy: true });
}

// 🧮 Distancia Haversine
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearest(lat, lng, agencies) {
  let nearest = null;
  let min = Infinity;

  for (const a of agencies) {
    const d = calcDistance(lat, lng, a.lat, a.lng);
    if (d < min) {
      min = d;
      nearest = { ...a, distance: d };
    }
  }
  return nearest;
}

// 🕒 Timeline demo (placeholder)
timeline.innerHTML = `
  <div class="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
    <div class="text-indigo-600">
      <i class="fa-solid fa-route"></i>
    </div>
    <div class="flex-1">
      <p class="font-semibold text-sm">Ruta diaria</p>
      <p class="text-xs text-gray-500">08:30 AM</p>
    </div>
    <input type="checkbox" class="w-5 h-5 accent-indigo-600">
  </div>
`;
