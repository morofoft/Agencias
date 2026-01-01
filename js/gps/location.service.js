let watchId = null;

export function startLocationTracking(onUpdate) {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      onUpdate({ lat, lng, accuracy: pos.coords.accuracy });
    },
    err => console.error('GPS error', err),
    {
      enableHighAccuracy: false,
      maximumAge: 10000,
      timeout: 10000
    }
  );
}

export function stopLocationTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
