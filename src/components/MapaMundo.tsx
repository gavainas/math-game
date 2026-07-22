// Mapa camino del mundo (DESIGN.md 8): nodos en zigzag, sin texto. Flor con
// estrellas = completado, brote pulsando = el que sigue, punto = bloqueado.

import { puedeJugar, siguienteNivel } from '../engine';
import type { Nivel, Progreso } from '../engine';

type Props = {
  niveles: Nivel[];
  progreso: Progreso;
  alElegir: (nivel: Nivel) => void;
  // Modo prueba (?probar en la URL): desbloquea todo para revisar niveles.
  modoPrueba?: boolean;
};

export default function MapaMundo({ niveles, progreso, alElegir, modoPrueba = false }: Props) {
  const proximo = siguienteNivel(niveles, progreso);

  return (
    <div className="mapa">
      <div className="mapa__mundo">🌻</div>
      <div className="mapa__camino">
        {niveles.map((nivel, i) => {
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
              <span className="nodo__icono">{completado ? '🌼' : esProximo ? '🌱' : '•'}</span>
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
