// Selector de mundos: se desbloquean en orden (DESIGN.md 2). Sin texto:
// ícono grande, candado para lo que falta, obrador para lo no construido.
// Mientras un mundo intermedio no esté construido (hoy: fracciones), el
// desbloqueo salta al siguiente construido.

import { ORDEN_MUNDOS, mundoCompleto } from '../engine';
import type { Mundo, Nivel, Progreso } from '../engine';
import Benja from './Benja';

const ICONOS: Record<Mundo, string> = {
  multiplicacion: '🌻',
  division: '🍎',
  fracciones: '🍕',
  ecuaciones: '📦',
};

const CONSTRUIDOS: Mundo[] = ['multiplicacion', 'division', 'ecuaciones'];

type Props = {
  niveles: Nivel[];
  progreso: Progreso;
  modoPrueba: boolean;
  alElegir: (mundo: Mundo) => void;
};

export default function SelectorMundos({ niveles, progreso, modoPrueba, alElegir }: Props) {
  const estaAbierto = (mundo: Mundo): boolean => {
    if (!CONSTRUIDOS.includes(mundo)) return false;
    if (modoPrueba) return true;
    const previos = CONSTRUIDOS.slice(0, CONSTRUIDOS.indexOf(mundo));
    return previos.every((previo) => mundoCompleto(niveles, previo, progreso));
  };

  return (
    <div className="mundos">
      <div className="mundos__benja">
        <Benja expresion="feliz" ancho={110} />
      </div>
      {ORDEN_MUNDOS.map((mundo) => {
        const construido = CONSTRUIDOS.includes(mundo);
        const abierto = estaAbierto(mundo);
        return (
          <button
            key={mundo}
            type="button"
            className={`mundo${abierto ? '' : ' mundo--cerrado'}`}
            disabled={!abierto}
            onClick={() => alElegir(mundo)}
          >
            <span className="mundo__icono">{ICONOS[mundo]}</span>
            {!abierto && <span className="mundo__candado">{construido ? '🔒' : '🚧'}</span>}
          </button>
        );
      })}
    </div>
  );
}
