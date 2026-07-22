// Detector de inactividad (GAMEFEEL.md 6 y 7): a los 30 segundos sin input la
// mascota se pone pensativa; a los 60, se duerme. Solo emite eventos.

import { busJuego } from './eventos';
import type { Emisor } from './eventos';

const MS_PRIMER_AVISO = 30_000;
const MS_SEGUNDO_AVISO = 30_000; // 30s después del primero: 60s en total

export type DetectorInactividad = {
  actividad: () => void; // llamar en cada input del jugador
  detener: () => void;
};

export function crearDetectorInactividad(emitir: Emisor = busJuego.emitir): DetectorInactividad {
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  const limpiar = () => {
    if (temporizador !== null) clearTimeout(temporizador);
    temporizador = null;
  };

  const armar = () => {
    temporizador = setTimeout(() => {
      emitir({ tipo: 'inactividad', segundos: 30 });
      temporizador = setTimeout(() => {
        emitir({ tipo: 'inactividad', segundos: 60 });
      }, MS_SEGUNDO_AVISO);
    }, MS_PRIMER_AVISO);
  };

  armar();

  return {
    actividad() {
      limpiar();
      armar();
    },
    detener: limpiar,
  };
}
