export function vibrate() {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }
  