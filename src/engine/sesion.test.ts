import { describe, expect, it } from 'vitest';
import { crearSesionNivel } from './sesion';
import type { EventoJuego } from './eventos';
import type { Nivel } from './tipos';

const nivel: Nivel = {
  id: 'test-grilla',
  mundo: 'multiplicacion',
  tipo: 'grilla',
  objetivo: { tipo: 'grilla', modo: 'armar', filas: 2, columnas: 3 },
  pistas: [],
};

function sesionConRegistro() {
  const eventos: EventoJuego[] = [];
  const sesion = crearSesionNivel(nivel, (e) => eventos.push(e));
  return { sesion, eventos };
}

describe('sesión de nivel', () => {
  it('emite progreso_parcial cuando sube el avance y puzzle_resuelto al final', () => {
    const { sesion, eventos } = sesionConRegistro();

    sesion.actualizarEstado({ tipo: 'grilla', filas: 0, columnas: 3 });
    expect(eventos).toEqual([]);

    sesion.actualizarEstado({ tipo: 'grilla', filas: 1, columnas: 3 });
    expect(eventos).toEqual([{ tipo: 'progreso_parcial' }]);

    sesion.actualizarEstado({ tipo: 'grilla', filas: 2, columnas: 3 });
    expect(eventos).toEqual([
      { tipo: 'progreso_parcial' },
      { tipo: 'puzzle_resuelto', estrellas: 3 },
    ]);
    expect(sesion.estaResuelto()).toBe(true);
  });

  it('no vuelve a emitir nada después de resuelto', () => {
    const { sesion, eventos } = sesionConRegistro();
    sesion.actualizarEstado({ tipo: 'grilla', filas: 2, columnas: 3 });
    sesion.actualizarEstado({ tipo: 'grilla', filas: 2, columnas: 3 });
    expect(eventos).toHaveLength(1);
  });

  it('tres intentos iguales activan la pista y bajan a 2 estrellas', () => {
    const { sesion, eventos } = sesionConRegistro();
    sesion.registrarIntentoFallido('celda-0');
    sesion.registrarIntentoFallido('celda-0');
    expect(eventos).toEqual([]);
    sesion.registrarIntentoFallido('celda-0');
    expect(eventos).toEqual([{ tipo: 'intentos_repetidos' }]);

    sesion.actualizarEstado({ tipo: 'grilla', filas: 2, columnas: 3 });
    expect(eventos.at(-1)).toEqual({ tipo: 'puzzle_resuelto', estrellas: 2 });
  });

  it('intentos distintos no disparan la pista', () => {
    const { sesion, eventos } = sesionConRegistro();
    sesion.registrarIntentoFallido('celda-0');
    sesion.registrarIntentoFallido('celda-1');
    sesion.registrarIntentoFallido('celda-0');
    expect(eventos).toEqual([]);
  });

  it('el avance real corta la racha de intentos iguales', () => {
    const { sesion, eventos } = sesionConRegistro();
    sesion.registrarIntentoFallido('celda-0');
    sesion.registrarIntentoFallido('celda-0');
    sesion.actualizarEstado({ tipo: 'grilla', filas: 1, columnas: 3 });
    sesion.registrarIntentoFallido('celda-0');
    expect(eventos.filter((e) => e.tipo === 'intentos_repetidos')).toHaveLength(0);
  });

  it('pedir una pista explícita deja 1 estrella', () => {
    const { sesion, eventos } = sesionConRegistro();
    sesion.usarPista();
    sesion.actualizarEstado({ tipo: 'grilla', filas: 2, columnas: 3 });
    expect(eventos.at(-1)).toEqual({ tipo: 'puzzle_resuelto', estrellas: 1 });
  });

  it('los secretos se emiten con su id', () => {
    const { sesion, eventos } = sesionConRegistro();
    sesion.encontrarSecreto('fruta-risuena');
    expect(eventos).toEqual([{ tipo: 'secreto_encontrado', secretoId: 'fruta-risuena' }]);
  });
});
