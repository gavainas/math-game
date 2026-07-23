// Benja y su mascota acompañan abajo a la derecha. Benja reacciona a los
// eventos del bus (GAMEFEEL.md 7 y 11.2); la mascota come la cosecha y
// EVOLUCIONA por sorpresa según los niveles completados (GAMEFEEL.md 2 y 5):
// huevo → bebé → pichón → dragoncito → dragón.

import { useEffect, useRef, useState } from 'react';
import { busJuego } from '../engine';
import type { EtapaMascota } from '../engine';
import Benja from './Benja';
import type { ExpresionBenja } from './Benja';

type EstadoMascota = 'idle' | 'festejo' | 'comiendo';

const EXPRESION: Record<EstadoMascota, ExpresionBenja> = {
  idle: 'piola',
  festejo: 'feliz',
  comiendo: 'sorpresa',
};

const CRIA: Record<EtapaMascota, { forma: string; tam: number }> = {
  0: { forma: '🥚', tam: 30 },
  1: { forma: '🐣', tam: 40 },
  2: { forma: '🐥', tam: 48 },
  3: { forma: '🐲', tam: 58 },
  4: { forma: '🐉', tam: 72 },
};

export default function Mascota({ etapa }: { etapa: EtapaMascota }) {
  const [estado, setEstado] = useState<EstadoMascota>('idle');
  const [evolucionando, setEvolucionando] = useState(false);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  const etapaAnterior = useRef(etapa);

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
        // La cosecha tarda un momento en llegarle a la cría.
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

  // La evolución es sorpresa: cuando la etapa persistida sube, brillo y salto.
  useEffect(() => {
    if (etapa > etapaAnterior.current) {
      const espera = setTimeout(() => setEvolucionando(true), 2000); // tras comer
      const fin = setTimeout(() => setEvolucionando(false), 4200);
      temporizadores.current.push(espera, fin);
    }
    etapaAnterior.current = etapa;
  }, [etapa]);

  const cria = CRIA[etapa];

  return (
    <div className={`mascota mascota--${estado}`} aria-hidden="true">
      <div className={`cria${evolucionando ? ' cria--evolucion' : ''}`}>
        <span className="cria__forma" style={{ fontSize: cria.tam }}>
          {cria.forma}
        </span>
        {evolucionando && (
          <>
            <span className="cria__brillo" />
            <span className="cria__chispas">✨✨✨</span>
          </>
        )}
      </div>
      <div className="mascota__cuerpo">
        <Benja expresion={evolucionando ? 'sorpresa' : EXPRESION[estado]} ancho={92} />
      </div>
    </div>
  );
}
