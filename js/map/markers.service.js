export function agencyMarker(agency) {
  // Mapeo de colores modernos por zona
  const zonaColors = {
    A: '#3b82f6', // Azul
    B: '#a855f7', // Púrpura
    C: '#f59e0b', // Naranja
    OTRA: '#64748b', // Gris
    'PEDRO CORTO': '#3b82f6',
    'SAN JUAN CENTRO': '#f59e0b',
    'Los Corbano': '#3b82f6',
    'VALLEJUELO': '#3b82f6',
    'Luis Edwardo Luciano': '#3b82f6',
    'LAS MATAS DE FARFAN': '#3b82f6',
    'EL CARRIL': '#3b82f6',
    'EL ROSARIO': '#3b82f6',
    'Rafael Baez': '#3b82f6',
    'KM.11': '#3b82f6',
    'CUENDA': '#3b82f6',
    'ELIAS PIÑA': '#3b82f6',
    'CARDON': '#3b82f6',
    'LA CUALTA': '#3b82f6',
    'EL CERCADO': '#3b82f6',
    'JUAN SANTIAGO': '#3b82f6'
  };

  const color = zonaColors[agency.zona] || '#64748b';

  // Creamos un icono de casa personalizado
  const houseIcon = L.divIcon({
    className: 'custom-house-marker',
    html: `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        width: 34px;
        height: 34px;
        background-color: white;
        border-radius: 8px;
        border: 2px solid ${color};
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      ">
        <i class="fas fa-building" style="color: ${color}; font-size: 18px;"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });

  // El Popup con diseño "bonito"
  const popupContent = `
    <div style="min-width: 180px; font-family: 'Inter', sans-serif; padding: 5px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
          ZONA ${agency.zona}
        </span>
        <span style="color: #94a3b8; font-size: 10px; font-weight: bold;">ID: ${agency.idReal}</span>
      </div>
      
      <h3 style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 700;">
        Viejo: ${agency.id_loteka || 'ID Loteka'} Nuevo: ${agency.id_nuevo || 'ID Real'}
      </h3>
      
      <p style="margin: 4px 0 10px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
        <i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i> ${agency.direccion || 'Sin dirección'}
      </p>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f1f5f9;">
        <span style="font-size: 11px; color: #475569;">Visitas realizadas:</span>
        <span style="font-size: 13px; font-weight: 800; color: ${color}; bg: ${color}10; padding: 2px 6px; border-radius: 4px;">
          ${agency.contador_visitas}
        </span>
      </div>
    </div>
  `;

  return L.marker([agency.lat, agency.lng], { icon: houseIcon })
    .bindPopup(popupContent, {
      className: 'modern-popup',
      maxWidth: 250
    });
}