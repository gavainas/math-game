import { describe, expect, it } from 'vitest';
import { progresoInicial } from './progreso';
import {
  calcularEtapaMascota,
  completarNivel,
  estaDesbloqueado,
  intercalarRepaso,
  mundoCompleto,
  puedeJugar,
  siguienteNivel,
} from './progresion';
import type { Mundo, Nivel } from './tipos';

function nivelGrilla(id: string, mundo: Mundo): Nivel {
  return {
    id,
    mundo,
    tipo: 'grilla',
    objetivo: { tipo: 'grilla', modo: 'armar', filas: 2, columnas: 2 },
    pistas: [],
  };
}

const niveles: Nivel[] = [
  nivelGrilla('m1-n01', 'multiplicacion'),
  nivelGrilla('m1-n02', 'multiplicacion'),
  nivelGrilla('m2-n01', 'division'),
];

describe('progresión', () => {
  it('arranca con solo multiplicación desbloqueada', () => {
    const progreso = progresoInicial();
    expect(estaDesbloqueado('multiplicacion', progreso)).toBe(true);
    expect(estaDesbloqueado('division', progreso)).toBe(false);
  });

  it('el siguiente nivel es el primer pendiente en orden', () => {
    let progreso = progresoInicial();
    expect(siguienteNivel(niveles, progreso)?.id).toBe('m1-n01');

    progreso = completarNivel(niveles, progreso, 'm1-n01', 3);
    expect(siguienteNivel(niveles, progreso)?.id).toBe('m1-n02');
  });

  it('permite rejugar lo pasado pero no saltear pendientes', () => {
    const progreso = completarNivel(niveles, progresoInicial(), 'm1-n01', 2);
    expect(puedeJugar(niveles[0], niveles, progreso)).toBe(true); // replay
    expect(puedeJugar(niveles[1], niveles, progreso)).toBe(true); // el que sigue
    expect(puedeJugar(niveles[2], niveles, progreso)).toBe(false); // mundo bloqueado
  });

  it('completar un mundo desbloquea el siguiente y sube la etapa de la mascota', () => {
    let progreso = progresoInicial();
    progreso = completarNivel(niveles, progreso, 'm1-n01', 3);
    expect(progreso.mundoDesbloqueado).toBe('multiplicacion');
    expect(progreso.etapaMascota).toBe(0);

    progreso = completarNivel(niveles, progreso, 'm1-n02', 1);
    expect(mundoCompleto(niveles, 'multiplicacion', progreso)).toBe(true);
    expect(progreso.mundoDesbloqueado).toBe('division');
    expect(calcularEtapaMascota(niveles, progreso)).toBe(1);
    expect(progreso.etapaMascota).toBe(1);
  });

  it('rejugar conserva las mejores estrellas', () => {
    let progreso = completarNivel(niveles, progresoInicial(), 'm1-n01', 3);
    progreso = completarNivel(niveles, progreso, 'm1-n01', 1);
    expect(progreso.nivelesCompletados['m1-n01'].estrellas).toBe(3);
  });

  it('el sandbox se abre recién con el mundo completo y nunca lo bloquea', () => {
    const sandbox: Nivel = {
      id: 'm1-sandbox',
      mundo: 'multiplicacion',
      tipo: 'sandbox',
      objetivo: { tipo: 'sandbox' },
      pistas: [],
    };
    const conSandbox = [...niveles, sandbox];
    let progreso = completarNivel(conSandbox, progresoInicial(), 'm1-n01', 3);
    expect(puedeJugar(sandbox, conSandbox, progreso)).toBe(false);

    progreso = completarNivel(conSandbox, progreso, 'm1-n02', 3);
    expect(puedeJugar(sandbox, conSandbox, progreso)).toBe(true);
    expect(progreso.mundoDesbloqueado).toBe('division'); // sin pasar por el sandbox
  });

  it('intercala repaso cada N niveles, marcado y con id propio', () => {
    const ocho = Array.from({ length: 8 }, (_, i) =>
      nivelGrilla(`m1-n0${i + 1}`, 'multiplicacion'),
    );
    const secuencia = intercalarRepaso(ocho, 4);

    expect(secuencia).toHaveLength(10);
    const repasos = secuencia.filter((n) => n.esRepaso);
    expect(repasos).toHaveLength(2);
    expect(secuencia[4].esRepaso).toBe(true); // después del 4to nivel nuevo
    expect(repasos[0].id).not.toBe(repasos[0].id.replace(/--repaso\d+$/, '')); // id único
    expect(new Set(secuencia.map((n) => n.id)).size).toBe(secuencia.length);
  });
});
