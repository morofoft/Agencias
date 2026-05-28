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

/**
 * Procesa un bloque de texto plano, extrae las agencias y las guarda.
 * Soporta separación por espacios, tabulaciones y cadenas con comillas.
 * @param {string} rawText - El texto pegado desde la interfaz.
 * @param {Function} logger - Callback opcional para enviar logs en tiempo real a la UI.
 */
export async function processBulkAgencies(rawText, logger = console.log) {
  const lines = rawText.split(/\r?\n/);
  let creadas = 0;
  let errores = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Expresión regular inteligente: extrae argumentos separados por espacios 
      // pero respeta el texto que esté encerrado entre comillas dobles.
      const regex = /[^\s"]+|"([^"]*)"/gi;
      const parts = [];
      let match;

      while ((match = regex.exec(line)) !== null) {
        // Si el match capturó el grupo 1 (adentro de las comillas), usamos ese; si no, el match completo.
        parts.push(match[1] !== undefined ? match[1] : match[0]);
      }

      // Verificamos que tengamos los 4 componentes requeridos
      if (parts.length < 4) {
        logger(`Línea ${i + 1}: Formato no reconocido (Se esperaban 4 columnas). Saltando...`, 'error');
        errores++;
        continue;
      }

      // Mapeo exacto según tu estructura de entrada
      const terminalId = parts[0].trim();
      const direccion = parts[1].trim();
      const zona = parts[2].trim() || 'LOCALES';
      const geoRaw = parts[3].trim();

      // Separar lat y lng de la geolocalización ("18.941694,-71.254682")
      const geoParts = geoRaw.split(',');
      if (geoParts.length !== 2) {
        logger(`Línea ${i + 1} (Terminal: ${terminalId}): Coordenadas inválidas "${geoRaw}".`, 'error');
        errores++;
        continue;
      }

      const coords = {
        latitude: parseFloat(geoParts[0].trim()),
        longitude: parseFloat(geoParts[1].trim())
      };

      const formValues = {
        codigo: terminalId,
        direccion: direccion,
        zona: zona
      };

      // Validación numérica estricta para evitar datos corruptos en el mapa
      if (isNaN(coords.latitude) || isNaN(coords.longitude)) {
        logger(`Línea ${i + 1} (Terminal: ${terminalId}): Lat o Lng no son números válidos.`, 'error');
        errores++;
        continue;
      }

      // Ejecutar tu almacenamiento original
      await createAgencyFromGPS(coords, formValues);
      
      logger(`Agencia ${terminalId} ("${direccion}") guardada con éxito.`, 'success');
      creadas++;

    } catch (err) {
      logger(`Error en línea ${i + 1}: ${err.message}`, 'error');
      errores++;
    }
  }

  logger(`Resumen: ${creadas} añadidas correctamente. ${errores} errores.`, 'info');
}