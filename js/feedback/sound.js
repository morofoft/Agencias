export function playSound() {
    const audio = new Audio('assets/sounds/check.mp3');
    audio.play().catch(() => {});
  }
  