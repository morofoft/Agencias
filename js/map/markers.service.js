export function agencyMarker(agency) {
    const colors = {
      verde: 'green',
      amarillo: 'orange',
      rojo: 'red'
    };
  
    return L.circleMarker([agency.lat, agency.lng], {
      radius: 7,
      color: colors[agency.estado] || 'gray'
    }).bindPopup(`
      <strong>${agency.idReal}</strong><br>
      Visitas: ${agency.contador_visitas}
    `);
  }
  