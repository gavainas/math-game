// Mundo 1: Multiplicación (Array Garden). Progresión de DESIGN.md sección 3:
// una idea nueva por nivel, el símbolo × recién después de ~15 puzzles.
// La secuencia final intercala repaso espaciado (DESIGN.md 7).

import { intercalarRepaso } from '../engine/progresion';
import type { Nivel } from '../engine/tipos';

function armar(id: string, filas: number, columnas: number, introduceNotacion = false): Nivel {
  return {
    id,
    mundo: 'multiplicacion',
    tipo: 'grilla',
    objetivo: { tipo: 'grilla', modo: 'armar', filas, columnas },
    introduceNotacion: introduceNotacion || undefined,
    pistas: [{ tipo: 'pulso_lugar', lugarId: 'proxima-celda-libre' }],
  };
}

function espejo(id: string, total: number): Nivel {
  return {
    id,
    mundo: 'multiplicacion',
    tipo: 'grilla',
    objetivo: { tipo: 'grilla', modo: 'total', total },
    esEspejo: true,
    pistas: [],
  };
}

const NIVELES_NUEVOS: Nivel[] = [
  // Tramo 1: armar grupos iguales, sin números a la vista
  armar('m1-n01', 2, 2),
  armar('m1-n02', 3, 2),
  // Tramo 2: conmutatividad sin nombrarla (la traspuesta también resuelve)
  armar('m1-n03', 2, 3),
  armar('m1-n04', 4, 2),
  // Tramo 3: aparece el total como contador
  armar('m1-n05', 3, 3),
  armar('m1-n06', 4, 3),
  // Tramo 4: tablas del 2, 5 y 10 (patrones fáciles de ver)
  armar('m1-n07', 2, 5),
  armar('m1-n08', 5, 3),
  armar('m1-n09', 2, 10),
  armar('m1-n10', 5, 4),
  // Tramo 5: espejo — acá está el total, armá una grilla que lo produzca
  espejo('m1-n11', 12),
  espejo('m1-n12', 20),
  // Tramo 6: notación × por primera vez
  armar('m1-n13', 3, 4, true),
  armar('m1-n14', 4, 5),
  espejo('m1-n15', 18),
];

export const nivelesMultiplicacion: Nivel[] = intercalarRepaso(NIVELES_NUEVOS, 4);

const ORDEN_BASE = NIVELES_NUEVOS.map((nivel) => nivel.id);

function posicionBase(nivelId: string): number {
  return ORDEN_BASE.indexOf(nivelId.replace(/--repaso\d+$/, ''));
}

// Qué elementos de UI corresponden a cada nivel según su lugar en la
// progresión. Un repaso conserva la presentación del nivel original.
export function caracteristicasNivel(nivelId: string): {
  mostrarTotal: boolean;
  mostrarNotacion: boolean;
} {
  const posicion = posicionBase(nivelId);
  return {
    mostrarTotal: posicion >= ORDEN_BASE.indexOf('m1-n05'),
    mostrarNotacion: posicion >= ORDEN_BASE.indexOf('m1-n13'),
  };
}
