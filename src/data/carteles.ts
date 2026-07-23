// Explicaciones de Benja por mecánica: se muestran solas la primera vez y
// quedan siempre disponibles desde el botón de ayuda con su cara en cada
// nivel. Excepción pedida por el autor a la regla "sin texto instructivo"
// (GAMEFEEL.md 12): frases cortas, rioplatenses, salteables con un toque.

import type { Nivel } from '../engine/tipos';
import { caracteristicasNivel } from './multiplicacion';
import { caracteristicasFracciones } from './fracciones';

export type Explicacion = { clave: string; texto: string };

export function explicacionDeNivel(nivel: Nivel): Explicacion {
  if (nivel.tipo === 'grilla') {
    const objetivo = nivel.objetivo;
    if (objetivo.modo === 'predecir') {
      return {
        clave: 'grilla-predecir',
        texto: '¿Cuántos brotes hay? Llevá el número a la caja.',
      };
    }
    if (objetivo.modo === 'total') {
      return {
        clave: 'grilla-total',
        texto: 'Armá UN rectángulo que tenga justo ese número. ¡Hay varias formas!',
      };
    }
    return caracteristicasNivel(nivel.id).campoLibre
      ? {
          clave: 'grilla-campo',
          texto: 'Mirá la consigna: ¡plantá esos grupos TODOS JUNTOS, armando un rectángulo!',
        }
      : { clave: 'grilla-slots', texto: '¡Arrastrá los brotes hasta los casilleros!' };
  }
  if (nivel.tipo === 'reparto') {
    const objetivo = nivel.objetivo;
    if (objetivo.modo === 'predecir') {
      return {
        clave: 'reparto-predecir',
        texto: '¿Cuánto le toca a cada uno? Llevá el número a la caja.',
      };
    }
    if (objetivo.modo === 'amigos') {
      return {
        clave: 'reparto-amigos',
        texto: 'Cada amigo quiere esa cantidad. ¿Cuántos entran? Sumalos con el +.',
      };
    }
    return {
      clave: 'reparto-repartir',
      texto: 'Tocá un amigo para darle una manzana. ¡Repartí parejo! Si sobra, se queda al costado.',
    };
  }
  if (nivel.tipo === 'corte') {
    const objetivo = nivel.objetivo;
    if (objetivo.modo === 'deCantidad') {
      return {
        clave: 'corte-cantidad',
        texto: '¿Cuánto es esa fracción de las manzanas? Llevá el número a la caja.',
      };
    }
    if (objetivo.modo === 'sombrear') {
      return caracteristicasFracciones(nivel.id).mostrarNotacion
        ? {
            clave: 'corte-notacion',
            texto: 'El de abajo dice en cuántas partes cortar; el de arriba, cuántas servir.',
          }
        : {
            clave: 'corte-sombrear',
            texto: 'Mirá el pedido: cortá igual y tocá las porciones para servirlas como él quiere.',
          };
    }
    return {
      clave: 'corte-cortar',
      texto: 'El cliente pide esa pizza: cortá la tuya igual. 🔪 corta, ↩️ deshace.',
    };
  }
  if (nivel.tipo === 'balanza') {
    const terminos = [...nivel.objetivo.izquierda, ...nivel.objetivo.derecha];
    const cofres = terminos.filter((t) => t.clase === 'incognita').length;
    if (terminos.some((t) => t.clase === 'objeto')) {
      return {
        clave: 'balanza-objetos',
        texto: 'Llevá al otro plato algo que esté en los DOS: ¡se van juntos! Dejá el cofre solo.',
      };
    }
    if (cofres > 1) {
      return {
        clave: 'balanza-cofres',
        texto: 'Primero sacá los números sueltos. Cofres solos: tocalos y se reparten lo del otro plato.',
      };
    }
    return {
      clave: 'balanza-numeros',
      texto: 'Llevá un número al otro plato: se resta. ¡Dejá el cofre solo!',
    };
  }
  return { clave: `otro-${nivel.tipo}`, texto: '¡Jugá y descubrí!' };
}
