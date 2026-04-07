import { addAgency, getAllAgencies } from './agencies.store.js';
import { ZONE_COLORS } from '../utils/zoneColors.js';
import { renderAgenciesList } from './agencies.list.ui.js';
const markers = new Map();

function colorByState(state) {
  if (state === 'verde') return 'green';
  if (state === 'amarillo') return 'orange';
  return 'red';
}

export async function renderAgencies(map) {
  const agencies = await getAllAgencies();

  agencies.forEach(agency => {

    if (markers.has(agency.id_nuevo)) {
      const marker = markers.get(agency.id);
      marker.setStyle({ color: colorByState(agency.estado) });
      return;
    }
  
    const marker = L.circleMarker(
      [agency.lat, agency.lng],
      {
        radius: 8,
        color: colorByState(agency.estado),
        fillOpacity: 0.8
      }
    ).addTo(map);
  
    marker.bindPopup(`
      <b>${agency.idReal}</b><br>
      Zona: ${agency.zona}<br>
      Estado: ${agency.estado}
    `);
  
    markers.set(agency.id, marker);
  });
  
}