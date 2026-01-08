const statusEl = document.getElementById('networkStatus');

function updateNetworkStatus() {
  if (navigator.onLine) {
    statusEl.textContent = '🟢 Online';
    statusEl.classList.remove('text-red-400');
    statusEl.classList.add('text-green-300');
  } else {
    statusEl.textContent = '🔴 Offline';
    statusEl.classList.remove('text-green-300');
    statusEl.classList.add('text-red-400');
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

updateNetworkStatus();
