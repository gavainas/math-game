// Mapa camino del mundo (DESIGN.md 8): nodos en zigzag, sin texto. Flor con
// estrellas = completado, brote pulsando = el que sigue, punto = bloqueado.

import { nivelesDeMundo, puedeJugar, siguienteNivel } from '../engine';
import type { Mundo, Nivel, Progreso } from '../engine';

const ICONOS: Record<Mundo, { mundo: string; completado: string; proximo: string }> = {
  multiplicacion: { mundo: '🌻', completado: '🌼', proximo: '🌱' },
  division: { mundo: '🍎', completado: '🧺', proximo: '🍎' },
  fracciones: { mundo: '🍕', completado: '🍕', proximo: '🔪' },
  ecuaciones: { mundo: '⚖️', completado: '💎', proximo: '📦' },
};

type Props = {
  niveles: Nivel[]; // todos los niveles del juego (la progresión cruza mundos)
  mundo: Mundo;
  progreso: Progreso;
  alElegir: (nivel: Nivel) => void;
  alVolver: () => void;
  // Modo prueba (?probar en la URL): desbloquea todo para revisar niveles.
  modoPrueba?: boolean;
};

export default function MapaMundo({
  niveles,
  mundo,
  progreso,
  alElegir,
  alVolver,
  modoPrueba = false,
}: Props) {
  const proximo = siguienteNivel(niveles, progreso);
  const iconos = ICONOS[mundo];

  return (
    <div className="mapa">
      <button type="button" className="boton-redondo mapa__volver" onClick={alVolver}>
        🏠
      </button>
      <div className="mapa__mundo">{iconos.mundo}</div>
      <div className="mapa__camino">
        {nivelesDeMundo(niveles, mundo).map((nivel, i) => {
          const completado = progreso.nivelesCompletados[nivel.id];
          const esProximo = proximo?.id === nivel.id;
          const jugable = modoPrueba || puedeJugar(nivel, niveles, progreso);
          const clase = completado
            ? 'nodo nodo--completado'
            : esProximo
              ? 'nodo nodo--proximo'
              : jugable
                ? 'nodo'
                : 'nodo nodo--bloqueado';
          return (
            <button
              key={nivel.id}
              type="button"
              className={clase}
              disabled={!jugable}
              onClick={() => alElegir(nivel)}
              style={{ marginLeft: `${Math.round(Math.sin(i * 1.05) * 72)}px` }}
            >
              <span className="nodo__icono">
                {completado ? iconos.completado : esProximo ? iconos.proximo : '•'}
              </span>
              {completado && (
                <span className="nodo__estrellas">{'⭐'.repeat(completado.estrellas)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
