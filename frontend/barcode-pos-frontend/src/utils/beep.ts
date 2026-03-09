let audioCtx: AudioContext | null = null;

/**
 * Web Audio API ile kısa bip sesi çalar.
 * Harici dosya gerektirmez, tamamen kod ile üretilir.
 */
export function playBeep(frequency = 1200, duration = 120) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.15;

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  } catch {
    // Ses çalamazsa sessizce devam et
  }
}

/** Ürün bulunamadı hatası için farklı tonlu ses */
export function playErrorBeep() {
  playBeep(400, 250);
}
