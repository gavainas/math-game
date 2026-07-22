// Mundo 2: División (Reparto Justo). Progresión de DESIGN.md sección 4 con la
// misma filosofía de dificultad del Mundo 1: se reparte tocando y decidiendo,
// el resto queda siempre visible, los espejos preguntan por la cantidad de
// amigos, y los cocientes de 2 dígitos van por predicción (repartir 84 a mano
// sería tedio, no matemática). El símbolo ÷ recién aparece a mitad del mundo.

import { intercalarRepaso } from '../engine/progresion';
import type { Nivel } from '../engine/tipos';

function repartir(id: string, cantidad: number, amigos: number, introduceNotacion = false): Nivel {
  return {
    id,
    mundo: 'division',
    tipo: 'reparto',
    objetivo: { tipo: 'reparto', modo: 'repartir', cantidad, amigos },
    introduceNotacion: introduceNotacion || undefined,
    pistas: [],
  };
}

function espejoAmigos(id: string, cantidad: number, porAmigo: number): Nivel {
  return {
    id,
    mundo: 'division',
    tipo: 'reparto',
    objetivo: { tipo: 'reparto', modo: 'amigos', cantidad, porAmigo },
    esEspejo: true,
    pistas: [],
  };
}

function predecir(id: string, cantidad: number, amigos: number): Nivel {
  return {
    id,
    mundo: 'division',
    tipo: 'reparto',
    objetivo: { tipo: 'reparto', modo: 'predecir', cantidad, amigos },
    pistas: [],
  };
}

const NIVELES_NUEVOS: Nivel[] = [
  // Reparto justo sin resto
  repartir('m2-n01', 6, 2),
  repartir('m2-n02', 12, 3),
  repartir('m2-n03', 15, 5),
  repartir('m2-n04', 16, 4),
  // Con resto visible: lo que sobra se queda al costado, no desaparece
  repartir('m2-n05', 7, 2),
  repartir('m2-n06', 13, 3),
  repartir('m2-n07', 17, 5),
  repartir('m2-n08', 23, 4),
  // Espejo: cada uno recibe C, ¿cuántos amigos entran?
  espejoAmigos('m2-n09', 12, 4),
  espejoAmigos('m2-n10', 15, 5),
  espejoAmigos('m2-n11', 24, 6),
  espejoAmigos('m2-n12', 18, 3),
  // Notación ÷
  repartir('m2-n13', 20, 4, true),
  repartir('m2-n14', 27, 3),
  repartir('m2-n15', 32, 8),
  repartir('m2-n16', 29, 4),
  espejoAmigos('m2-n17', 30, 6),
  repartir('m2-n18', 50, 6),
  // Predicción: cocientes con y sin resto, incluidos los de 2 dígitos
  predecir('m2-n19', 24, 6),
  predecir('m2-n20', 35, 5),
  predecir('m2-n21', 43, 6),
  predecir('m2-n22', 84, 4),
  predecir('m2-n23', 96, 8),
];

export const nivelesDivision: Nivel[] = intercalarRepaso(NIVELES_NUEVOS, 4);

const ORDEN_BASE = NIVELES_NUEVOS.map((nivel) => nivel.id);

function posicionBase(nivelId: string): number {
  return ORDEN_BASE.indexOf(nivelId.replace(/--repaso\d+$/, ''));
}

export function caracteristicasDivision(nivelId: string): { mostrarNotacion: boolean } {
  return { mostrarNotacion: posicionBase(nivelId) >= ORDEN_BASE.indexOf('m2-n13') };
}

// Distractores del cociente: cerca del real, deterministas.
export function opcionesCociente(cantidad: number, amigos: number): number[] {
  const cuota = Math.floor(cantidad / amigos);
  const candidatos = [cuota, cuota + 1, cuota - 1, cuota + 3, cuota - 2];
  const unicos = [...new Set(candidatos.filter((n) => n > 0))].slice(0, 4);
  const giro = cantidad % unicos.length;
  return [...unicos.slice(giro), ...unicos.slice(0, giro)];
}
