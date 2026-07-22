// Selector de mundos: se desbloquean en orden (DESIGN.md 2). Sin texto:
// ícono grande, candado para lo que falta.

import { ORDEN_MUNDOS, estaDesbloqueado } from '../engine';
import type { Mundo, Progreso } from '../engine';

const ICONOS: Record<Mundo, string> = {
  multiplicacion: '🌻',
  division: '🍎',
  fracciones: '🍕',
  ecuaciones: '⚖️',
};

// Fracciones y ecuaciones todavía no tienen niveles: se muestran como "en
// construcción" aunque estén desbloqueados.
const CONSTRUIDOS: Mundo[] = ['multiplicacion', 'division'];

type Props = {
  progreso: Progreso;
  modoPrueba: boolean;
  alElegir: (mundo: Mundo) => void;
};

export default function SelectorMundos({ progreso, modoPrueba, alElegir }: Props) {
  return (
    <div className="mundos">
      {ORDEN_MUNDOS.map((mundo) => {
        const construido = CONSTRUIDOS.includes(mundo);
        const abierto = construido && (modoPrueba || estaDesbloqueado(mundo, progreso));
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
