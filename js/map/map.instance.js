// js/map/map.instance.js
let mapInstance = null;

export function setMapInstance(map) {
  mapInstance = map;
}

export function getMapInstance() {
  return mapInstance;
}