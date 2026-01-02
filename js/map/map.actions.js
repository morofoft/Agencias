import { getMapInstance } from './map.instance.js';

export function goToAgency(agency) {
  const map = getMapInstance();
  if (!map) return;

  map.setView([agency.lat, agency.lng], 17);

  L.popup()
    .setLatLng([agency.lat, agency.lng])
    .setContent(`
      <b>${agency.nombre}</b><br>
      ${agency.direccion}
    `)
    .openOn(map);
  
  const url = `https://www.google.com/maps/dir/?api=1&destination=${agency.lat},${agency.lng}&travelmode=driving`;
  window.open(url, '_blank');
}
