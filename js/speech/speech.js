export async function decir(agencia, text = "") {
    let msg;

    // 1. Validaciones
    if (!agencia) {
        msg = "No hay número de agencia";
    } else if (!/^\d+$/.test(agencia.toString())) { // Convertimos a string por si acaso
        msg = "El identificador de agencia debe contener solo números";
    } else {
        // 2. Formateo por pares (ej: "1234" -> "12 34")
        const pares = agencia.toString().match(/.{1,2}/g);
        const numeroEspaciado = pares.join(" ");
        
        // Construimos la frase final
        msg = `La agencia ${numeroEspaciado} ${text}`;
    }

    // 3. Síntesis de voz
    const mensaje = new SpeechSynthesisUtterance(msg);
    mensaje.lang = "es-ES";
    mensaje.rate = 0.9;

    window.speechSynthesis.cancel();
    sonarAlerta(); 
    
    // Un pequeño retraso de 150ms para que el beep no tape la voz
    setTimeout(() => {
        window.speechSynthesis.speak(mensaje);
    }, 150);
}

export async function decirTexto(text) {

    const mensaje = new SpeechSynthesisUtterance(text);
    mensaje.lang = "es-ES";
    mensaje.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(mensaje);
}

function sonarAlerta() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine'; // Sonido suave
    oscillator.frequency.setValueAtTime(880, context.currentTime); // Nota La (A5)
    
    gain.gain.setValueAtTime(0.1, context.currentTime); // Volumen bajo
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
}