// Persistencia en LocalStorage: una sola key serializada (GAMEFEEL.md 11.3).

import { ORDEN_MUNDOS } from './tipos';
import type { Progreso } from './tipos';

export const CLAVE_PROGRESO = 'mate-game/progreso';
export const VERSION_PROGRESO = 1;

export function progresoInicial(): Progreso {
  return {
    version: VERSION_PROGRESO,
    mundoDesbloqueado: 'multiplicacion',
    nivelesCompletados: {},
    stickers: [],
    secretosEncontrados: [],
    etapaMascota: 0,
    sonidoActivado: true,
  };
}

export function cargarProgreso(almacen: Storage = localStorage): Progreso {
  try {
    const crudo = almacen.getItem(CLAVE_PROGRESO);
    if (crudo === null) return progresoInicial();
    return migrar(JSON.parse(crudo));
  } catch {
    // Datos rotos: mejor arrancar de cero que romper el juego.
    return progresoInicial();
  }
}

export function guardarProgreso(progreso: Progreso, almacen: Storage = localStorage): void {
  almacen.setItem(CLAVE_PROGRESO, JSON.stringify(progreso));
}

// Punto único de entrada para versiones viejas del schema. Hoy solo existe la
// v1: cualquier cosa que no valide vuelve al estado inicial.
function migrar(crudo: unknown): Progreso {
  return esProgresoV1(crudo) ? crudo : progresoInicial();
}

function esProgresoV1(valor: unknown): valor is Progreso {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    v.version === VERSION_PROGRESO &&
    typeof v.mundoDesbloqueado === 'string' &&
    (ORDEN_MUNDOS as readonly string[]).includes(v.mundoDesbloqueado) &&
    esRegistroDeNiveles(v.nivelesCompletados) &&
    esListaDeTextos(v.stickers) &&
    esListaDeTextos(v.secretosEncontrados) &&
    typeof v.etapaMascota === 'number' &&
    [0, 1, 2, 3, 4].includes(v.etapaMascota) &&
    typeof v.sonidoActivado === 'boolean'
  );
}

function esRegistroDeNiveles(valor: unknown): boolean {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return false;
  return Object.values(valor).every(
    (entrada) =>
      typeof entrada === 'object' &&
      entrada !== null &&
      [1, 2, 3].includes((entrada as { estrellas?: unknown }).estrellas as number),
  );
}

function esListaDeTextos(valor: unknown): boolean {
  return Array.isArray(valor) && valor.every((item) => typeof item === 'string');
}
