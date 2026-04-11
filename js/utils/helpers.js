// js/utils/helpers.js
// Archivo único para funciones utilitarias

/**
 * Distancia Haversine (única fuente de verdad)
 * Calcula la distancia en metros entre dos coordenadas
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
    // Validar coordenadas
    if (!isValidCoordinates(lat1, lon1) || !isValidCoordinates(lat2, lon2)) {
        return Infinity;
    }
    
    const R = 6371e3; // Radio de la Tierra en metros
    const toRad = (x) => (x * Math.PI) / 180;
    
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * Validar coordenadas
 */
export function isValidCoordinates(lat, lng) {
    return typeof lat === 'number' && 
           typeof lng === 'number' && 
           !isNaN(lat) && 
           !isNaN(lng) && 
           Math.abs(lat) <= 90 && 
           Math.abs(lng) <= 180;
}

/**
 * Escape HTML (prevenir XSS)
 */
export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

/**
 * Toast unificado
 */
export function showToast(icon, title, timer = 2500) {
    if (typeof Swal === 'undefined') {
        console.log(`[${icon}] ${title}`);
        return;
    }
    
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true
    });
    Toast.fire({ icon, title });
}

/**
 * Formatear fecha
 */
export function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('es-DO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Throttle para eventos frecuentes (ej: scroll, resize)
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce para búsquedas (ej: input)
 */
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Generar ID único
 */
export function generateId() {
    return crypto.randomUUID();
}

/**
 * Obtener distancia formateada (metros o km)
 */
export function formatDistance(meters) {
    if (!meters || meters === Infinity) return '--';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Copiar al portapapeles
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('success', 'Copiado al portapapeles');
        return true;
    } catch (err) {
        console.error('Error copying:', err);
        showToast('error', 'No se pudo copiar');
        return false;
    }
}

/**
 * Descargar archivo JSON
 */
export function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('es-DO');
}

/**
 * Truncar texto
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Grupo de zonas para normalización
 */
export const ZONE_NORMALIZATION = {
    'san juan centro': 'SAN JUAN CENTRO',
    'centro': 'SAN JUAN CENTRO',
    'sanjuan centro': 'SAN JUAN CENTRO',
    'los corbano': 'LOS CORBANO',
    'corbano': 'LOS CORBANO',
    'vallejuelo': 'VALLEJUELO',
    'las matas de farfan': 'LAS MATAS DE FARFAN',
    'las matas': 'LAS MATAS DE FARFAN',
    'rafael baez': 'RAFAEL BAEZ',
    'rafael báez': 'RAFAEL BAEZ',
    'luis edwardo luciano': 'LUIS EDWARDO LUCIANO',
    'el rosario': 'EL ROSARIO',
    'pedro corto': 'PEDRO CORTO',
    'elias piña': 'ELIAS PIÑA',
    'elías piña': 'ELIAS PIÑA',
    'el cercado': 'EL CERCADO',
    'km.11': 'KM.11',
    'cuenda': 'CUENDA',
    'cardon': 'CARDON',
    'la cualta': 'LA CUALTA',
    'juan santiago': 'JUAN SANTIAGO'
};

/**
 * Normalizar nombre de zona
 */
export function normalizeZone(zone) {
    if (!zone) return 'SIN ZONA';
    const lowerZone = zone.toLowerCase().trim();
    return ZONE_NORMALIZATION[lowerZone] || zone.toUpperCase();
}

/**
 * Validar ID de agencia (debe empezar con 812)
 */
export function isValidAgencyId(idReal) {
    if (!idReal) return false;
    const strId = String(idReal);
    return strId.startsWith('812') && strId.length >= 7;
}

/**
 * Limpiar ID mal formado (812127001 → 8127001)
 */
export function cleanAgencyId(idReal) {
    if (!idReal) return null;
    let strId = String(idReal);
    
    // Si no empieza con 812, agregar prefijo
    if (!strId.startsWith('812')) {
        strId = '812' + strId;
    }
    
    // Eliminar 812 duplicado
    if (strId.startsWith('812812')) {
        strId = '812' + strId.substring(6);
    }
    
    // Si es demasiado largo, tomar solo los últimos 7-8 dígitos
    if (strId.length > 10) {
        strId = '812' + strId.slice(-7);
    }
    
    return strId;
}