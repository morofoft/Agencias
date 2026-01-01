export function notifyVisit() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    new Audio('/sounds/check.mp3').play();
  }
  