import { addPointToRoute } from './routes.store.js';

let tracking = false;
let currentRouteId = null;

export function startTracking(routeId) {
  tracking = true;
  currentRouteId = routeId;
}

export function stopTracking() {
  tracking = false;
  currentRouteId = null;
}

export function onLocationUpdate(pos) {
  if (!tracking || !currentRouteId) return;

  addPointToRoute(currentRouteId, {
    lat: pos.lat,
    lng: pos.lng,
    timestamp: Date.now()
  });
}
