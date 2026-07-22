// Benja, el guía del juego: sprites recortados de su character sheet real
// (src/assets/benja). Tres expresiones de busto y el cuerpo entero saludando.

import cuerpoImg from '../assets/benja/cuerpo.webp';
import felizImg from '../assets/benja/feliz.webp';
import piolaImg from '../assets/benja/piola.webp';
import sorpresaImg from '../assets/benja/sorpresa.webp';

export type ExpresionBenja = 'feliz' | 'piola' | 'sorpresa';

const CARAS: Record<ExpresionBenja, string> = {
  feliz: felizImg,
  piola: piolaImg,
  sorpresa: sorpresaImg,
};

type Props = {
  expresion?: ExpresionBenja;
  cuerpo?: boolean;
  ancho?: number;
};

export default function Benja({ expresion = 'feliz', cuerpo = false, ancho = 96 }: Props) {
  return (
    <img
      src={cuerpo ? cuerpoImg : CARAS[expresion]}
      width={ancho}
      alt=""
      draggable={false}
      style={{ height: 'auto', display: 'block' }}
    />
  );
}
