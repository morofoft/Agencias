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
    // Es vital que el objeto de configuración sea el segundo parámetro
    map = L.map('map', {
        rotate: true,
        touchRotate: true,
        bearing: 0,
        zoomControl: false
    }).setView(SAN_JUAN, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Forzar el renderizado correcto
    setTimeout(() => { map.invalidateSize(); }, 400);

    renderAgencies(map);
    setupCreateAgency(map);
    setMapInstance(map);

    return map;
}

// export function updateUserPosition(map, position) {
//     if (!map || !position?.lat || !position?.lng) return;

//     const latlng = [position.lat, position.lng];
//     const seguimientoActivo = document.getElementById('seguimiento')?.checked;

//     if (!userMarker) {
//         // Usamos un CircleMarker: es imposible que falle por CSS o iconos
//         userMarker = L.circleMarker(latlng, {
//             radius: 10,
//             fillColor: "#3b82f6",
//             color: "white",
//             weight: 3,
//             fillOpacity: 0.8,
//             zIndexOffset: 1000
//         }).addTo(map);

//         map.setView(latlng, 17);
//     } else {
//         userMarker.setLatLng(latlng);
//     }

//     if (seguimientoActivo) {
//         map.panTo(latlng);
//         // El giro del mapa se encarga el evento en app.js, no aquí.
//     }
// }

let accuracyCircle = null;
export function updateUserPosition(map, position) {
    if (!map || !position.lat || !position.lng) return;

    const latlng = [position.lat, position.lng];
    const seguimientoActivo = document.getElementById('seguimiento')?.checked;
    // --- CÍRCULO DE PRECISIÓN ---
    if (!accuracyCircle) {
        accuracyCircle = L.circle(latlng, {
            radius: position.accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 1,
            interactive: false // No interfiere con clicks en el mapa
        }).addTo(map);
    } else {
        accuracyCircle.setLatLng(latlng);
        accuracyCircle.setRadius(position.accuracy); // Se agranda o achica según la señal
    }

    if (!userMarker) {
        const arrowIcon = L.divIcon({
            className: 'user-location-wrapper',
            html: `<div id="userArrow" style="transition: transform 0.2s ease;">
                    <i class="fa fa-location-arrow" style="font-size: 30px; color: #3b82f6; text-shadow: 0 0 5px white; transform: rotate(-45deg);"></i>
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        userMarker = L.marker(latlng, { icon: arrowIcon, zIndexOffset: 2000 }).addTo(map);
        map.setView(latlng, 17);
    } else {
        userMarker.setLatLng(latlng);
    }
    // Si hay información de hacia dónde apuntas (heading) y NO estás rotando el mapa completo
    if (position.heading !== null && position.heading !== undefined && !seguimientoActivo) {
        const arrowDiv = document.getElementById('userArrow');
        if (arrowDiv) {
            // Rotamos solo la flecha si el mapa está quieto
            arrowDiv.style.transform = `rotate(${position.heading}deg)`;
        }
    }

    if (seguimientoActivo) {
        map.panTo(latlng);
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