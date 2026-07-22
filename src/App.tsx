// Banco de pruebas del motor (paso 1 del ROADMAP): una grilla de 2×3 con
// fichas arrastrables que ejercita drag & drop, validación, sesión, eventos,
// pistas, inactividad y guardado. No es el juego: es el arnés para sentir el
// feel y ver los eventos en vivo. El Mundo 1 real llega en el paso 2.

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  cargarProgreso,
  completarNivel,
  crearDetectorInactividad,
  crearSesionNivel,
  guardarProgreso,
  progresoInicial,
  useArrastre,
  useSlot,
} from './engine';
import type { EventoJuego, Progreso, ResultadoSoltar, SesionNivel } from './engine';
import { nivelPruebaGrilla, nivelesPrueba } from './data/nivelesPrueba';
import './App.css';

const FILAS = 2;
const COLUMNAS = 3;
const TOTAL_CELDAS = FILAS * COLUMNAS;

function describir(evento: EventoJuego): string {
  switch (evento.tipo) {
    case 'pieza_agarrada':
      return '🖐 pieza agarrada';
    case 'pieza_soltada_ok':
      return '🧲 encajó en el slot';
    case 'pieza_soltada_fuera':
      return '🫧 volvió al origen';
    case 'progreso_parcial':
      return '✨ fila completa';
    case 'puzzle_resuelto':
      return `🌟 puzzle resuelto ${'⭐'.repeat(evento.estrellas)}`;
    case 'intentos_repetidos':
      return '💡 el lugar libre pulsa';
    case 'inactividad':
      return `💤 inactividad (${evento.segundos}s)`;
    case 'secreto_encontrado':
      return '🎁 secreto encontrado';
  }
}

function contarFilasCompletas(celdas: boolean[]): number {
  let filas = 0;
  for (let fila = 0; fila < FILAS; fila++) {
    if (celdas.slice(fila * COLUMNAS, (fila + 1) * COLUMNAS).every(Boolean)) filas++;
  }
  return filas;
}

type PropsFicha = {
  usada: boolean;
  alSoltar: (slotId: string | null) => ResultadoSoltar;
  alEncajado: () => void;
};

function Ficha({ usada, alSoltar, alEncajado }: PropsFicha) {
  const { fase, props } = useArrastre({ alSoltar, alEncajado, deshabilitada: usada });
  return <div className={`ficha ficha--${fase}${usada ? ' ficha--usada' : ''}`} {...props} />;
}

function Celda({ indice, llena, conPulso }: { indice: number; llena: boolean; conPulso: boolean }) {
  const ref = useSlot(`celda-${indice}`);
  return (
    <div
      ref={ref}
      className={`celda${llena ? ' celda--llena' : ''}${conPulso ? ' celda--pulso' : ''}`}
    >
      {llena && <div className="brote" />}
    </div>
  );
}

export default function App() {
  const [progreso, setProgreso] = useState<Progreso>(() => cargarProgreso());
  const [celdas, setCeldas] = useState<boolean[]>(() => Array(TOTAL_CELDAS).fill(false));
  const [usadas, setUsadas] = useState<boolean[]>(() => Array(TOTAL_CELDAS).fill(false));
  const [eventos, setEventos] = useState<{ id: number; texto: string }[]>([]);
  const [pulso, setPulso] = useState(false);
  const [resuelto, setResuelto] = useState(false);
  const [ronda, setRonda] = useState(0); // re-monta las fichas al reiniciar

  // Espejo para leer el estado vigente desde callbacks del drag y del bus,
  // que pueden haber quedado atados a un render anterior.
  const espejo = useRef({ celdas, resuelto, progreso });
  espejo.current = { celdas, resuelto, progreso };
  const contadorEventos = useRef(0);
  const toquesTitulo = useRef(0);
  const sesionRef = useRef<SesionNivel | null>(null);
  if (sesionRef.current === null) sesionRef.current = crearSesionNivel(nivelPruebaGrilla);

  useEffect(() => {
    return busJuego.escuchar((evento) => {
      // La entrada se arma acá afuera: dos eventos del mismo batch de React
      // leerían el mismo contador dentro del updater diferido.
      contadorEventos.current += 1;
      const entrada = { id: contadorEventos.current, texto: describir(evento) };
      setEventos((lista) => [entrada, ...lista].slice(0, 10));
      if (evento.tipo === 'puzzle_resuelto') {
        setResuelto(true);
        setPulso(false);
        const nuevo = completarNivel(
          nivelesPrueba,
          espejo.current.progreso,
          nivelPruebaGrilla.id,
          evento.estrellas,
        );
        guardarProgreso(nuevo);
        setProgreso(nuevo);
      }
      if (evento.tipo === 'intentos_repetidos') setPulso(true);
      if (evento.tipo === 'secreto_encontrado') {
        const actual = espejo.current.progreso;
        if (!actual.secretosEncontrados.includes(evento.secretoId)) {
          const nuevo = {
            ...actual,
            secretosEncontrados: [...actual.secretosEncontrados, evento.secretoId],
          };
          guardarProgreso(nuevo);
          setProgreso(nuevo);
        }
      }
    });
  }, []);

  useEffect(() => {
    const detector = crearDetectorInactividad();
    const alInput = () => detector.actividad();
    window.addEventListener('pointerdown', alInput);
    return () => {
      window.removeEventListener('pointerdown', alInput);
      detector.detener();
    };
  }, []);

  const soltarFicha = (slotId: string | null): ResultadoSoltar => {
    const sesion = sesionRef.current;
    if (sesion === null || espejo.current.resuelto) return 'fuera';
    if (slotId === null) {
      sesion.registrarIntentoFallido('afuera');
      return 'fuera';
    }
    const indice = Number(slotId.replace('celda-', ''));
    if (espejo.current.celdas[indice]) {
      sesion.registrarIntentoFallido(slotId);
      return 'fuera';
    }
    const nuevas = espejo.current.celdas.map((llena, i) => (i === indice ? true : llena));
    espejo.current = { ...espejo.current, celdas: nuevas };
    setCeldas(nuevas);
    setPulso(false);
    sesion.actualizarEstado({
      tipo: 'grilla',
      filas: contarFilasCompletas(nuevas),
      columnas: COLUMNAS,
    });
    return 'ok';
  };

  const encajarFicha = (indiceFicha: number) => {
    setUsadas((anteriores) => anteriores.map((usada, i) => (i === indiceFicha ? true : usada)));
  };

  const tocarTitulo = () => {
    toquesTitulo.current += 1;
    if (toquesTitulo.current === 5) sesionRef.current?.encontrarSecreto('secreto-banco-titulo');
  };

  const reiniciarNivel = () => {
    sesionRef.current = crearSesionNivel(nivelPruebaGrilla);
    setCeldas(Array(TOTAL_CELDAS).fill(false));
    setUsadas(Array(TOTAL_CELDAS).fill(false));
    setPulso(false);
    setResuelto(false);
    setRonda((r) => r + 1);
  };

  const borrarProgreso = () => {
    const inicial = progresoInicial();
    guardarProgreso(inicial);
    setProgreso(inicial);
    reiniciarNivel();
  };

  const primeraLibre = celdas.findIndex((llena) => !llena);
  const nivelGuardado = progreso.nivelesCompletados[nivelPruebaGrilla.id];

  return (
    <main className="banco">
      <header className="banco__cabecera">
        <h1 onClick={tocarTitulo}>mate-game · banco de pruebas del motor</h1>
        <div className="banco__acciones">
          <button type="button" onClick={reiniciarNivel}>
            otra vez
          </button>
          <button type="button" onClick={borrarProgreso}>
            borrar progreso
          </button>
        </div>
      </header>

      <section className="banco__escena">
        <div className={`tablero${resuelto ? ' tablero--resuelto' : ''}`}>
          {celdas.map((llena, i) => (
            <Celda key={i} indice={i} llena={llena} conPulso={pulso && i === primeraLibre} />
          ))}
        </div>
        <div className="bandeja">
          {usadas.map((usada, i) => (
            <Ficha
              key={`${ronda}-${i}`}
              usada={usada}
              alSoltar={soltarFicha}
              alEncajado={() => encajarFicha(i)}
            />
          ))}
        </div>
      </section>

      <aside className="panel">
        <div className="panel__estado">
          <span>{nivelGuardado ? '⭐'.repeat(nivelGuardado.estrellas) : '· · ·'}</span>
          <span>🐣 {progreso.etapaMascota}</span>
          <span>🎁 {progreso.secretosEncontrados.length}</span>
        </div>
        <ol className="panel__eventos">
          {eventos.map((evento) => (
            <li key={evento.id}>{evento.texto}</li>
          ))}
        </ol>
      </aside>
    </main>
  );
}
