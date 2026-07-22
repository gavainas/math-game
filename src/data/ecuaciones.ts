// Mundo 4: Ecuaciones (Balanza Mágica). Progresión de DESIGN.md sección 6:
// primero dibujos (sacar el mismo objeto de los dos lados), después los
// dibujos se vuelven números, después la notación real x + 3 = 8, y al final
// multiplicación (2x = 10, tocar los cofres reparte) y combinadas (2x + 3 = 11).
// El cofre 📦 es la incógnita: el objetivo siempre es dejarlo solo de un lado.

import { intercalarRepaso } from '../engine/progresion';
import type { Nivel, TerminoBalanza } from '../engine/tipos';

const o = (icono: string): TerminoBalanza => ({ clase: 'objeto', icono });
const n = (valor: number): TerminoBalanza => ({ clase: 'numero', valor });
const X: TerminoBalanza = { clase: 'incognita' };

function balanza(
  id: string,
  izquierda: TerminoBalanza[],
  derecha: TerminoBalanza[],
  introduceNotacion = false,
): Nivel {
  return {
    id,
    mundo: 'ecuaciones',
    tipo: 'balanza',
    objetivo: { tipo: 'balanza', izquierda, derecha },
    introduceNotacion: introduceNotacion || undefined,
    pistas: [],
  };
}

const NIVELES_NUEVOS: Nivel[] = [
  // Con dibujos: sacar el mismo objeto de los dos lados
  balanza('m4-n01', [X, o('🍎')], [o('🍎'), o('🍎'), o('🍎')]),
  balanza('m4-n02', [X, o('🍎'), o('🍎')], [o('🍎'), o('🍎'), o('🍎'), o('🍎'), o('🍎')]),
  balanza('m4-n03', [X, o('🍌'), o('🍎')], [o('🍎'), o('🍌'), o('🍌'), o('🍎'), o('🍎')]),
  balanza('m4-n04', [o('🍎'), X, o('🍌')], [o('🍌'), o('🍎'), o('🍎'), o('🍎')]),
  balanza('m4-n05', [X, o('🍇'), o('🍇'), o('🍎')], [o('🍎'), o('🍎'), o('🍇'), o('🍇'), o('🍇')]),
  balanza('m4-n06', [o('🍌'), X, o('🍎'), o('🍎')], [o('🍎'), o('🍌'), o('🍌'), o('🍎'), o('🍎')]),
  // Los dibujos se vuelven números
  balanza('m4-n07', [X, n(3)], [n(8)]),
  balanza('m4-n08', [X, n(5)], [n(12)]),
  balanza('m4-n09', [n(2), X], [n(9)]),
  balanza('m4-n10', [X, n(6)], [n(13)]),
  // Notación real: la ecuación aparece escrita arriba de la balanza
  balanza('m4-n11', [X, n(3)], [n(8)], true),
  balanza('m4-n12', [X, n(7)], [n(15)]),
  balanza('m4-n13', [n(4), X], [n(11)]),
  // Multiplicación: tocar los cofres reparte el otro lado (usa el Mundo 2)
  balanza('m4-n14', [X, X], [n(10)]),
  balanza('m4-n15', [X, X, X], [n(12)]),
  // Combinadas: primero sacar lo suelto, después repartir
  balanza('m4-n16', [X, X, n(3)], [n(11)]),
  balanza('m4-n17', [X, X, X, n(2)], [n(14)]),
  balanza('m4-n18', [n(5), X, X], [n(17)]),
];

export const nivelesEcuaciones: Nivel[] = intercalarRepaso(NIVELES_NUEVOS, 4);

const ORDEN_BASE = NIVELES_NUEVOS.map((nivel) => nivel.id);

export function caracteristicasEcuaciones(nivelId: string): { mostrarNotacion: boolean } {
  const posicion = ORDEN_BASE.indexOf(nivelId.replace(/--repaso\d+$/, ''));
  return { mostrarNotacion: posicion >= ORDEN_BASE.indexOf('m4-n11') };
}
