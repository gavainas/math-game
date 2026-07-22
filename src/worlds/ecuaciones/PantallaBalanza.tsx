// Pantalla del Mundo 4 (Balanza Mágica), mecánica DragonBox de "separar la
// cajita": el cofre 📦 es la incógnita y hay que dejarlo solo de un lado.
// - Tocar un objeto que está en los dos platillos lo saca de ambos (quitar en
//   espejo). Si está en uno solo, la balanza se tambalea y no pasa nada.
// - Tocar un número se lo resta al número del otro lado (si alcanza).
// - Tocar los cofres cuando están solos y son varios reparte el otro lado
//   entre ellos (división en espejo).
// La ecuación escrita aparece recién en el tramo de notación y se va
// simplificando en vivo a medida que se despeja.

import { useEffect, useRef, useState } from 'react';
import { busJuego, crearDetectorInactividad, crearSesionNivel } from '../../engine';
import type { Estrellas, Nivel, SesionNivel, TerminoBalanza } from '../../engine';
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

type Props = {
  nivel: Nivel;
  alVolver: () => void;
  alSiguiente: (() => void) | null;
};

export default function PantallaBalanza({ nivel, alVolver, alSiguiente }: Props) {
  const objetivo = nivel.tipo === 'balanza' ? nivel.objetivo : null;
  const { mostrarNotacion } = caracteristicasEcuaciones(nivel.id);

  const [lados, setLados] = useState<Lados>(() => ({
    izquierda: objetivo?.izquierda ?? [],
    derecha: objetivo?.derecha ?? [],
  }));
  const [fase, setFase] = useState<FaseNivel>('jugando');
  const [pulso, setPulso] = useState(false);
  const [tambaleo, setTambaleo] = useState<string | null>(null);
  const [estrellas, setEstrellas] = useState<Estrellas | null>(null);

  const espejoRef = useRef({ lados, fase });
  espejoRef.current = { lados, fase };
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

  // Calcula la jugada de un término, o null si no es válida.
  const jugada = (
    l: Lados,
    lado: Lado,
    indice: number,
  ): { propios: TerminoBalanza[]; ajenos: TerminoBalanza[] } | null => {
    const propios = l[lado];
    const ajenos = l[lado === 'izquierda' ? 'derecha' : 'izquierda'];
    const termino = propios[indice];
    if (termino.clase === 'objeto') {
      const j = ajenos.findIndex((a) => a.clase === 'objeto' && a.icono === termino.icono);
      if (j === -1) return null;
      return { propios: sin(propios, indice), ajenos: sin(ajenos, j) };
    }
    if (termino.clase === 'numero') {
      const j = ajenos.findIndex((a) => a.clase === 'numero' && a.valor > termino.valor);
      if (j === -1) return null;
      return {
        propios: sin(propios, indice),
        ajenos: ajenos.map((a, k) =>
          k === j && a.clase === 'numero' ? { ...a, valor: a.valor - termino.valor } : a,
        ),
      };
    }
    // Cofres: repartir en espejo, solo si están solos, son varios y el otro
    // lado es un único número divisible.
    const cofres = propios.filter((a) => a.clase === 'incognita').length;
    const unicoNumero = ajenos.length === 1 && ajenos[0].clase === 'numero' ? ajenos[0] : null;
    if (
      cofres > 1 &&
      propios.length === cofres &&
      unicoNumero !== null &&
      unicoNumero.valor % cofres === 0
    ) {
      return {
        propios: [{ clase: 'incognita' }],
        ajenos: [{ clase: 'numero', valor: unicoNumero.valor / cofres }],
      };
    }
    return null;
  };

  const tocarTermino = (lado: Lado, indice: number) => {
    const { lados: l, fase: f } = espejoRef.current;
    if (f !== 'jugando') return;
    const resultado = jugada(l, lado, indice);
    const termino = l[lado][indice];
    if (resultado === null) {
      const firma =
        termino.clase === 'objeto'
          ? `objeto-${termino.icono}`
          : termino.clase === 'numero'
            ? `numero-${termino.valor}`
            : 'cofre';
      sesionRef.current?.registrarIntentoFallido(firma);
      busJuego.emitir({ tipo: 'pieza_soltada_fuera' });
      setTambaleo(`${lado}-${indice}`);
      temporizadores.current.push(setTimeout(() => setTambaleo(null), 450));
      return;
    }
    busJuego.emitir({ tipo: 'pieza_soltada_ok' });
    const otro: Lado = lado === 'izquierda' ? 'derecha' : 'izquierda';
    const nuevos = { ...l, [lado]: resultado.propios, [otro]: resultado.ajenos } as Lados;
    espejoRef.current = { ...espejoRef.current, lados: nuevos };
    setLados(nuevos);
    setPulso(false);
    sesionRef.current?.actualizarEstado({
      tipo: 'balanza',
      izquierda: nuevos.izquierda,
      derecha: nuevos.derecha,
    });
  };

  const saltear = () => {
    if (fase === 'cosecha' || fase === 'comiendo') setFase('final');
  };

  if (objetivo === null) return null;

  const ladoRespuesta = lados.izquierda.some((t) => t.clase === 'incognita')
    ? lados.derecha
    : lados.izquierda;
  const resumenRespuesta = ladoRespuesta
    .map((t) => (t.clase === 'objeto' ? t.icono : t.clase === 'numero' ? String(t.valor) : ''))
    .join(' ');

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
        <span />
      </header>

      <div className={`balanza${fase !== 'jugando' ? ' balanza--resuelta' : ''}`}>
        <div className="balanza__platillos">
          {(['izquierda', 'derecha'] as const).map((lado) => (
            <div key={lado} className="platillo">
              {lados[lado].map((termino, i) => {
                const quitable = jugada(lados, lado, i) !== null;
                const clases = [
                  'termino',
                  termino.clase === 'incognita'
                    ? 'termino--cofre'
                    : termino.clase === 'numero'
                      ? 'termino--numero'
                      : 'termino--objeto',
                  tambaleo === `${lado}-${i}` ? 'termino--tambaleo' : '',
                  pulso && quitable ? 'termino--pulso' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button
                    key={`${lado}-${i}`}
                    type="button"
                    className={clases}
                    onPointerDown={(evento) => {
                      evento.stopPropagation();
                      tocarTermino(lado, i);
                    }}
                  >
                    {termino.clase === 'objeto'
                      ? termino.icono
                      : termino.clase === 'numero'
                        ? termino.valor
                        : fase === 'jugando'
                          ? '📦'
                          : '🎁'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="balanza__viga" />
        <div className="balanza__base" />
      </div>

      {(fase === 'cosecha' || fase === 'comiendo') && (
        <div className="cosecha" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="cosecha__brote" style={{ animationDelay: `${i * 0.09}s` }}>
              💎
            </span>
          ))}
        </div>
      )}

      {fase === 'final' && (
        <div className="nivel__final">
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
