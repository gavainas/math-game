// Pantalla del Mundo 4 (Balanza Mágica), mecánica DragonBox de "separar la
// cajita": el cofre 📦 es la incógnita y hay que dejarlo solo de un lado.
// Los términos se ARRASTRAN al otro platillo (o se tocan, mismo efecto):
// - Un objeto que está en los dos platillos se va de ambos (quitar en espejo).
// - Un número se resta del número del otro lado (si alcanza).
// - Los cofres, solos y siendo varios, se reparten el número del otro lado.
// Jugada inválida: la balanza entera se tambalea, sin castigo.
// El primer nivel trae tutorial: la manito muestra el gesto de llevar.

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  crearDetectorInactividad,
  crearSesionNivel,
  useArrastre,
  useSlot,
} from '../../engine';
import type { Estrellas, Nivel, ResultadoSoltar, SesionNivel, TerminoBalanza } from '../../engine';
import Benja from '../../components/Benja';
import Celebracion from '../../components/Celebracion';
import { caracteristicasEcuaciones } from '../../data/ecuaciones';

type FaseNivel = 'jugando' | 'cosecha' | 'comiendo' | 'final';
type Lado = 'izquierda' | 'derecha';
type Lados = { izquierda: TerminoBalanza[]; derecha: TerminoBalanza[] };

function sin<T>(lista: T[], indice: number): T[] {
  return lista.filter((_, i) => i !== indice);
}

// "2x + 3" a partir de los términos de un lado.
function textoLado(terminos: TerminoBalanza[]): string {
  const cofres = terminos.filter((t) => t.clase === 'incognita').length;
  const partes: string[] = [];
  if (cofres > 0) partes.push(cofres > 1 ? `${cofres}x` : 'x');
  for (const t of terminos) {
    if (t.clase === 'numero') partes.push(String(t.valor));
  }
  return partes.join(' + ') || '0';
}

type PropsTermino = {
  termino: TerminoBalanza;
  quitable: boolean;
  conPulso: boolean;
  abierto: boolean;
  alSoltar: (slotId: string | null) => ResultadoSoltar;
  alEncajado: () => void;
};

function TerminoPieza({ termino, quitable, conPulso, abierto, alSoltar, alEncajado }: PropsTermino) {
  const { fase, props } = useArrastre({ alSoltar, alEncajado });
  const clases = [
    'termino',
    `termino--drag-${fase}`,
    termino.clase === 'incognita'
      ? 'termino--cofre'
      : termino.clase === 'numero'
        ? 'termino--numero'
        : 'termino--objeto',
    conPulso && quitable ? 'termino--pulso' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={clases} {...props}>
      {termino.clase === 'objeto' ? (
        termino.icono
      ) : termino.clase === 'numero' ? (
        // key por valor: cuando el número cambia, la cifra hace pop
        <span key={termino.valor} className="termino__valor">
          {termino.valor}
        </span>
      ) : abierto ? (
        '🎁'
      ) : (
        '📦'
      )}
    </div>
  );
}

type Props = {
  nivel: Nivel;
  alVolver: () => void;
  alSiguiente: (() => void) | null;
  alAyuda: () => void;
};

export default function PantallaBalanza({ nivel, alVolver, alSiguiente, alAyuda }: Props) {
  const objetivo = nivel.tipo === 'balanza' ? nivel.objetivo : null;
  const { mostrarNotacion } = caracteristicasEcuaciones(nivel.id);
  const esTutorial = nivel.id.replace(/--repaso\d+$/, '') === 'm4-n01';

  const [lados, setLados] = useState<Lados>(() => ({
    izquierda: objetivo?.izquierda ?? [],
    derecha: objetivo?.derecha ?? [],
  }));
  const [fase, setFase] = useState<FaseNivel>('jugando');
  // En el tutorial los términos quitables pulsan desde el arranque.
  const [pulso, setPulso] = useState(esTutorial);
  const [tambaleo, setTambaleo] = useState(false);
  const [sinJugadas, setSinJugadas] = useState(true);
  const [estrellas, setEstrellas] = useState<Estrellas | null>(null);

  const espejoRef = useRef({ lados, fase });
  espejoRef.current = { lados, fase };
  const jugadaPendiente = useRef<Lados | null>(null);
  const sesionRef = useRef<SesionNivel | null>(null);
  if (sesionRef.current === null) sesionRef.current = crearSesionNivel(nivel);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  const refPlatilloIzq = useSlot('platillo-izquierda');
  const refPlatilloDer = useSlot('platillo-derecha');

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

  // Calcula la jugada de un término, o null si no es válida.
  const jugada = (l: Lados, lado: Lado, indice: number): Lados | null => {
    const propios = l[lado];
    const otro: Lado = lado === 'izquierda' ? 'derecha' : 'izquierda';
    const ajenos = l[otro];
    const termino = propios[indice];
    if (termino === undefined) return null;
    if (termino.clase === 'objeto') {
      const j = ajenos.findIndex((a) => a.clase === 'objeto' && a.icono === termino.icono);
      if (j === -1) return null;
      return { ...l, [lado]: sin(propios, indice), [otro]: sin(ajenos, j) } as Lados;
    }
    if (termino.clase === 'numero') {
      const j = ajenos.findIndex((a) => a.clase === 'numero' && a.valor > termino.valor);
      if (j === -1) return null;
      return {
        ...l,
        [lado]: sin(propios, indice),
        [otro]: ajenos.map((a, k) =>
          k === j && a.clase === 'numero' ? { ...a, valor: a.valor - termino.valor } : a,
        ),
      } as Lados;
    }
    // Cofres: repartir en espejo, solo si están solos, son varios y el otro
    // lado es un único número divisible.
    const cofres = propios.filter((a) => a.clase === 'incognita').length;
    const unicoNumero = ajenos.length === 1 && ajenos[0].clase === 'numero' ? ajenos[0] : null;
    if (cofres > 1 && propios.length === cofres && unicoNumero && unicoNumero.valor % cofres === 0) {
      return {
        ...l,
        [lado]: [{ clase: 'incognita' }],
        [otro]: [{ clase: 'numero', valor: unicoNumero.valor / cofres }],
      } as Lados;
    }
    return null;
  };

  const firmaDe = (termino: TerminoBalanza): string =>
    termino.clase === 'objeto'
      ? `objeto-${termino.icono}`
      : termino.clase === 'numero'
        ? `numero-${termino.valor}`
        : 'cofre';

  // Soltar (o tocar) un término: si cae sobre un platillo y la jugada vale,
  // se aplica cuando la pieza termina de asentarse.
  const soltarTermino = (lado: Lado, indice: number, slotId: string | null): ResultadoSoltar => {
    const { lados: l, fase: f } = espejoRef.current;
    if (f !== 'jugando') return 'fuera';
    if (slotId === null) return 'fuera'; // soltó en el aire: vuelve, sin penalidad
    const resultado = jugada(l, lado, indice);
    if (resultado === null) {
      sesionRef.current?.registrarIntentoFallido(firmaDe(l[lado][indice]));
      setTambaleo(true);
      temporizadores.current.push(setTimeout(() => setTambaleo(false), 500));
      return 'fuera';
    }
    jugadaPendiente.current = resultado;
    return 'ok';
  };

  const aplicarJugada = () => {
    const resultado = jugadaPendiente.current;
    jugadaPendiente.current = null;
    if (resultado === null || espejoRef.current.fase !== 'jugando') return;
    espejoRef.current = { ...espejoRef.current, lados: resultado };
    setLados(resultado);
    setPulso(false);
    setSinJugadas(false);
    sesionRef.current?.actualizarEstado({
      tipo: 'balanza',
      izquierda: resultado.izquierda,
      derecha: resultado.derecha,
    });
  };

  const saltear = () => {
    if (fase === 'cosecha' || fase === 'comiendo') setFase('final');
  };

  if (objetivo === null) return null;

  const resuelto = fase !== 'jugando';
  const ladoRespuesta = lados.izquierda.some((t) => t.clase === 'incognita')
    ? lados.derecha
    : lados.izquierda;
  const resumenRespuesta = ladoRespuesta
    .map((t) => (t.clase === 'objeto' ? t.icono : t.clase === 'numero' ? String(t.valor) : ''))
    .join(' ');
  // El cofre pulsa suave cuando está a una jugada de quedar solo.
  const cercaDeGanar =
    !resuelto &&
    (['izquierda', 'derecha'] as const).some((lado) => {
      const propios = lados[lado];
      return propios.some((t) => t.clase === 'incognita') && propios.length === 2;
    });

  return (
    <div className="nivel" onPointerDown={saltear}>
      <header className="nivel__cabecera">
        <button type="button" className="boton-redondo" onClick={alVolver}>
          🗺️
        </button>
        <div className="nivel__consigna">
          {mostrarNotacion && (
            <span className="nivel__notacion">
              {textoLado(lados.izquierda)} = {textoLado(lados.derecha)}
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

      <div
        className={`balanza${resuelto ? ' balanza--resuelta' : ''}${tambaleo ? ' balanza--tambaleo' : ''}${cercaDeGanar ? ' balanza--cerca' : ''}`}
      >
        <div className="balanza__platillos">
          {(['izquierda', 'derecha'] as const).map((lado) => (
            <div
              key={lado}
              ref={lado === 'izquierda' ? refPlatilloIzq : refPlatilloDer}
              className="platillo"
            >
              {lados[lado].map((termino, i) => (
                <TerminoPieza
                  key={`${lado}-${i}-${lados[lado].length}`}
                  termino={termino}
                  quitable={jugada(lados, lado, i) !== null}
                  conPulso={pulso}
                  abierto={resuelto && termino.clase === 'incognita'}
                  alSoltar={(slotId) => soltarTermino(lado, i, slotId)}
                  alEncajado={aplicarJugada}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="balanza__viga" />
        <div className="balanza__base" />
        {esTutorial && sinJugadas && !resuelto && <div className="mano-tutorial">👆</div>}
      </div>

      {(fase === 'cosecha' || fase === 'comiendo') && <Celebracion emoji="💎" />}

      {fase === 'final' && (
        <div className="nivel__final">
          <Benja expresion="feliz" ancho={96} />
          <div className="nivel__final-estrellas">{'⭐'.repeat(estrellas ?? 1)}</div>
          <div className="nivel__final-total">
            {mostrarNotacion ? `x = ${resumenRespuesta}` : `🎁 = ${resumenRespuesta}`}
          </div>
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
