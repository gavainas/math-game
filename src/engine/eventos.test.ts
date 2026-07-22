import { describe, expect, it, vi } from 'vitest';
import { crearBusEventos } from './eventos';
import type { EventoJuego } from './eventos';

describe('bus de eventos', () => {
  it('entrega los eventos a todos los oyentes', () => {
    const bus = crearBusEventos();
    const recibidos: EventoJuego[] = [];
    bus.escuchar((e) => recibidos.push(e));
    bus.escuchar((e) => recibidos.push(e));

    bus.emitir({ tipo: 'pieza_agarrada' });

    expect(recibidos).toEqual([{ tipo: 'pieza_agarrada' }, { tipo: 'pieza_agarrada' }]);
  });

  it('deja de entregar después de la baja', () => {
    const bus = crearBusEventos();
    const oyente = vi.fn();
    const baja = bus.escuchar(oyente);
    baja();

    bus.emitir({ tipo: 'progreso_parcial' });

    expect(oyente).not.toHaveBeenCalled();
  });

  it('un oyente que tira error no frena a los demás', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bus = crearBusEventos();
    const sano = vi.fn();
    bus.escuchar(() => {
      throw new Error('animación rota');
    });
    bus.escuchar(sano);

    bus.emitir({ tipo: 'puzzle_resuelto', estrellas: 3 });

    expect(sano).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});
