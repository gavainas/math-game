import { describe, expect, it } from 'vitest';
import {
  CLAVE_PROGRESO,
  cargarProgreso,
  guardarProgreso,
  progresoInicial,
} from './progreso';

function almacenFalso(): Storage {
  const datos = new Map<string, string>();
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor);
    },
    removeItem: (clave: string) => {
      datos.delete(clave);
    },
    clear: () => datos.clear(),
    key: (indice: number) => [...datos.keys()][indice] ?? null,
    get length() {
      return datos.size;
    },
  };
}

describe('progreso en LocalStorage', () => {
  it('sin datos guardados devuelve el estado inicial', () => {
    const progreso = cargarProgreso(almacenFalso());
    expect(progreso).toEqual(progresoInicial());
  });

  it('guarda y recarga el mismo progreso (una sola key)', () => {
    const almacen = almacenFalso();
    const progreso = {
      ...progresoInicial(),
      nivelesCompletados: { 'm1-n01': { estrellas: 3 as const } },
      etapaMascota: 1 as const,
    };

    guardarProgreso(progreso, almacen);

    expect(almacen.length).toBe(1);
    expect(cargarProgreso(almacen)).toEqual(progreso);
  });

  it('con JSON roto vuelve al estado inicial sin tirar error', () => {
    const almacen = almacenFalso();
    almacen.setItem(CLAVE_PROGRESO, '{esto no es json');
    expect(cargarProgreso(almacen)).toEqual(progresoInicial());
  });

  it('con un schema desconocido vuelve al estado inicial', () => {
    const almacen = almacenFalso();
    almacen.setItem(CLAVE_PROGRESO, JSON.stringify({ version: 99, cosas: [] }));
    expect(cargarProgreso(almacen)).toEqual(progresoInicial());
  });
});
