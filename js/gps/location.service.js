let watchId = null;
let retryTimeout = null;

export function startLocationTracking(onUpdate) {
  if (!navigator.geolocation) {
    Swal.fire({
      icon: 'error',
      title: 'GPS no disponible',
      text: 'Tu navegador no soporta geolocalización.',
      timer: 2500,
      showConfirmButton: false
    });
    return;
  }

  function startWatch() {
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        // Actualiza la posición
        onUpdate({ lat, lng, accuracy: pos.coords.accuracy });
      },
      err => {
        console.error('GPS error', err);

        // Mostrar alerta según tipo de error
        if (err.code === 1) {
          Swal.fire({
            icon: 'error',
            title: 'Permiso denegado',
            text: 'Activa el acceso a tu ubicación para usar el GPS.',
            timer: 2500,
            showConfirmButton: false
          });
        } else if (err.code === 2) {
          Swal.fire({
            icon: 'warning',
            title: 'Ubicación no disponible',
            text: 'No se pudo determinar tu posición. Revisa tu señal.',
            timer: 2500,
            showConfirmButton: false
          });
        } else if (err.code === 3) {
          Swal.fire({
            icon: 'info',
            title: 'GPS lento',
            text: 'Intentando obtener tu ubicación nuevamente...',
            timer: 2500,
            showConfirmButton: false
          });

          // Reintentar automáticamente después de 3s
          if (retryTimeout) clearTimeout(retryTimeout);
          retryTimeout = setTimeout(() => {
            startWatch();
          }, 3000);
        }
      },
      {
        enableHighAccuracy: true,  // ⚡ alta precisión
        maximumAge: 5000,          // usar posición reciente hasta 5s
        timeout: 30000             // esperar hasta 30s
      }
    );
  }

  startWatch();
}

export function stopLocationTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
}
