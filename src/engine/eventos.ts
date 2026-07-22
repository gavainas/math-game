// Sistema de eventos de feedback (GAMEFEEL.md 11.2).
// El engine emite; la presentación (animación, sonido, mascota) escucha.
// Nadie le habla directo a la mascota.

import type { Estrellas } from './tipos';

export type EventoJuego =
  | { tipo: 'pieza_agarrada' }
  | { tipo: 'pieza_soltada_ok' }
  | { tipo: 'pieza_soltada_fuera' }
  | { tipo: 'progreso_parcial' } // fila completa, amigo servido, corte hecho
  | { tipo: 'puzzle_resuelto'; estrellas: Estrellas }
  | { tipo: 'intentos_repetidos' } // 3 intentos iguales: dispara pista visual
  | { tipo: 'inactividad'; segundos: 30 | 60 }
  | { tipo: 'secreto_encontrado'; secretoId: string };

export type Emisor = (evento: EventoJuego) => void;
export type Oyente = (evento: EventoJuego) => void;

export type BusEventos = {
  emitir: Emisor;
  escuchar: (oyente: Oyente) => () => void; // devuelve la baja
};

export function crearBusEventos(): BusEventos {
  const oyentes = new Set<Oyente>();
  return {
    emitir(evento) {
      for (const oyente of [...oyentes]) {
        try {
          oyente(evento);
        } catch (error) {
          // Un oyente roto (una animación, un sonido) no frena el juego.
          console.error('Oyente de eventos falló:', error);
        }
      }
    },
    escuchar(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}

// Bus global del juego: presentación y engine comparten este canal.
export const busJuego = crearBusEventos();
