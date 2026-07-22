// Pantalla de juego del Mundo 1: plantar fichas para armar la grilla.
// Modo armar: la grilla objetivo está marcada y se llena fila por fila.
// Modo espejo: campo libre y un total objetivo; vale cualquier rectángulo
// completo que lo produzca. La presentación arma el EstadoPuzzle y la sesión
// del engine decide y emite los eventos.

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  crearDetectorInactividad,
  crearSesionNivel,
  useArrastre,
  useSlot,
} from '../../engine';
import type { Estrellas, Nivel, ResultadoSoltar, SesionNivel } from '../../engine';
import { caracteristicasNivel } from '../../data/multiplicacion';

const CAMPO_LIBRE = { filas: 4, columnas: 6 };

type FaseNivel = 'jugando' | 'cosecha' | 'comiendo' | 'final';

type PropsFicha = {
  usada: boolean;
  alSoltar: (slotId: string | null) => ResultadoSoltar;
  alEncajado: () => void;
};

function Ficha({ usada, alSoltar, alEncajado }: PropsFicha) {
  const { fase, props } = useArrastre({ alSoltar, alEncajado, deshabilitada: usada });
  return (
    <div className={`ficha ficha--${fase}${usada ? ' ficha--usada' : ''}`} {...props}>
      🌱
    </div>
  );
}

function Celda({ indice, llena, conPulso }: { indice: number; llena: boolean; conPulso: boolean }) {
  const ref = useSlot(`celda-${indice}`);
  return (
    <div
      ref={ref}
      className={`celda${llena ? ' celda--llena' : ''}${conPulso ? ' celda--pulso' : ''}`}
    >
      {llena && <span className="brote">🌱</span>}
    </div>
  );
}

// Estado de grilla que ve el engine. En modo espejo solo cuenta un rectángulo
// completamente lleno; cualquier otra forma todavía no es una grilla.
function estadoGrilla(celdas: boolean[], columnas: number, esEspejo: boolean) {
  if (!esEspejo) {
    let filasCompletas = 0;
    for (let desde = 0; desde < celdas.length; desde += columnas) {
      if (celdas.slice(desde, desde + columnas).every(Boolean)) filasCompletas++;
    }
    return { tipo: 'grilla' as const, filas: filasCompletas, columnas };
  }
  const posiciones = celdas.flatMap((llena, i) =>
    llena ? [{ fila: Math.floor(i / columnas), columna: i % columnas }] : [],
  );
  if (posiciones.length === 0) return { tipo: 'grilla' as const, filas: 0, columnas: 0 };
  const filasUsadas = posiciones.map((p) => p.fila);
  const columnasUsadas = posiciones.map((p) => p.columna);
  const alto = Math.max(...filasUsadas) - Math.min(...filasUsadas) + 1;
  const ancho = Math.max(...columnasUsadas) - Math.min(...columnasUsadas) + 1;
  const rectanguloCompleto = posiciones.length === alto * ancho;
  return rectanguloCompleto
    ? { tipo: 'grilla' as const, filas: alto, columnas: ancho }
    : { tipo: 'grilla' as const, filas: 0, columnas: 0 };
}

type Props = {
  nivel: Nivel;
  alVolver: () => void;
  alSiguiente: (() => void) | null;
};

export default function PantallaNivel({ nivel, alVolver, alSiguiente }: Props) {
  const objetivo = nivel.tipo === 'grilla' ? nivel.objetivo : null;
  const esEspejo = objetivo?.modo === 'total';
  const filas = objetivo?.modo === 'armar' ? objetivo.filas : CAMPO_LIBRE.filas;
  const columnas = objetivo?.modo === 'armar' ? objetivo.columnas : CAMPO_LIBRE.columnas;
  const totalObjetivo =
    objetivo === null ? 0 : objetivo.modo === 'armar' ? objetivo.filas * objetivo.columnas : objetivo.total;
  const { mostrarTotal, mostrarNotacion } = caracteristicasNivel(nivel.id);

  const [celdas, setCeldas] = useState<boolean[]>(() => Array(filas * columnas).fill(false));
  const [usadas, setUsadas] = useState<boolean[]>(() => Array(totalObjetivo).fill(false));
  const [fase, setFase] = useState<FaseNivel>('jugando');
  const [pulso, setPulso] = useState(false);
  const [estrellas, setEstrellas] = useState<Estrellas | null>(null);

  const espejoEstado = useRef({ celdas, fase });
  espejoEstado.current = { celdas, fase };
  const sesionRef = useRef<SesionNivel | null>(null);
  if (sesionRef.current === null) sesionRef.current = crearSesionNivel(nivel);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const programar = (fn: () => void, ms: number) => {
      temporizadores.current.push(setTimeout(fn, ms));
    };
    const baja = busJuego.escuchar((evento) => {
      if (evento.tipo === 'puzzle_resuelto') {
        setEstrellas(evento.estrellas);
        setPulso(false);
        setFase('cosecha');
        programar(() => setFase((f) => (f === 'cosecha' ? 'comiendo' : f)), 600);
        programar(() => setFase((f) => (f === 'comiendo' ? 'final' : f)), 2400);
      }
      if (evento.tipo === 'intentos_repetidos') setPulso(true);
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

  const soltarFicha = (slotId: string | null): ResultadoSoltar => {
    const sesion = sesionRef.current;
    if (sesion === null || espejoEstado.current.fase !== 'jugando') return 'fuera';
    if (slotId === null) {
      sesion.registrarIntentoFallido('afuera');
      return 'fuera';
    }
    const indice = Number(slotId.replace('celda-', ''));
    if (espejoEstado.current.celdas[indice]) {
      sesion.registrarIntentoFallido(slotId);
      return 'fuera';
    }
    const nuevas = espejoEstado.current.celdas.map((llena, i) => (i === indice ? true : llena));
    espejoEstado.current = { ...espejoEstado.current, celdas: nuevas };
    setCeldas(nuevas);
    setPulso(false);
    sesion.actualizarEstado(estadoGrilla(nuevas, columnas, esEspejo));
    return 'ok';
  };

  const encajarFicha = (indiceFicha: number) => {
    setUsadas((anteriores) => anteriores.map((usada, i) => (i === indiceFicha ? true : usada)));
  };

  // La celebración es salteable con un toque (GAMEFEEL.md 3).
  const saltear = () => {
    if (fase === 'cosecha' || fase === 'comiendo') setFase('final');
  };

  if (objetivo === null) return null;

  const plantadas = celdas.filter(Boolean).length;
  const primeraLibre = celdas.findIndex((llena) => !llena);
  const tamCelda = Math.min(64, Math.floor(440 / columnas));

  return (
    <div className="nivel" onPointerDown={saltear}>
      <header className="nivel__cabecera">
        <button type="button" className="boton-redondo" onClick={alVolver}>
          🗺️
        </button>
        <div className="nivel__consigna">
          {mostrarNotacion && !esEspejo && (
            <span className="nivel__notacion">
              {filas} × {columnas}
            </span>
          )}
          {esEspejo && <span className="nivel__objetivo">🌱 {totalObjetivo}</span>}
          {mostrarTotal && !esEspejo && <span className="nivel__contador">{plantadas}</span>}
        </div>
        <span />
      </header>

      <div
        className={`tablero${fase !== 'jugando' ? ' tablero--resuelto' : ''}${esEspejo ? ' tablero--campo' : ''}`}
        style={{ gridTemplateColumns: `repeat(${columnas}, ${tamCelda}px)`, ['--celda' as string]: `${tamCelda}px` }}
      >
        {celdas.map((llena, i) => (
          <Celda
            key={i}
            indice={i}
            llena={llena}
            conPulso={pulso && !esEspejo && i === primeraLibre}
          />
        ))}
      </div>

      {fase === 'jugando' && (
        <div className="bandeja">
          {usadas.map((usada, i) => (
            <Ficha key={i} usada={usada} alSoltar={soltarFicha} alEncajado={() => encajarFicha(i)} />
          ))}
        </div>
      )}

      {(fase === 'cosecha' || fase === 'comiendo') && (
        <div className="cosecha" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="cosecha__brote" style={{ animationDelay: `${i * 0.09}s` }}>
              🌱
            </span>
          ))}
        </div>
      )}

      {fase === 'final' && (
        <div className="nivel__final">
          <div className="nivel__final-estrellas">{'⭐'.repeat(estrellas ?? 1)}</div>
          {mostrarTotal && !esEspejo && <div className="nivel__final-total">{totalObjetivo}</div>}
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
