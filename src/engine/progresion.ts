// Progresión: desbloqueo lineal entre mundos, replay dentro del mundo,
// repetición espaciada silenciosa y etapa de la mascota (DESIGN.md 7, GAMEFEEL.md 5).

import { ORDEN_MUNDOS } from './tipos';
import type { Estrellas, EtapaMascota, Mundo, Nivel, Progreso } from './tipos';

function indiceMundo(mundo: Mundo): number {
  return ORDEN_MUNDOS.indexOf(mundo);
}

export function estaDesbloqueado(mundo: Mundo, progreso: Progreso): boolean {
  return indiceMundo(mundo) <= indiceMundo(progreso.mundoDesbloqueado);
}

export function nivelesDeMundo(niveles: Nivel[], mundo: Mundo): Nivel[] {
  return niveles.filter((nivel) => nivel.mundo === mundo);
}

// Un mundo está completo cuando todos sus niveles jugables están resueltos.
// El sandbox es modo libre: nunca bloquea nada (GAMEFEEL.md 10).
export function mundoCompleto(niveles: Nivel[], mundo: Mundo, progreso: Progreso): boolean {
  const jugables = nivelesDeMundo(niveles, mundo).filter((n) => n.tipo !== 'sandbox');
  return jugables.length > 0 && jugables.every((n) => progreso.nivelesCompletados[n.id]);
}

// Primer nivel pendiente recorriendo los mundos en orden.
export function siguienteNivel(niveles: Nivel[], progreso: Progreso): Nivel | null {
  for (const mundo of ORDEN_MUNDOS) {
    if (!estaDesbloqueado(mundo, progreso)) break;
    const pendiente = nivelesDeMundo(niveles, mundo)
      .filter((n) => n.tipo !== 'sandbox')
      .find((n) => !progreso.nivelesCompletados[n.id]);
    if (pendiente) return pendiente;
  }
  return null;
}

// Dentro de un mundo desbloqueado se puede rejugar cualquier nivel ya pasado;
// de los pendientes, solo el que sigue. El sandbox se abre con el mundo completo.
export function puedeJugar(nivel: Nivel, niveles: Nivel[], progreso: Progreso): boolean {
  if (!estaDesbloqueado(nivel.mundo, progreso)) return false;
  if (nivel.tipo === 'sandbox') return mundoCompleto(niveles, nivel.mundo, progreso);
  if (progreso.nivelesCompletados[nivel.id]) return true;
  return siguienteNivel(niveles, progreso)?.id === nivel.id;
}

// La mascota evoluciona por niveles completados (GAMEFEEL.md 2), nunca por
// estrellas, y la evolución es sorpresa: no se anuncia.
export const UMBRALES_ETAPA = [6, 18, 34, 55] as const;

export function calcularEtapaMascota(progreso: Progreso): EtapaMascota {
  const completados = Object.keys(progreso.nivelesCompletados).length;
  return UMBRALES_ETAPA.filter((umbral) => completados >= umbral).length as EtapaMascota;
}

function calcularDesbloqueo(niveles: Nivel[], progreso: Progreso): Mundo {
  let desbloqueado: Mundo = ORDEN_MUNDOS[0];
  for (let i = 0; i < ORDEN_MUNDOS.length - 1; i++) {
    if (!mundoCompleto(niveles, ORDEN_MUNDOS[i], progreso)) break;
    desbloqueado = ORDEN_MUNDOS[i + 1];
  }
  return desbloqueado;
}

// Registra un nivel resuelto: conserva las mejores estrellas, recalcula
// desbloqueo y etapa de mascota. Devuelve un Progreso nuevo (no muta).
export function completarNivel(
  niveles: Nivel[],
  progreso: Progreso,
  nivelId: string,
  estrellas: Estrellas,
): Progreso {
  const previas = progreso.nivelesCompletados[nivelId]?.estrellas ?? 0;
  const mejores = Math.max(previas, estrellas) as Estrellas;
  const parcial: Progreso = {
    ...progreso,
    nivelesCompletados: { ...progreso.nivelesCompletados, [nivelId]: { estrellas: mejores } },
  };
  const desbloqueo = calcularDesbloqueo(niveles, parcial);
  return {
    ...parcial,
    // El desbloqueo nunca retrocede aunque cambie la lista de niveles.
    mundoDesbloqueado:
      indiceMundo(desbloqueo) > indiceMundo(progreso.mundoDesbloqueado)
        ? desbloqueo
        : progreso.mundoDesbloqueado,
    etapaMascota: Math.max(progreso.etapaMascota, calcularEtapaMascota(parcial)) as EtapaMascota,
  };
}

// Repetición espaciada silenciosa (DESIGN.md 7): cada `cada` niveles nuevos se
// intercala uno ya jugado, marcado esRepaso, sin avisar. Determinístico: los
// candidatos viejos rotan en round-robin.
export function intercalarRepaso(niveles: Nivel[], cada = 4): Nivel[] {
  const secuencia: Nivel[] = [];
  let desdeUltimoRepaso = 0;
  let cursor = 0;
  let numeroRepaso = 0;
  for (const nivel of niveles) {
    secuencia.push(nivel);
    desdeUltimoRepaso++;
    const candidatos = secuencia.filter((n) => !n.esRepaso).slice(0, -1);
    if (desdeUltimoRepaso >= cada && candidatos.length > 0) {
      const elegido = candidatos[cursor % candidatos.length];
      cursor++;
      numeroRepaso++;
      secuencia.push({ ...elegido, esRepaso: true, id: `${elegido.id}--repaso${numeroRepaso}` });
      desdeUltimoRepaso = 0;
    }
  }
  return secuencia;
}
