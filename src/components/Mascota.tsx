// La mascota escucha el bus y resuelve su propia máquina de estados
// (GAMEFEEL.md 7 y 11.2): nadie le habla directo. Versión mínima del paso 2
// con 3 estados: idle, festejo y comiendo. Nunca muestra frustración.

import { useEffect, useRef, useState } from 'react';
import { busJuego } from '../engine';

type EstadoMascota = 'idle' | 'festejo' | 'comiendo';

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
        // La cosecha tarda un momento en volar hasta la boca.
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
        <div className="mascota__ojo mascota__ojo--izq" />
        <div className="mascota__ojo mascota__ojo--der" />
        <div className="mascota__boca" />
      </div>
    </div>
  );
}
