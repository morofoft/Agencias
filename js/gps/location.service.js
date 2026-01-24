let watchId = null;
let retryTimeout = null;
let goodFixes = [];

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

    // 🔴 Limpia watch anterior (CRÍTICO)
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          accuracy > 25
        ) return;

        // 🧠 Ignorar primeras lecturas
        goodFixes.push({ lat: latitude, lng: longitude, accuracy });

        if (goodFixes.length < 2) return;

        const best = goodFixes.shift();

        onUpdate(best);
      },
      err => {
        console.error('GPS error', err);

        if (err.code === 1) {
          Swal.fire({
            icon: 'error',
            title: 'Permiso denegado',
            text: 'Activa el acceso a tu ubicación.',
            timer: 2500,
            showConfirmButton: false
          });
        }

        if (err.code === 2) {
          Swal.fire({
            icon: 'warning',
            title: 'Ubicación no disponible',
            text: 'Revisa señal GPS o WiFi.',
            timer: 2500,
            showConfirmButton: false
          });
        }

        if (err.code === 3) {
          Swal.fire({
            icon: 'info',
            title: 'GPS lento',
            text: 'Reintentando...',
            timer: 2000,
            showConfirmButton: false
          });

          if (retryTimeout) clearTimeout(retryTimeout);

          retryTimeout = setTimeout(startWatch, 3000);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,      // 🔥 clave
        timeout: 30000
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
