// Sesión de un nivel en juego: recibe estados del puzzle, evalúa y emite los
// eventos de feedback (GAMEFEEL.md 11.2). También lleva la cuenta de intentos
// iguales y de ayudas para calcular las estrellas.

import { busJuego } from './eventos';
import type { Emisor } from './eventos';
import { evaluarNivel } from './validacion';
import type { EstadoPuzzle } from './validacion';
import type { Estrellas, Nivel } from './tipos';

export type SesionNivel = {
  actualizarEstado: (estado: EstadoPuzzle) => void;
  // Un intento que no encaja, identificado por una firma estable (ej: el slot
  // donde se intentó soltar). Tres firmas iguales seguidas activan la pista visual.
  registrarIntentoFallido: (firma: string) => void;
  usarPista: () => void;
  encontrarSecreto: (secretoId: string) => void;
  estaResuelto: () => boolean;
};

export function crearSesionNivel(nivel: Nivel, emitir: Emisor = busJuego.emitir): SesionNivel {
  let mayorAvance = 0;
  let resuelto = false;
  let pulsoActivado = false;
  let pistasPedidas = 0;
  let firmaAnterior: string | null = null;
  let repeticiones = 0;

  // Estrellas: 3 sin ninguna ayuda, 2 si se activó el pulso automático
  // (intentos_repetidos), 1 si pidió una pista explícita (DESIGN.md 8).
  const estrellas = (): Estrellas => (pistasPedidas > 0 ? 1 : pulsoActivado ? 2 : 3);

  return {
    actualizarEstado(estado) {
      if (resuelto) return;
      const evaluacion = evaluarNivel(nivel, estado);
      if (evaluacion.resuelto) {
        resuelto = true;
        mayorAvance = 1;
        emitir({ tipo: 'puzzle_resuelto', estrellas: estrellas() });
        return;
      }
      if (evaluacion.avance > mayorAvance) {
        mayorAvance = evaluacion.avance;
        // Hubo avance real: se corta la racha de intentos iguales.
        firmaAnterior = null;
        repeticiones = 0;
        emitir({ tipo: 'progreso_parcial' });
      }
    },
    registrarIntentoFallido(firma) {
      if (resuelto) return;
      repeticiones = firma === firmaAnterior ? repeticiones + 1 : 1;
      firmaAnterior = firma;
      if (repeticiones >= 3) {
        pulsoActivado = true;
        repeticiones = 0;
        firmaAnterior = null;
        emitir({ tipo: 'intentos_repetidos' });
      }
    },
    usarPista() {
      pistasPedidas++;
    },
    encontrarSecreto(secretoId) {
      emitir({ tipo: 'secreto_encontrado', secretoId });
    },
    estaResuelto: () => resuelto,
  };
}
