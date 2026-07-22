// Drag & drop con spring y snap magnético (GAMEFEEL.md 11.4 punto 1 y tabla 6).
// Es el 70% del feel: agarrar escala la pieza, arrastrar tiene lag elástico,
// soltar en lugar válido hace snap al slot, soltar afuera vuelve flotando al
// origen. Emite los eventos pieza_* por el bus; la validez la decide quien usa
// el hook (el engine de cada mundo), no este módulo.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as PointerEventReact } from 'react';
import { busJuego } from './eventos';
import type { Emisor } from './eventos';

export type FaseArrastre = 'reposo' | 'agarrada' | 'arrastrando' | 'encajando' | 'volviendo';
export type ResultadoSoltar = 'ok' | 'fuera';

export type OpcionesArrastre = {
  // Decide qué pasa al soltar. Recibe el slot más cercano dentro del radio
  // imán (o null). 'ok' encaja con snap; 'fuera' vuelve flotando al origen.
  alSoltar: (slotId: string | null) => ResultadoSoltar;
  // La pieza terminó de asentarse en el slot: momento de consumirla/ocultarla.
  alEncajado?: (slotId: string) => void;
  emitir?: Emisor;
  radioIman?: number; // px extra alrededor del slot donde atrae
  deshabilitada?: boolean;
};

// Parámetros de spring por fase. El arrastre queda levemente subamortiguado
// (lag elástico); el encaje es duro y rápido (<80ms percibido); la vuelta al
// origen flota (~300ms).
const RIGIDEZ = { arrastre: 320, encaje: 2000, vuelta: 350 } as const;
const AMORTIGUACION = { arrastre: 24, encaje: 55, vuelta: 34 } as const;
const ESCALA_AGARRE = 1.1;
const RADIO_IMAN_DEFAULT = 48;

type Punto = { x: number; y: number };

// Registro global de slots destino: se anotan con useSlot y el hit-test al
// soltar busca el centro más cercano dentro del alcance.
const slots = new Map<string, HTMLElement>();

export function useSlot(id: string): (el: HTMLElement | null) => void {
  return useCallback(
    (el: HTMLElement | null) => {
      if (el) slots.set(id, el);
      else slots.delete(id);
    },
    [id],
  );
}

function slotMasCercano(centro: Punto, radioIman: number): string | null {
  let mejor: string | null = null;
  let mejorDistancia = Infinity;
  for (const [id, el] of slots) {
    const rect = el.getBoundingClientRect();
    const distancia = Math.hypot(
      centro.x - (rect.left + rect.width / 2),
      centro.y - (rect.top + rect.height / 2),
    );
    const alcance = Math.max(rect.width, rect.height) / 2 + radioIman;
    if (distancia <= alcance && distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = id;
    }
  }
  return mejor;
}

export function useArrastre(opciones: OpcionesArrastre) {
  const {
    alSoltar,
    alEncajado,
    emitir = busJuego.emitir,
    radioIman = RADIO_IMAN_DEFAULT,
    deshabilitada = false,
  } = opciones;

  const [fase, setFase] = useState<FaseArrastre>('reposo');

  const r = useRef({
    el: null as HTMLElement | null,
    fase: 'reposo' as FaseArrastre,
    pos: { x: 0, y: 0 } as Punto, // translate actual respecto del origen de layout
    vel: { x: 0, y: 0 } as Punto,
    objetivo: { x: 0, y: 0 } as Punto,
    punteroInicial: { x: 0, y: 0 } as Punto,
    rectInicial: null as DOMRect | null,
    slotDestino: null as string | null,
    rafId: 0,
    ultimoTiempo: 0,
  }).current;

  const cambiarFase = useCallback(
    (nueva: FaseArrastre) => {
      r.fase = nueva;
      setFase(nueva);
    },
    [r],
  );

  const aplicarTransform = useCallback(() => {
    if (!r.el) return;
    if (r.fase === 'reposo') {
      r.el.style.transform = '';
      return;
    }
    const escala = r.fase === 'agarrada' || r.fase === 'arrastrando' ? ESCALA_AGARRE : 1;
    r.el.style.transform = `translate3d(${r.pos.x}px, ${r.pos.y}px, 0) scale(${escala})`;
  }, [r]);

  const paso = useCallback(
    function cuadro(tiempo: number) {
      const dt = Math.min((tiempo - r.ultimoTiempo) / 1000, 1 / 30);
      r.ultimoTiempo = tiempo;
      const modo =
        r.fase === 'encajando' ? 'encaje' : r.fase === 'volviendo' ? 'vuelta' : 'arrastre';
      const k = RIGIDEZ[modo];
      const c = AMORTIGUACION[modo];
      for (const eje of ['x', 'y'] as const) {
        const aceleracion = k * (r.objetivo[eje] - r.pos[eje]) - c * r.vel[eje];
        r.vel[eje] += aceleracion * dt;
        r.pos[eje] += r.vel[eje] * dt;
      }
      aplicarTransform();

      const distancia = Math.hypot(r.objetivo.x - r.pos.x, r.objetivo.y - r.pos.y);
      const rapidez = Math.hypot(r.vel.x, r.vel.y);
      const asentada = distancia < 1 && rapidez < 15;

      if (r.fase === 'volviendo' && asentada) {
        r.pos = { x: 0, y: 0 };
        r.vel = { x: 0, y: 0 };
        cambiarFase('reposo');
        aplicarTransform();
        return;
      }
      if (r.fase === 'encajando' && asentada) {
        // El transform queda puesto sobre el slot: quien consume la pieza la
        // oculta o re-renderiza en alEncajado.
        const slot = r.slotDestino;
        r.vel = { x: 0, y: 0 };
        cambiarFase('reposo');
        if (slot) alEncajado?.(slot);
        return;
      }
      r.rafId = requestAnimationFrame(cuadro);
    },
    [r, aplicarTransform, cambiarFase, alEncajado],
  );

  const animar = useCallback(() => {
    cancelAnimationFrame(r.rafId);
    r.ultimoTiempo = performance.now();
    r.rafId = requestAnimationFrame(paso);
  }, [r, paso]);

  const alPointerDown = useCallback(
    (evento: PointerEventReact<HTMLElement>) => {
      // Se puede agarrar en reposo o al vuelo mientras vuelve al origen;
      // nunca mientras encaja o si otro puntero ya la tiene.
      if (deshabilitada || (r.fase !== 'reposo' && r.fase !== 'volviendo')) return;
      // Sin esto, toques rápidos repetidos disparan la selección nativa del
      // navegador y el arrastre muere en pointercancel.
      evento.preventDefault();
      const el = evento.currentTarget;
      el.setPointerCapture(evento.pointerId);
      r.el = el;
      // El rect actual incluye el transform vigente (pos): descontarlo
      // recupera el origen de layout aunque la pieza esté en movimiento.
      const rect = el.getBoundingClientRect();
      r.rectInicial = new DOMRect(rect.x - r.pos.x, rect.y - r.pos.y, rect.width, rect.height);
      r.punteroInicial = { x: evento.clientX - r.pos.x, y: evento.clientY - r.pos.y };
      r.objetivo = { x: r.pos.x, y: r.pos.y };
      cambiarFase('agarrada');
      aplicarTransform();
      emitir({ tipo: 'pieza_agarrada' });
      animar();
    },
    [deshabilitada, r, cambiarFase, aplicarTransform, emitir, animar],
  );

  const alPointerMove = useCallback(
    (evento: PointerEventReact<HTMLElement>) => {
      if (r.fase !== 'agarrada' && r.fase !== 'arrastrando') return;
      r.objetivo = {
        x: evento.clientX - r.punteroInicial.x,
        y: evento.clientY - r.punteroInicial.y,
      };
      if (r.fase === 'agarrada') cambiarFase('arrastrando');
    },
    [r, cambiarFase],
  );

  const soltar = useCallback(
    (cancelada: boolean) => {
      if (r.fase !== 'agarrada' && r.fase !== 'arrastrando') return;
      const rect = r.rectInicial;
      const centro: Punto = rect
        ? { x: rect.left + rect.width / 2 + r.pos.x, y: rect.top + rect.height / 2 + r.pos.y }
        : { x: 0, y: 0 };
      const slotId = cancelada ? null : slotMasCercano(centro, radioIman);
      const resultado = cancelada ? 'fuera' : alSoltar(slotId);

      if (resultado === 'ok' && slotId !== null) {
        const slotEl = slots.get(slotId);
        if (slotEl && rect) {
          const destino = slotEl.getBoundingClientRect();
          r.objetivo = {
            x: destino.left + destino.width / 2 - (rect.left + rect.width / 2),
            y: destino.top + destino.height / 2 - (rect.top + rect.height / 2),
          };
        }
        r.slotDestino = slotId;
        cambiarFase('encajando');
        emitir({ tipo: 'pieza_soltada_ok' });
      } else {
        r.objetivo = { x: 0, y: 0 };
        r.slotDestino = null;
        cambiarFase('volviendo');
        emitir({ tipo: 'pieza_soltada_fuera' });
      }
      animar();
    },
    [r, radioIman, alSoltar, cambiarFase, emitir, animar],
  );

  const alPointerUp = useCallback(() => soltar(false), [soltar]);
  const alPointerCancel = useCallback(() => soltar(true), [soltar]);

  useEffect(() => {
    return () => cancelAnimationFrame(r.rafId);
  }, [r]);

  return {
    fase,
    // Para esparcir sobre el elemento de la pieza. touch-action: none permite
    // arrastrar con el dedo sin que el navegador scrollee.
    props: {
      onPointerDown: alPointerDown,
      onPointerMove: alPointerMove,
      onPointerUp: alPointerUp,
      onPointerCancel: alPointerCancel,
      style: { touchAction: 'none' as const },
    },
  };
}
