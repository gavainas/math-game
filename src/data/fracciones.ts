// Mundo 3: Fracciones (Partes de un Todo). Progresión de DESIGN.md sección 5:
// primero cortar copiando un modelo (sin números), después cortar y servir
// porciones, la notación a/b recién ligada a lo que ya hizo, y fracción de una
// cantidad con fichas. Comparar, equivalentes y suma con mismo denominador
// quedan para la siguiente tanda (anotado en ROADMAP.md).

import { intercalarRepaso } from '../engine/progresion';
import type { Nivel } from '../engine/tipos';

function cortar(id: string, partes: number): Nivel {
  return {
    id,
    mundo: 'fracciones',
    tipo: 'corte',
    objetivo: { tipo: 'corte', modo: 'cortar', partes },
    pistas: [],
  };
}

function sombrear(id: string, partes: number, sombreadas: number, introduceNotacion = false): Nivel {
  return {
    id,
    mundo: 'fracciones',
    tipo: 'corte',
    objetivo: { tipo: 'corte', modo: 'sombrear', partes, sombreadas },
    introduceNotacion: introduceNotacion || undefined,
    pistas: [],
  };
}

function deCantidad(id: string, numerador: number, denominador: number, cantidad: number): Nivel {
  return {
    id,
    mundo: 'fracciones',
    tipo: 'corte',
    objetivo: { tipo: 'corte', modo: 'deCantidad', numerador, denominador, cantidad },
    pistas: [],
  };
}

const NIVELES_NUEVOS: Nivel[] = [
  // Cortar copiando el modelo, sin números
  cortar('m3-n01', 2),
  cortar('m3-n02', 4),
  cortar('m3-n03', 3),
  cortar('m3-n04', 6),
  // Cortar y servir porciones (el modelo muestra cuáles)
  sombrear('m3-n05', 2, 1),
  sombrear('m3-n06', 4, 1),
  sombrear('m3-n07', 4, 3),
  sombrear('m3-n08', 3, 2),
  sombrear('m3-n09', 6, 2),
  // Notación a/b: ahora la consigna es la fracción escrita
  sombrear('m3-n10', 4, 1, true),
  sombrear('m3-n11', 2, 1),
  sombrear('m3-n12', 3, 2),
  sombrear('m3-n13', 6, 5),
  sombrear('m3-n14', 8, 3),
  // Fracción de una cantidad, con fichas
  deCantidad('m3-n15', 1, 2, 8),
  deCantidad('m3-n16', 1, 3, 12),
  deCantidad('m3-n17', 1, 4, 20),
  deCantidad('m3-n18', 3, 4, 8),
];

export const nivelesFracciones: Nivel[] = intercalarRepaso(NIVELES_NUEVOS, 4);

const ORDEN_BASE = NIVELES_NUEVOS.map((nivel) => nivel.id);

export function caracteristicasFracciones(nivelId: string): { mostrarNotacion: boolean } {
  const posicion = ORDEN_BASE.indexOf(nivelId.replace(/--repaso\d+$/, ''));
  return { mostrarNotacion: posicion >= ORDEN_BASE.indexOf('m3-n10') };
}

// Distractores para fracción de cantidad: cerca del correcto, deterministas.
export function opcionesFraccion(
  numerador: number,
  denominador: number,
  cantidad: number,
): number[] {
  const correcto = (cantidad * numerador) / denominador;
  const candidatos = [correcto, correcto + 1, correcto - 1, cantidad / denominador, correcto + 2];
  const unicos = [...new Set(candidatos.filter((n) => n > 0 && Number.isInteger(n)))].slice(0, 4);
  const giro = cantidad % unicos.length;
  return [...unicos.slice(giro), ...unicos.slice(0, giro)];
}
