// Niveles placeholder para ejercitar el motor (paso 1 del ROADMAP).
// Los niveles reales del Mundo 1 llegan en el paso 2 y reemplazan este archivo.

import type { Nivel } from '../engine/tipos';

export const nivelPruebaGrilla: Nivel = {
  id: 'prueba-grilla-2x3',
  mundo: 'multiplicacion',
  tipo: 'grilla',
  objetivo: { tipo: 'grilla', modo: 'armar', filas: 2, columnas: 3 },
  pistas: [{ tipo: 'pulso_lugar', lugarId: 'proxima-celda-libre' }],
};

export const nivelesPrueba: Nivel[] = [nivelPruebaGrilla];
