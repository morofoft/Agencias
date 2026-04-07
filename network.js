// network.js - Versión módulo
export function initNetworkStatus() {
  const statusEl = document.getElementById('networkStatus');
  
  function updateNetworkStatus() {
    if (!statusEl) return;
    if (navigator.onLine) {
      statusEl.innerHTML = '<span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online';
    } else {
      statusEl.innerHTML = '<span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Offline';
    }
  }
  
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
}