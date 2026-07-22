// Benja acompaña abajo a la derecha y reacciona a los eventos del bus
// (GAMEFEEL.md 7 y 11.2): nadie le habla directo. Tres estados: piola (idle),
// festejo (progreso parcial) y sorpresa/festejo grande al resolver.
// Nunca muestra frustración.

import { useEffect, useRef, useState } from 'react';
import { busJuego } from '../engine';
import Benja from './Benja';
import type { ExpresionBenja } from './Benja';

type EstadoMascota = 'idle' | 'festejo' | 'comiendo';

const EXPRESION: Record<EstadoMascota, ExpresionBenja> = {
  idle: 'piola',
  festejo: 'feliz',
  comiendo: 'sorpresa',
};

export default function Mascota() {
  const [estado, setEstado] = useState<EstadoMascota>('idle');
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const programar = (fn: () => void, ms: number) => {
      temporizadores.current.push(setTimeout(fn, ms));
    };
    const baja = busJuego.escuchar((evento) => {
      if (evento.tipo === 'progreso_parcial') {
        setEstado((actual) => (actual === 'comiendo' ? actual : 'festejo'));
        programar(() => setEstado((actual) => (actual === 'festejo' ? 'idle' : actual)), 700);
      }
      if (evento.tipo === 'puzzle_resuelto') {
        // La cosecha tarda un momento en llegarle.
        programar(() => setEstado('comiendo'), 500);
        programar(() => setEstado('idle'), 2400);
      }
    });
    const pendientes = temporizadores.current;
    return () => {
      baja();
      pendientes.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={`mascota mascota--${estado}`} aria-hidden="true">
      <div className="mascota__cuerpo">
        <Benja expresion={EXPRESION[estado]} ancho={92} />
      </div>
    </div>
  );
}
