// Pantalla de juego del Mundo 2 (Reparto Justo). Tres modos:
// - repartir: pila central de frutas y N amigos; tocar un amigo le da una
//   fruta, tocar su montón la devuelve. Se resuelve cuando el reparto es justo
//   y lo que sobra (el resto) queda sentado al costado, visible.
// - amigos (espejo): un amigo modelo muestra cuánto recibe cada uno; se
//   agregan o sacan amigos hasta que la pila se reparte exacta.
// - predecir: se elige el cociente correcto entre distractores, sin repartir.

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  crearDetectorInactividad,
  crearSesionNivel,
  useArrastre,
  useSlot,
} from '../../engine';
import Benja from '../../components/Benja';
import type { Estrellas, Nivel, ResultadoSoltar, SesionNivel } from '../../engine';
import { caracteristicasDivision, opcionesCociente } from '../../data/division';

const CARAS_AMIGOS = ['🐻', '🐰', '🦊', '🐶', '🐨', '🐷', '🐸', '🐢'];

type FaseNivel = 'jugando' | 'cosecha' | 'comiendo' | 'final';

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

export default function PantallaReparto({ nivel, alVolver, alSiguiente, alAyuda }: Props) {
  const objetivo = nivel.tipo === 'reparto' ? nivel.objetivo : null;
  const { mostrarNotacion } = caracteristicasDivision(nivel.id);
  const modo = objetivo?.modo ?? 'repartir';
  const cantidad = objetivo?.cantidad ?? 0;
  const cantidadAmigos = objetivo && objetivo.modo !== 'amigos' ? objetivo.amigos : 0;
  const porAmigoObjetivo = objetivo?.modo === 'amigos' ? objetivo.porAmigo : 0;

  const [pila, setPila] = useState(cantidad);
  // repartir: tamaño fijo; amigos (espejo): lista que crece y se achica.
  const [amigos, setAmigos] = useState<number[]>(() =>
    modo === 'repartir' ? Array(cantidadAmigos).fill(0) : [],
  );
  const [respuesta, setRespuesta] = useState<number | null>(null);
  const [fase, setFase] = useState<FaseNivel>('jugando');
  const [estrellas, setEstrellas] = useState<Estrellas | null>(null);

  const espejoEstado = useRef({ pila, amigos, fase });
  espejoEstado.current = { pila, amigos, fase };
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

  const actualizar = (nuevaPila: number, nuevosAmigos: number[]) => {
    espejoEstado.current = { ...espejoEstado.current, pila: nuevaPila, amigos: nuevosAmigos };
    setPila(nuevaPila);
    setAmigos(nuevosAmigos);
    sesionRef.current?.actualizarEstado({
      tipo: 'reparto',
      porAmigo: nuevosAmigos,
      sinRepartir: nuevaPila,
    });
  };

  // Tocar un amigo: le doy una fruta de la pila.
  const darFruta = (indice: number) => {
    const { pila: p, amigos: a, fase: f } = espejoEstado.current;
    if (f !== 'jugando' || p === 0) return;
    busJuego.emitir({ tipo: 'pieza_soltada_ok' });
    actualizar(p - 1, a.map((n, i) => (i === indice ? n + 1 : n)));
  };

  // Tocar el montón de un amigo: devuelve una fruta a la pila.
  const devolverFruta = (indice: number) => {
    const { pila: p, amigos: a, fase: f } = espejoEstado.current;
    if (f !== 'jugando' || a[indice] === 0) return;
    busJuego.emitir({ tipo: 'pieza_agarrada' });
    actualizar(p + 1, a.map((n, i) => (i === indice ? n - 1 : n)));
  };

  // Espejo: llega un amigo nuevo y se lleva su parte (o lo que quede).
  const agregarAmigo = () => {
    const { pila: p, amigos: a, fase: f } = espejoEstado.current;
    if (f !== 'jugando' || a.length >= CARAS_AMIGOS.length) return;
    const toma = Math.min(porAmigoObjetivo, p);
    busJuego.emitir({ tipo: 'pieza_soltada_ok' });
    actualizar(p - toma, [...a, toma]);
  };

  // Espejo: un amigo se va y devuelve sus frutas.
  const sacarAmigo = (indice: number) => {
    const { pila: p, amigos: a, fase: f } = espejoEstado.current;
    if (f !== 'jugando') return;
    busJuego.emitir({ tipo: 'pieza_agarrada' });
    actualizar(p + a[indice], a.filter((_, i) => i !== indice));
  };

  const cuota = cantidadAmigos > 0 ? Math.floor(cantidad / cantidadAmigos) : 0;

  const soltarChip = (valor: number, slotId: string | null): ResultadoSoltar => {
    const sesion = sesionRef.current;
    if (sesion === null || espejoEstado.current.fase !== 'jugando') return 'fuera';
    if (slotId !== 'respuesta') {
      sesion.registrarIntentoFallido('afuera');
      return 'fuera';
    }
    if (valor !== cuota) {
      sesion.registrarIntentoFallido(`chip-${valor}`);
      return 'fuera';
    }
    return 'ok';
  };

  const encajarChip = (valor: number) => {
    setRespuesta(valor);
    sesionRef.current?.actualizarEstado({ tipo: 'reparto', porAmigo: [valor], sinRepartir: 0 });
  };

  const saltear = () => {
    if (fase === 'cosecha' || fase === 'comiendo') setFase('final');
  };

  if (objetivo === null) return null;

  const resuelto = fase !== 'jugando';
  const amigosVisibles = modo === 'predecir' ? Array(cantidadAmigos).fill(0) : amigos;

  return (
    <div className="nivel" onPointerDown={saltear}>
      <header className="nivel__cabecera">
        <button type="button" className="boton-redondo" onClick={alVolver}>
          🗺️
        </button>
        <div className="nivel__consigna">
          {mostrarNotacion && modo !== 'amigos' && (
            <span className="nivel__notacion">
              {cantidad} ÷ {cantidadAmigos}
              {modo === 'predecir' && (
                <>
                  {' = '}
                  <span
                    ref={refSlotRespuesta}
                    className={`slot-respuesta${respuesta !== null ? ' slot-respuesta--llena' : ''}`}
                  >
                    {respuesta ?? '?'}
                  </span>
                </>
              )}
            </span>
          )}
          {!mostrarNotacion && modo === 'predecir' && (
            <span
              ref={refSlotRespuesta}
              className={`slot-respuesta${respuesta !== null ? ' slot-respuesta--llena' : ''}`}
            >
              {respuesta ?? '?'}
            </span>
          )}
          {modo === 'amigos' && (
            <span className="modelo">
              <span className="modelo__cara">{CARAS_AMIGOS[0]}</span>
              <span className="modelo__cantidad">🍎 {porAmigoObjetivo}</span>
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

      <div className={`pila${resuelto && pila > 0 ? ' pila--resto' : ''}`}>
        <span className="pila__fruta">🍎</span>
        <span className="pila__cantidad">{pila}</span>
        {resuelto && pila > 0 && <span className="pila__cara">🤷</span>}
      </div>

      <div className="amigos">
        {amigosVisibles.map((frutas, i) => (
          <div key={i} className="amigo">
            <button
              type="button"
              className="amigo__cara"
              onPointerDown={() => (modo === 'repartir' ? darFruta(i) : sacarAmigo(i))}
            >
              {CARAS_AMIGOS[(modo === 'amigos' ? i + 1 : i) % CARAS_AMIGOS.length]}
            </button>
            <button
              type="button"
              className={`amigo__monton${frutas > 0 ? ' amigo__monton--con-frutas' : ''}`}
              onPointerDown={() => (modo === 'repartir' ? devolverFruta(i) : undefined)}
            >
              {frutas > 0 ? `🍎 ${frutas}` : '·'}
            </button>
          </div>
        ))}
        {modo === 'amigos' && fase === 'jugando' && amigos.length < CARAS_AMIGOS.length && (
          <button type="button" className="amigo amigo--sumar" onPointerDown={agregarAmigo}>
            +
          </button>
        )}
      </div>

      {fase === 'jugando' && modo === 'predecir' && (
        <div className="bandeja">
          {opcionesCociente(cantidad, cantidadAmigos).map((valor) => (
            <ChipNumero
              key={valor}
              valor={valor}
              colocado={respuesta === valor}
              alSoltar={soltarChip}
              alEncajado={encajarChip}
            />
          ))}
        </div>
      )}

      {(fase === 'cosecha' || fase === 'comiendo') && (
        <div className="cosecha" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="cosecha__brote" style={{ animationDelay: `${i * 0.09}s` }}>
              🍎
            </span>
          ))}
        </div>
      )}

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
