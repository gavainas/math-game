import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearDetectorInactividad } from './inactividad';
import type { EventoJuego } from './eventos';

describe('detector de inactividad', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('emite a los 30 y a los 60 segundos sin input', () => {
    const eventos: EventoJuego[] = [];
    const detector = crearDetectorInactividad((e) => eventos.push(e));

    vi.advanceTimersByTime(30_000);
    expect(eventos).toEqual([{ tipo: 'inactividad', segundos: 30 }]);

    vi.advanceTimersByTime(30_000);
    expect(eventos).toEqual([
      { tipo: 'inactividad', segundos: 30 },
      { tipo: 'inactividad', segundos: 60 },
    ]);

    detector.detener();
  });

  it('la actividad reinicia el conteo', () => {
    const eventos: EventoJuego[] = [];
    const detector = crearDetectorInactividad((e) => eventos.push(e));

    vi.advanceTimersByTime(29_000);
    detector.actividad();
    vi.advanceTimersByTime(29_000);
    expect(eventos).toEqual([]);

    vi.advanceTimersByTime(1_000);
    expect(eventos).toEqual([{ tipo: 'inactividad', segundos: 30 }]);

    detector.detener();
  });

  it('detener apaga los avisos pendientes', () => {
    const eventos: EventoJuego[] = [];
    const detector = crearDetectorInactividad((e) => eventos.push(e));

    detector.detener();
    vi.advanceTimersByTime(120_000);
    expect(eventos).toEqual([]);
  });
});
