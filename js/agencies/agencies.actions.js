import { addAgency } from './agencies.store.js';

export async function createAgencyFromGPS(coords, formValues) {
  const now = Date.now();

  const agency = {
    id: crypto.randomUUID(),
    idReal: formValues.codigo,
    id_nuevo: formValues.codigo,
    id_loteka: 812000000,
    direccion: formValues.direccion || '',
    zona: formValues.zona,

    lat: coords.latitude,
    lng: coords.longitude,

    estado: 'verde',
    contador_visitas: 0,
    fecha_ultima_visita: null,
    visited: false,

    created_at: now,
    updated_at: now,
    synced:false
  };



  await addAgency(agency);
  return agency;
}

