// Capa de sonido: escucha el bus de eventos y sintetiza con WebAudio, sin
// assets. El acorde de acierto es idéntico en los 4 mundos: es la firma
// sonora del juego (GAMEFEEL.md 6 y 9). No existe el sonido de error.

import type { BusEventos } from '../engine';

export function conectarSonidos(bus: BusEventos, estaActivo: () => boolean): () => void {
  let contexto: AudioContext | null = null;

  const tono = (
    frecuencia: number,
    duracion: number,
    tipo: OscillatorType = 'sine',
    volumen = 0.14,
    demora = 0,
  ) => {
    if (!estaActivo()) return;
    contexto ??= new AudioContext();
    if (contexto.state === 'suspended') void contexto.resume();
    const inicio = contexto.currentTime + demora;
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    oscilador.type = tipo;
    oscilador.frequency.value = frecuencia;
    ganancia.gain.setValueAtTime(volumen, inicio);
    ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);
    oscilador.connect(ganancia).connect(contexto.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracion);
  };

  return bus.escuchar((evento) => {
    switch (evento.tipo) {
      case 'pieza_agarrada': // pop suave
        tono(520, 0.07, 'sine', 0.1);
        break;
      case 'pieza_soltada_ok': // click grave y satisfactorio
        tono(190, 0.09, 'square', 0.16);
        tono(380, 0.06, 'sine', 0.08, 0.02);
        break;
      case 'pieza_soltada_fuera': // boing grave neutro, jamás sonido de error
        tono(150, 0.22, 'triangle', 0.12);
        break;
      case 'progreso_parcial': // nota corta ascendente
        tono(659, 0.1, 'sine', 0.13);
        tono(880, 0.12, 'sine', 0.13, 0.09);
        break;
      case 'puzzle_resuelto': // acorde ascendente: la firma del juego
        [523.25, 659.25, 783.99, 1046.5].forEach((frecuencia, i) =>
          tono(frecuencia, 0.4, 'sine', 0.13, i * 0.09),
        );
        break;
    }
  });
}
