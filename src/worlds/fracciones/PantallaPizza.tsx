// Pantalla del Mundo 3 (Fracciones). Tres modos:
// - cortar: copiar el modelo chiquito cortando la pizza con 🔪 (+/- cortes).
// - sombrear: cortar igual que el modelo (o que la fracción escrita) y tocar
//   porciones para servirlas.
// - deCantidad: ¿cuánto es n/d de C manzanas? Se lleva el número a la caja.
// La presentación arma el EstadoPuzzle {partes, sombreadas}; la sesión evalúa.

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  crearDetectorInactividad,
  crearSesionNivel,
  useArrastre,
  useSlot,
} from '../../engine';
import type { Estrellas, Nivel, ResultadoSoltar, SesionNivel } from '../../engine';
import Benja from '../../components/Benja';
import Celebracion from '../../components/Celebracion';
import { caracteristicasFracciones, opcionesFraccion } from '../../data/fracciones';

type FaseNivel = 'jugando' | 'cosecha' | 'comiendo' | 'final';

const MAX_PARTES = 12;

// Pizza en SVG: `partes` porciones desde el centro; las servidas se pintan.
function Pizza({
  partes,
  servidas,
  tam,
  alTocarPorcion,
}: {
  partes: number;
  servidas: Set<number>;
  tam: number;
  alTocarPorcion: ((indice: number) => void) | null;
}) {
  const R = 90;
  const centro = 100;
  const punto = (angulo: number): [number, number] => [
    centro + R * Math.sin(angulo),
    centro - R * Math.cos(angulo),
  ];
  return (
    <svg viewBox="0 0 200 200" width={tam} height={tam} className="pizza">
      {partes === 1 ? (
        <circle
          cx={centro}
          cy={centro}
          r={R}
          className={`pizza__porcion${servidas.has(0) ? ' pizza__porcion--servida' : ''}`}
          onPointerDown={alTocarPorcion ? () => alTocarPorcion(0) : undefined}
        />
      ) : (
        Array.from({ length: partes }, (_, i) => {
          const a0 = (i * 2 * Math.PI) / partes;
          const a1 = ((i + 1) * 2 * Math.PI) / partes;
          const [x0, y0] = punto(a0);
          const [x1, y1] = punto(a1);
          const arcoGrande = a1 - a0 > Math.PI ? 1 : 0;
          return (
            <path
              key={`${partes}-${i}`}
              d={`M ${centro} ${centro} L ${x0} ${y0} A ${R} ${R} 0 ${arcoGrande} 1 ${x1} ${y1} Z`}
              className={`pizza__porcion${servidas.has(i) ? ' pizza__porcion--servida' : ''}`}
              onPointerDown={alTocarPorcion ? () => alTocarPorcion(i) : undefined}
            />
          );
        })
      )}
    </svg>
  );
}

type PropsChip = {
  valor: number;
  colocado: boolean;
  alSoltar: (valor: number, slotId: string | null) => ResultadoSoltar;
  alEncajado: (valor: number) => void;
};

function ChipNumero({ valor, colocado, alSoltar, alEncajado }: PropsChip) {
  const { fase, props } = useArrastre({
    alSoltar: (slotId) => alSoltar(valor, slotId),
    alEncajado: () => alEncajado(valor),
    deshabilitada: colocado,
  });
  return (
    <div className={`chip chip--${fase}${colocado ? ' chip--colocado' : ''}`} {...props}>
      {valor}
    </div>
  );
}

type Props = {
  nivel: Nivel;
  alVolver: () => void;
  alSiguiente: (() => void) | null;
  alAyuda: () => void;
};

export default function PantallaPizza({ nivel, alVolver, alSiguiente, alAyuda }: Props) {
  const objetivo = nivel.tipo === 'corte' ? nivel.objetivo : null;
  const { mostrarNotacion } = caracteristicasFracciones(nivel.id);
  const modo = objetivo?.modo ?? 'cortar';

  const [partes, setPartes] = useState(1);
  const [servidas, setServidas] = useState<Set<number>>(new Set());
  const [respuesta, setRespuesta] = useState<number | null>(null);
  const [fase, setFase] = useState<FaseNivel>('jugando');
  const [estrellas, setEstrellas] = useState<Estrellas | null>(null);

  const espejoEstado = useRef({ partes, servidas, fase });
  espejoEstado.current = { partes, servidas, fase };
  const sesionRef = useRef<SesionNivel | null>(null);
  if (sesionRef.current === null) sesionRef.current = crearSesionNivel(nivel);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  const refSlotRespuesta = useSlot('respuesta');

  useEffect(() => {
    const programar = (fn: () => void, ms: number) => {
      temporizadores.current.push(setTimeout(fn, ms));
    };
    const baja = busJuego.escuchar((evento) => {
      if (evento.tipo === 'puzzle_resuelto') {
        setEstrellas(evento.estrellas);
        setFase('cosecha');
        programar(() => setFase((f) => (f === 'cosecha' ? 'comiendo' : f)), 600);
        programar(() => setFase((f) => (f === 'comiendo' ? 'final' : f)), 2400);
      }
    });
    const detector = crearDetectorInactividad();
    const alInput = () => detector.actividad();
    window.addEventListener('pointerdown', alInput);
    const pendientes = temporizadores.current;
    return () => {
      baja();
      window.removeEventListener('pointerdown', alInput);
      detector.detener();
      pendientes.forEach(clearTimeout);
    };
  }, []);

  const avisarEstado = (nuevasPartes: number, nuevasServidas: Set<number>) => {
    espejoEstado.current = {
      ...espejoEstado.current,
      partes: nuevasPartes,
      servidas: nuevasServidas,
    };
    setPartes(nuevasPartes);
    setServidas(nuevasServidas);
    sesionRef.current?.actualizarEstado({
      tipo: 'corte',
      partes: nuevasPartes,
      sombreadas: nuevasServidas.size,
    });
  };

  // Cortar de nuevo desarma lo servido: la pizza vuelve entera al plato.
  const cambiarCortes = (delta: number) => {
    const { partes: p, fase: f } = espejoEstado.current;
    if (f !== 'jugando') return;
    const nuevas = Math.min(MAX_PARTES, Math.max(1, p + delta));
    if (nuevas === p) return;
    busJuego.emitir({ tipo: delta > 0 ? 'pieza_soltada_ok' : 'pieza_agarrada' });
    avisarEstado(nuevas, new Set());
  };

  const tocarPorcion = (indice: number) => {
    const { partes: p, servidas: s, fase: f } = espejoEstado.current;
    if (f !== 'jugando' || modo === 'cortar' || modo === 'deCantidad') return;
    const nuevas = new Set(s);
    if (nuevas.has(indice)) nuevas.delete(indice);
    else nuevas.add(indice);
    busJuego.emitir({ tipo: nuevas.has(indice) ? 'pieza_soltada_ok' : 'pieza_agarrada' });
    avisarEstado(p, nuevas);
  };

  const soltarChip = (valor: number, slotId: string | null): ResultadoSoltar => {
    const sesion = sesionRef.current;
    if (sesion === null || espejoEstado.current.fase !== 'jugando' || objetivo?.modo !== 'deCantidad')
      return 'fuera';
    if (slotId !== 'respuesta') {
      sesion.registrarIntentoFallido('afuera');
      return 'fuera';
    }
    const correcto = (objetivo.cantidad * objetivo.numerador) / objetivo.denominador;
    if (valor !== correcto) {
      sesion.registrarIntentoFallido(`chip-${valor}`);
      return 'fuera';
    }
    return 'ok';
  };

  const encajarChip = (valor: number) => {
    setRespuesta(valor);
    sesionRef.current?.actualizarEstado({ tipo: 'corte', partes: 1, sombreadas: valor });
  };

  const saltear = () => {
    if (fase === 'cosecha' || fase === 'comiendo') setFase('final');
  };

  if (objetivo === null) return null;

  const modeloPartes = objetivo.modo === 'deCantidad' ? objetivo.denominador : objetivo.partes;
  const modeloServidas =
    objetivo.modo === 'sombrear'
      ? new Set(Array.from({ length: objetivo.sombreadas }, (_, i) => i))
      : objetivo.modo === 'deCantidad'
        ? new Set(Array.from({ length: objetivo.numerador }, (_, i) => i))
        : new Set<number>();

  return (
    <div className="nivel" onPointerDown={saltear}>
      <header className="nivel__cabecera">
        <button type="button" className="boton-redondo" onClick={alVolver}>
          🗺️
        </button>
        <div className="nivel__consigna">
          {objetivo.modo !== 'deCantidad' &&
            (mostrarNotacion && objetivo.modo === 'sombrear' ? (
              <span className="fraccion">
                <span>{objetivo.sombreadas}</span>
                <span className="fraccion__raya" />
                <span>{objetivo.partes}</span>
              </span>
            ) : (
              // El modelo chiquito: copiarlo es la consigna
              <span className="modelo-pizza">
                <Pizza partes={modeloPartes} servidas={modeloServidas} tam={72} alTocarPorcion={null} />
              </span>
            ))}
          {objetivo.modo === 'deCantidad' && (
            <span className="nivel__notacion nivel__notacion--fraccion">
              <span className="fraccion">
                <span>{objetivo.numerador}</span>
                <span className="fraccion__raya" />
                <span>{objetivo.denominador}</span>
              </span>
              {' de '}
              {objetivo.cantidad}
              {' = '}
              <span
                ref={refSlotRespuesta}
                className={`slot-respuesta${respuesta !== null ? ' slot-respuesta--llena' : ''}`}
              >
                {respuesta ?? '?'}
              </span>
            </span>
          )}
        </div>
        <button
          type="button"
          className="boton-redondo boton-ayuda"
          onPointerDown={(evento) => evento.stopPropagation()}
          onClick={alAyuda}
        >
          <Benja expresion="piola" ancho={44} />
        </button>
      </header>

      {objetivo.modo !== 'deCantidad' ? (
        <>
          <div className={`plato${fase !== 'jugando' ? ' plato--resuelto' : ''}`}>
            <Pizza
              partes={partes}
              servidas={servidas}
              tam={240}
              alTocarPorcion={modo === 'sombrear' ? tocarPorcion : null}
            />
          </div>
          <div className="cortes">
            <button
              type="button"
              className="boton-redondo"
              disabled={partes <= 1}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => cambiarCortes(-1)}
            >
              ↩️
            </button>
            <button
              type="button"
              className="boton-redondo boton-redondo--principal cortes__cortar"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => cambiarCortes(1)}
            >
              🔪
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="manzanas">
            {Array.from({ length: objetivo.cantidad }, (_, i) => (
              <span key={i} className="manzanas__fruta">
                🍎
              </span>
            ))}
          </div>
          {fase === 'jugando' && (
            <div className="bandeja">
              {opcionesFraccion(objetivo.numerador, objetivo.denominador, objetivo.cantidad).map(
                (valor) => (
                  <ChipNumero
                    key={valor}
                    valor={valor}
                    colocado={respuesta === valor}
                    alSoltar={soltarChip}
                    alEncajado={encajarChip}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}

      {(fase === 'cosecha' || fase === 'comiendo') && <Celebracion emoji="🍕" />}

      {fase === 'final' && (
        <div className="nivel__final">
          <Benja expresion="feliz" ancho={96} />
          <div className="nivel__final-estrellas">{'⭐'.repeat(estrellas ?? 1)}</div>
          <div className="nivel__final-botones">
            <button type="button" className="boton-redondo" onClick={alVolver}>
              🗺️
            </button>
            {alSiguiente && (
              <button
                type="button"
                className="boton-redondo boton-redondo--principal"
                onClick={alSiguiente}
              >
                ➜
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
