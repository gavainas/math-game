import { describe, expect, it } from 'vitest';
import { evaluarNivel } from './validacion';
import type { Mundo, Nivel, ObjetivoNivel, TipoNivel } from './tipos';

function nivel(tipo: TipoNivel, objetivo: ObjetivoNivel, mundo: Mundo = 'multiplicacion'): Nivel {
  return { id: 'test', mundo, tipo, objetivo, pistas: [] } as Nivel;
}

describe('grilla', () => {
  const armar = nivel('grilla', { tipo: 'grilla', modo: 'armar', filas: 2, columnas: 3 });

  it('resuelve con las dimensiones exactas', () => {
    expect(evaluarNivel(armar, { tipo: 'grilla', filas: 2, columnas: 3 })).toEqual({
      resuelto: true,
      avance: 1,
    });
  });

  it('acepta la grilla traspuesta (conmutatividad)', () => {
    expect(evaluarNivel(armar, { tipo: 'grilla', filas: 3, columnas: 2 }).resuelto).toBe(true);
  });

  it('avanza por fila completa sin resolver', () => {
    const parcial = evaluarNivel(armar, { tipo: 'grilla', filas: 1, columnas: 3 });
    expect(parcial.resuelto).toBe(false);
    expect(parcial.avance).toBeCloseTo(0.5);
  });

  it('modo total (espejo): cualquier grilla que produzca el total', () => {
    const espejo = nivel('grilla', { tipo: 'grilla', modo: 'total', total: 12 });
    expect(evaluarNivel(espejo, { tipo: 'grilla', filas: 3, columnas: 4 }).resuelto).toBe(true);
    expect(evaluarNivel(espejo, { tipo: 'grilla', filas: 2, columnas: 6 }).resuelto).toBe(true);
    expect(evaluarNivel(espejo, { tipo: 'grilla', filas: 2, columnas: 5 }).resuelto).toBe(false);
  });

  it('modo predecir: se elige el producto correcto', () => {
    const predecir = nivel('grilla', { tipo: 'grilla', modo: 'predecir', filas: 6, columnas: 4 });
    expect(evaluarNivel(predecir, { tipo: 'grilla', filas: 1, columnas: 24 }).resuelto).toBe(true);
    expect(evaluarNivel(predecir, { tipo: 'grilla', filas: 1, columnas: 22 }).resuelto).toBe(false);
    expect(evaluarNivel(predecir, { tipo: 'grilla', filas: 0, columnas: 0 }).resuelto).toBe(false);
  });
});

describe('reparto', () => {
  it('reparte justo con resto visible', () => {
    const conResto = nivel(
      'reparto',
      { tipo: 'reparto', modo: 'repartir', cantidad: 13, amigos: 3 },
      'division',
    );
    expect(
      evaluarNivel(conResto, { tipo: 'reparto', porAmigo: [4, 4, 4], sinRepartir: 1 }).resuelto,
    ).toBe(true);
    // El resto no se puede regalar de más a un amigo.
    expect(
      evaluarNivel(conResto, { tipo: 'reparto', porAmigo: [5, 4, 4], sinRepartir: 0 }).resuelto,
    ).toBe(false);
  });

  it('modo predecir: se elige el cociente correcto (con resto)', () => {
    const predecir = nivel(
      'reparto',
      { tipo: 'reparto', modo: 'predecir', cantidad: 23, amigos: 4 },
      'division',
    );
    expect(
      evaluarNivel(predecir, { tipo: 'reparto', porAmigo: [5], sinRepartir: 0 }).resuelto,
    ).toBe(true);
    expect(
      evaluarNivel(predecir, { tipo: 'reparto', porAmigo: [6], sinRepartir: 0 }).resuelto,
    ).toBe(false);
  });

  it('modo amigos (espejo): ¿cuántos amigos si cada uno recibe 4?', () => {
    const espejo = nivel(
      'reparto',
      { tipo: 'reparto', modo: 'amigos', cantidad: 12, porAmigo: 4 },
      'division',
    );
    expect(
      evaluarNivel(espejo, { tipo: 'reparto', porAmigo: [4, 4, 4], sinRepartir: 0 }).resuelto,
    ).toBe(true);
    expect(
      evaluarNivel(espejo, { tipo: 'reparto', porAmigo: [4, 4], sinRepartir: 4 }).resuelto,
    ).toBe(false);
  });
});

describe('corte', () => {
  it('cortar en partes iguales', () => {
    const cortar = nivel('corte', { tipo: 'corte', modo: 'cortar', partes: 4 }, 'fracciones');
    expect(evaluarNivel(cortar, { tipo: 'corte', partes: 4, sombreadas: 0 }).resuelto).toBe(true);
    expect(evaluarNivel(cortar, { tipo: 'corte', partes: 3, sombreadas: 0 }).resuelto).toBe(false);
  });

  it('modo deCantidad: elegir cuánto es la fracción de una cantidad', () => {
    const deCantidad = nivel(
      'corte',
      { tipo: 'corte', modo: 'deCantidad', numerador: 1, denominador: 2, cantidad: 8 },
      'fracciones',
    );
    expect(evaluarNivel(deCantidad, { tipo: 'corte', partes: 1, sombreadas: 4 }).resuelto).toBe(
      true,
    );
    expect(evaluarNivel(deCantidad, { tipo: 'corte', partes: 1, sombreadas: 3 }).resuelto).toBe(
      false,
    );
  });

  it('sombrear pide partes y sombreadas exactas', () => {
    const sombrear = nivel(
      'corte',
      { tipo: 'corte', modo: 'sombrear', partes: 4, sombreadas: 1 },
      'fracciones',
    );
    expect(evaluarNivel(sombrear, { tipo: 'corte', partes: 4, sombreadas: 1 }).resuelto).toBe(true);
    const soloCorte = evaluarNivel(sombrear, { tipo: 'corte', partes: 4, sombreadas: 0 });
    expect(soloCorte.resuelto).toBe(false);
    expect(soloCorte.avance).toBeCloseTo(0.5);
  });
});

describe('balanza', () => {
  const objetivo = nivel(
    'balanza',
    {
      tipo: 'balanza',
      izquierda: [{ clase: 'incognita' }, { clase: 'numero', valor: 3 }],
      derecha: [{ clase: 'numero', valor: 8 }],
    },
    'ecuaciones',
  );

  it('se resuelve con la incógnita sola de un lado', () => {
    const despejada = evaluarNivel(objetivo, {
      tipo: 'balanza',
      izquierda: [{ clase: 'incognita' }],
      derecha: [{ clase: 'numero', valor: 5 }],
    });
    expect(despejada.resuelto).toBe(true);
  });

  it('no se resuelve si quedan términos alrededor de la incógnita', () => {
    const intacta = evaluarNivel(objetivo, {
      tipo: 'balanza',
      izquierda: [{ clase: 'incognita' }, { clase: 'numero', valor: 3 }],
      derecha: [{ clase: 'numero', valor: 8 }],
    });
    expect(intacta.resuelto).toBe(false);
    expect(intacta.avance).toBe(0);
  });
});

describe('boss y sandbox', () => {
  it('el boss se resuelve al completar todas las rondas', () => {
    const boss = nivel('boss', {
      tipo: 'boss',
      rondas: [
        { tipo: 'grilla', modo: 'armar', filas: 2, columnas: 2 },
        { tipo: 'grilla', modo: 'armar', filas: 3, columnas: 3 },
      ],
    });
    expect(evaluarNivel(boss, { tipo: 'boss', rondasResueltas: 1 })).toEqual({
      resuelto: false,
      avance: 0.5,
    });
    expect(evaluarNivel(boss, { tipo: 'boss', rondasResueltas: 2 }).resuelto).toBe(true);
  });

  it('el sandbox nunca se resuelve: es juego libre', () => {
    const sandbox = nivel('sandbox', { tipo: 'sandbox' });
    expect(evaluarNivel(sandbox, { tipo: 'sandbox' }).resuelto).toBe(false);
  });
});
