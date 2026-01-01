export function now() {
    return Date.now();
  }
  
  export function formatDate(ts) {
    return new Date(ts).toLocaleString();
  }
  