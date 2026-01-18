/* 1. TODOS LOS IMPORTS AL PRINCIPIO */
import { setMapInstance } from './map.instance.js';
import { renderAgencies, createAgencyFromMap } from '../agencies/agencies.ui.js';

/* 2. VARIABLES DE ESTADO */
let map;
let userMarker = null;
let firstFix = true;
const SAN_JUAN = [18.8059, -71.2299];

/* 3. INICIALIZACIÓN DEL MAPA */
export function initMap() {
    map = L.map('map').setView(SAN_JUAN, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19 
    }).addTo(map);

    renderAgencies(map);
    setupCreateAgency(map);
    setMapInstance(map);
    
    return map;
}

/* 4. ACTUALIZACIÓN DE POSICIÓN, SEGUIMIENTO Y GIRO */
export function updateUserPosition(map, position) {
    if (!map || !position?.lat || !position?.lng) return;

    const latlng = [position.lat, position.lng];
    const seguimientoActivo = document.getElementById('seguimiento').checked;

    // A. Crear o mover el marcador
    if (!userMarker) {
        const arrowIcon = L.divIcon({
            className: 'location-arrow',
            html: '<i class="fa fa-location-arrow" style="font-size:24px; color:#3b82f6; text-shadow: 0 0 3px #fff;"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        userMarker = L.marker(latlng, { icon: arrowIcon }).addTo(map);
    } else {
        userMarker.setLatLng(latlng);
    }

    // B. Lógica de seguimiento (Cámara)
    if (seguimientoActivo) {
        if (firstFix) {
            map.setView(latlng, 17);
            firstFix = false;
        } else {
            map.panTo(latlng);
        }
    }

    // C. Lógica de Rotación (Icono o Mapa)
    if (position.heading !== null && position.heading !== undefined) {
        // Si tienes instalado el plugin Leaflet.Rotate
        if (map.setBearing && seguimientoActivo) {
            map.setBearing(position.heading); 
        } else {
            // Rotar solo la flechita mediante CSS
            const el = userMarker.getElement();
            if (el) {
                // Ajustamos el ángulo (fa-location-arrow apunta a 45° por defecto, 
                // restamos 45 para que 0° sea el Norte real)
                el.style.transformOrigin = "center";
                el.style.transform = `translate3d(${el._leaflet_pos?.x}px, ${el._leaflet_pos?.y}px, 0) rotate(${position.heading - 45}deg)`;
            }
        }
    }
}

/* 5. AYUDANTES (HELPERS) */
function setupCreateAgency(map) {
    map.on('click', async (e) => {
        const confirm = await Swal.fire({
            title: 'Crear agencia',
            text: '¿Agregar agencia en este punto?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        const { value: formValues } = await Swal.fire({
            title: 'Datos de la agencia',
            html: `
                <input id="codigo" class="swal2-input" placeholder="Código">
                <select id="zona" class="swal2-select">
                    <option value="">Seleccione zona</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="OTRA">OTRA</option>
                </select>
                <input id="direccion" class="swal2-input" placeholder="Dirección">
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            preConfirm: () => {
                const codigo = document.getElementById('codigo').value.trim();
                const zona = document.getElementById('zona').value;
                const direccion = document.getElementById('direccion').value.trim();

                if (!codigo || !zona || !direccion) {
                    Swal.showValidationMessage('Todos los campos son obligatorios');
                    return false;
                }
                return { codigo, zona, direccion };
            }
        });

        if (formValues) {
            await createAgencyFromMap(e.latlng, map, formValues);
        }
    });
}