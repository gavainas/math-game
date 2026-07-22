// Validación de niveles: puro y sin eventos. Dado un objetivo y el estado
// actual del puzzle devuelve si está resuelto y cuánto avance hay (0..1).
// No existe "incorrecto": un estado que no resuelve es solo avance parcial
// (CLAUDE.md regla 3).

import type {
  Nivel,
  ObjetivoBalanza,
  ObjetivoBoss,
  ObjetivoCorte,
  ObjetivoGrilla,
  ObjetivoReparto,
  TerminoBalanza,
} from './tipos';

// Estado observable de cada tipo de puzzle. La presentación lo arma a partir
// de lo que el jugador manipuló y se lo pasa a la sesión.
export type EstadoPuzzle =
  | { tipo: 'grilla'; filas: number; columnas: number } // filas completas armadas hasta ahora
  | { tipo: 'reparto'; porAmigo: number[]; sinRepartir: number }
  | { tipo: 'corte'; partes: number; sombreadas: number }
  | { tipo: 'balanza'; izquierda: TerminoBalanza[]; derecha: TerminoBalanza[] }
  | { tipo: 'boss'; rondasResueltas: number }
  | { tipo: 'sandbox' };

export type Evaluacion = {
  resuelto: boolean;
  avance: number; // 0..1; la sesión emite progreso_parcial cuando sube
};

const SIN_AVANCE: Evaluacion = { resuelto: false, avance: 0 };

function acotar(valor: number): number {
  return Math.max(0, Math.min(1, valor));
}

export function evaluarNivel(nivel: Nivel, estado: EstadoPuzzle): Evaluacion {
  switch (nivel.tipo) {
    case 'grilla':
      return estado.tipo === 'grilla' ? evaluarGrilla(nivel.objetivo, estado) : SIN_AVANCE;
    case 'reparto':
      return estado.tipo === 'reparto' ? evaluarReparto(nivel.objetivo, estado) : SIN_AVANCE;
    case 'corte':
      return estado.tipo === 'corte' ? evaluarCorte(nivel.objetivo, estado) : SIN_AVANCE;
    case 'balanza':
      return estado.tipo === 'balanza' ? evaluarBalanza(nivel.objetivo, estado) : SIN_AVANCE;
    case 'boss':
      return estado.tipo === 'boss' ? evaluarBoss(nivel.objetivo, estado) : SIN_AVANCE;
    case 'sandbox':
      return SIN_AVANCE; // el sandbox no se "resuelve": es juego libre
  }
}

function evaluarGrilla(
  objetivo: ObjetivoGrilla,
  estado: { filas: number; columnas: number },
): Evaluacion {
  const celdas = estado.filas * estado.columnas;
  if (objetivo.modo === 'armar') {
    // La conmutatividad vale desde el principio: 3×4 y 4×3 arman el mismo total
    // (DESIGN.md 3, progresión 2).
    const exacta = estado.filas === objetivo.filas && estado.columnas === objetivo.columnas;
    const traspuesta = estado.filas === objetivo.columnas && estado.columnas === objetivo.filas;
    return {
      resuelto: exacta || traspuesta,
      avance: acotar(celdas / (objetivo.filas * objetivo.columnas)),
    };
  }
  return {
    resuelto: estado.filas >= 1 && estado.columnas >= 1 && celdas === objetivo.total,
    avance: acotar(celdas / objetivo.total),
  };
}

function evaluarReparto(
  objetivo: ObjetivoReparto,
  estado: { porAmigo: number[]; sinRepartir: number },
): Evaluacion {
  const repartidos = estado.porAmigo.reduce((suma, n) => suma + n, 0);
  if (objetivo.modo === 'repartir') {
    const cuota = Math.floor(objetivo.cantidad / objetivo.amigos);
    const resto = objetivo.cantidad % objetivo.amigos;
    const resuelto =
      estado.porAmigo.length === objetivo.amigos &&
      estado.porAmigo.every((n) => n === cuota) &&
      estado.sinRepartir === resto;
    const repartibles = objetivo.cantidad - resto;
    return { resuelto, avance: repartibles > 0 ? acotar(repartidos / repartibles) : 0 };
  }
  const resuelto =
    estado.porAmigo.length > 0 &&
    estado.porAmigo.every((n) => n === objetivo.porAmigo) &&
    estado.sinRepartir === 0 &&
    estado.porAmigo.length * objetivo.porAmigo === objetivo.cantidad;
  return { resuelto, avance: acotar(repartidos / objetivo.cantidad) };
}

function evaluarCorte(
  objetivo: ObjetivoCorte,
  estado: { partes: number; sombreadas: number },
): Evaluacion {
  if (objetivo.modo === 'cortar') {
    return {
      resuelto: estado.partes === objetivo.partes,
      avance: acotar(estado.partes / objetivo.partes),
    };
  }
  const partesListas = estado.partes === objetivo.partes;
  return {
    resuelto: partesListas && estado.sombreadas === objetivo.sombreadas,
    avance: partesListas
      ? acotar(0.5 + 0.5 * (estado.sombreadas / objetivo.sombreadas))
      : acotar(0.5 * (estado.partes / objetivo.partes)),
  };
}

function evaluarBalanza(
  objetivo: ObjetivoBalanza,
  estado: { izquierda: TerminoBalanza[]; derecha: TerminoBalanza[] },
): Evaluacion {
  const soloIncognita = (lado: TerminoBalanza[]) =>
    lado.length === 1 && lado[0].clase === 'incognita';
  const sinIncognita = (lado: TerminoBalanza[]) => lado.every((t) => t.clase !== 'incognita');
  const resuelto =
    (soloIncognita(estado.izquierda) && sinIncognita(estado.derecha)) ||
    (soloIncognita(estado.derecha) && sinIncognita(estado.izquierda));
  // Avance = cuánto se simplificó respecto de la ecuación inicial. La forma
  // resuelta mínima tiene 2 términos: la incógnita y su valor.
  const iniciales = objetivo.izquierda.length + objetivo.derecha.length;
  const actuales = estado.izquierda.length + estado.derecha.length;
  const simplificables = Math.max(1, iniciales - 2);
  return {
    resuelto,
    avance: resuelto ? 1 : acotar((iniciales - actuales) / simplificables),
  };
}

function evaluarBoss(objetivo: ObjetivoBoss, estado: { rondasResueltas: number }): Evaluacion {
  const total = objetivo.rondas.length;
  return {
    resuelto: total > 0 && estado.rondasResueltas >= total,
    avance: total > 0 ? acotar(estado.rondasResueltas / total) : 0,
  };
}
