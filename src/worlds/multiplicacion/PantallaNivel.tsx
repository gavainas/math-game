// Pantalla de juego del Mundo 1. Tres modos según el nivel:
// - slots: grilla objetivo marcada y fichas para arrastrar (solo los primeros
//   niveles, enseñan la interfaz).
// - campo: campo abierto donde se planta y desplanta tocando; la consigna
//   ("F grupos de C", "F × C" o un total a factorear) exige decidir la forma.
// - predecir: la grilla ya está plantada y hay que arrastrar el producto
//   correcto entre distractores hasta el casillero de respuesta.
// La presentación arma el EstadoPuzzle; la sesión del engine evalúa y emite.

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  crearDetectorInactividad,
  crearSesionNivel,
  useArrastre,
  useSlot,
} from '../../engine';
import type { Estrellas, Nivel, ResultadoSoltar, SesionNivel } from '../../engine';
import { caracteristicasNivel, opcionesPrediccion } from '../../data/multiplicacion';

const CAMPO_LIBRE = { filas: 8, columnas: 10 };

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

function Celda({
  indice,
  llena,
  conPulso,
  alTocar,
}: {
  indice: number;
  llena: boolean;
  conPulso: boolean;
  alTocar: ((indice: number) => void) | null;
}) {
  const ref = useSlot(`celda-${indice}`);
  return (
    <div
      ref={ref}
      className={`celda${llena ? ' celda--llena' : ''}${conPulso ? ' celda--pulso' : ''}${alTocar ? ' celda--tocable' : ''}`}
      onPointerDown={alTocar ? () => alTocar(indice) : undefined}
    >
      {llena && <span className="brote">🌱</span>}
    </div>
  );
}

// Estado de grilla que ve el engine.
function estadoGrilla(celdas: boolean[], columnas: number, campoLibre: boolean) {
  if (!campoLibre) {
    let filasCompletas = 0;
    for (let desde = 0; desde < celdas.length; desde += columnas) {
      if (celdas.slice(desde, desde + columnas).every(Boolean)) filasCompletas++;
    }
    return { tipo: 'grilla' as const, filas: filasCompletas, columnas };
  }
  // En campo libre solo cuenta un rectángulo completamente lleno; cualquier
  // otra forma todavía no es una grilla.
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
  const { mostrarTotal, mostrarNotacion, campoLibre } = caracteristicasNivel(nivel.id);
  const modo =
    objetivo?.modo === 'predecir' ? 'predecir' : campoLibre || objetivo?.modo === 'total' ? 'campo' : 'slots';

  const filas =
    modo === 'campo' ? CAMPO_LIBRE.filas : objetivo && objetivo.modo !== 'total' ? objetivo.filas : 1;
  const columnas =
    modo === 'campo'
      ? CAMPO_LIBRE.columnas
      : objetivo && objetivo.modo !== 'total'
        ? objetivo.columnas
        : 1;
  const totalObjetivo =
    objetivo === null
      ? 0
      : objetivo.modo === 'total'
        ? objetivo.total
        : objetivo.filas * objetivo.columnas;

  const [celdas, setCeldas] = useState<boolean[]>(() =>
    Array(filas * columnas).fill(modo === 'predecir'),
  );
  const [usadas, setUsadas] = useState<boolean[]>(() =>
    Array(modo === 'slots' ? totalObjetivo : 0).fill(false),
  );
  const [respuesta, setRespuesta] = useState<number | null>(null);
  const [fase, setFase] = useState<FaseNivel>('jugando');
  const [pulso, setPulso] = useState(false);
  const [estrellas, setEstrellas] = useState<Estrellas | null>(null);

  const espejoEstado = useRef({ celdas, fase });
  espejoEstado.current = { celdas, fase };
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

  // Drag de fichas (modo slots).
  const soltarFicha = (slotId: string | null): ResultadoSoltar => {
    const sesion = sesionRef.current;
    if (sesion === null || espejoEstado.current.fase !== 'jugando') return 'fuera';
    if (slotId === null || slotId === 'respuesta') {
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
    sesion.actualizarEstado(estadoGrilla(nuevas, columnas, false));
    return 'ok';
  };

  const encajarFicha = (indiceFicha: number) => {
    setUsadas((anteriores) => anteriores.map((usada, i) => (i === indiceFicha ? true : usada)));
  };

  // Tap para plantar/desplantar (modo campo).
  const tocarCelda = (indice: number) => {
    const sesion = sesionRef.current;
    if (sesion === null || espejoEstado.current.fase !== 'jugando') return;
    const plantando = !espejoEstado.current.celdas[indice];
    const nuevas = espejoEstado.current.celdas.map((llena, i) => (i === indice ? plantando : llena));
    espejoEstado.current = { ...espejoEstado.current, celdas: nuevas };
    setCeldas(nuevas);
    setPulso(false);
    // Feedback sonoro inmediato del toque: plantar hace click, sacar hace pop.
    busJuego.emitir({ tipo: plantando ? 'pieza_soltada_ok' : 'pieza_agarrada' });
    sesion.actualizarEstado(estadoGrilla(nuevas, columnas, true));
  };

  // Drag de chips numéricos (modo predecir).
  const soltarChip = (valor: number, slotId: string | null): ResultadoSoltar => {
    const sesion = sesionRef.current;
    if (sesion === null || espejoEstado.current.fase !== 'jugando') return 'fuera';
    if (slotId !== 'respuesta') {
      sesion.registrarIntentoFallido('afuera');
      return 'fuera';
    }
    if (valor !== totalObjetivo) {
      sesion.registrarIntentoFallido(`chip-${valor}`);
      return 'fuera';
    }
    return 'ok';
  };

  const encajarChip = (valor: number) => {
    setRespuesta(valor);
    sesionRef.current?.actualizarEstado({ tipo: 'grilla', filas: 1, columnas: valor });
  };

  // La celebración es salteable con un toque (GAMEFEEL.md 3).
  const saltear = () => {
    if (fase === 'cosecha' || fase === 'comiendo') setFase('final');
  };

  if (objetivo === null) return null;

  const plantadas = celdas.filter(Boolean).length;
  const primeraLibre = celdas.findIndex((llena) => !llena);
  const tamCelda = Math.min(56, Math.floor((modo === 'campo' ? 360 : 400) / columnas));
  const consignaGrupos =
    objetivo.modo === 'armar' && !mostrarNotacion
      ? Array.from({ length: objetivo.filas }, (_, i) => i)
      : null;

  return (
    <div className="nivel" onPointerDown={saltear}>
      <header className="nivel__cabecera">
        <button type="button" className="boton-redondo" onClick={alVolver}>
          🗺️
        </button>
        <div className={`nivel__consigna${pulso && modo !== 'slots' ? ' nivel__consigna--pulso' : ''}`}>
          {consignaGrupos && objetivo.modo === 'armar' && (
            <span className="paquetes">
              {consignaGrupos.map((i) => (
                <span key={i} className="paquete">
                  {objetivo.columnas}
                </span>
              ))}
            </span>
          )}
          {mostrarNotacion && objetivo.modo === 'armar' && (
            <span className="nivel__notacion">
              {objetivo.filas} × {objetivo.columnas}
            </span>
          )}
          {objetivo.modo === 'total' && <span className="nivel__objetivo">🌱 {totalObjetivo}</span>}
          {objetivo.modo === 'predecir' && (
            <span className="nivel__notacion">
              {mostrarNotacion && `${objetivo.filas} × ${objetivo.columnas} =`}
              <span
                ref={refSlotRespuesta}
                className={`slot-respuesta${respuesta !== null ? ' slot-respuesta--llena' : ''}`}
              >
                {respuesta ?? '?'}
              </span>
            </span>
          )}
          {mostrarTotal && objetivo.modo === 'armar' && modo !== 'slots' && (
            <span className="nivel__contador">{plantadas}</span>
          )}
        </div>
        <span />
      </header>

      <div
        className={`tablero${fase !== 'jugando' ? ' tablero--resuelto' : ''}${modo === 'campo' ? ' tablero--campo' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${columnas}, ${tamCelda}px)`,
          ['--celda' as string]: `${tamCelda}px`,
        }}
      >
        {celdas.map((llena, i) => (
          <Celda
            key={i}
            indice={i}
            llena={llena}
            conPulso={pulso && modo === 'slots' && i === primeraLibre}
            alTocar={modo === 'campo' && fase === 'jugando' ? tocarCelda : null}
          />
        ))}
      </div>

      {fase === 'jugando' && modo === 'slots' && (
        <div className="bandeja">
          {usadas.map((usada, i) => (
            <Ficha key={i} usada={usada} alSoltar={soltarFicha} alEncajado={() => encajarFicha(i)} />
          ))}
        </div>
      )}

      {fase === 'jugando' && modo === 'predecir' && (
        <div className="bandeja">
          {opcionesPrediccion(objetivo.modo === 'predecir' ? objetivo.filas : 1, columnas).map(
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
          {mostrarTotal && objetivo.modo !== 'predecir' && (
            <div className="nivel__final-total">{totalObjetivo}</div>
          )}
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
