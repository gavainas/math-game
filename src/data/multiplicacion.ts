// Mundo 1: Multiplicación (Array Garden). Progresión de DESIGN.md sección 3
// con el ajuste de dificultad pedido en las pruebas reales: los dos primeros
// niveles enseñan la interfaz y de ahí en más el jugador construye solo.
//
// - armar en campo libre: la consigna dice "F grupos de C" (o "F × C") y hay
//   que decidir la forma del rectángulo en un campo abierto.
// - espejo (total): dado el número, factorear cualquier rectángulo que lo
//   produzca; hay varias respuestas válidas.
// - predecir: la grilla ya está plantada y hay que elegir el producto
//   correcto entre distractores.
// El símbolo × recién aparece después de ~15 puzzles resueltos construyendo.

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

function predecir(id: string, filas: number, columnas: number): Nivel {
  return {
    id,
    mundo: 'multiplicacion',
    tipo: 'grilla',
    objetivo: { tipo: 'grilla', modo: 'predecir', filas, columnas },
    pistas: [],
  };
}

const NIVELES_NUEVOS: Nivel[] = [
  // Interfaz: grilla marcada, fichas para arrastrar. Solo estos dos son "fáciles".
  armar('m1-n01', 2, 3),
  armar('m1-n02', 3, 3),
  // Grupos de: campo libre, el jugador decide la forma
  armar('m1-n03', 2, 4),
  armar('m1-n04', 4, 3),
  armar('m1-n05', 3, 5), // desde acá aparece el contador de total
  armar('m1-n06', 4, 6),
  // Tablas más duras
  armar('m1-n07', 6, 4),
  armar('m1-n08', 5, 7),
  armar('m1-n09', 8, 3),
  armar('m1-n10', 6, 6),
  armar('m1-n11', 9, 4),
  // Espejo: factorear el total
  espejo('m1-n12', 12),
  espejo('m1-n13', 18),
  espejo('m1-n14', 24),
  espejo('m1-n15', 30),
  // Predicción visual (sin símbolo todavía)
  predecir('m1-n16', 4, 6),
  predecir('m1-n17', 7, 3),
  // Notación ×
  armar('m1-n18', 3, 4, true),
  armar('m1-n19', 7, 5),
  armar('m1-n20', 6, 8),
  armar('m1-n21', 9, 6),
  espejo('m1-n22', 36),
  espejo('m1-n23', 42),
  predecir('m1-n24', 8, 6),
  predecir('m1-n25', 9, 7),
  espejo('m1-n26', 48),
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
  campoLibre: boolean;
} {
  const posicion = posicionBase(nivelId);
  return {
    mostrarTotal: posicion >= ORDEN_BASE.indexOf('m1-n05'),
    mostrarNotacion: posicion >= ORDEN_BASE.indexOf('m1-n18'),
    campoLibre: posicion >= ORDEN_BASE.indexOf('m1-n03'),
  };
}

// Distractores de predicción: cerca del producto real, deterministas.
export function opcionesPrediccion(filas: number, columnas: number): number[] {
  const producto = filas * columnas;
  const candidatos = [producto, producto - columnas, producto + filas, producto - 2, producto + 4];
  const unicos = [...new Set(candidatos.filter((n) => n > 0))].slice(0, 4);
  // Orden estable pero no obvio: rota según el producto.
  const giro = producto % unicos.length;
  return [...unicos.slice(giro), ...unicos.slice(0, giro)];
}
