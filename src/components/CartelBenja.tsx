// Cartel de Benja: la primera vez que aparece una mecánica, Benja la explica
// con una frase corta. Un toque en cualquier lado lo cierra y no vuelve.

import { useEffect, useRef } from 'react';
import Benja from './Benja';

type Props = {
  texto: string;
  alCerrar: () => void;
};

export default function CartelBenja({ texto, alCerrar }: Props) {
  // El primer segundo no cierra: evita que el click que abrió el nivel (o un
  // doble click) lo descarte antes de poder leerlo.
  const listo = useRef(false);
  useEffect(() => {
    const espera = setTimeout(() => {
      listo.current = true;
    }, 800);
    return () => clearTimeout(espera);
  }, []);
  return (
    <div
      className="cartel"
      onPointerDown={() => {
        if (listo.current) alCerrar();
      }}
    >
      <div className="cartel__tarjeta">
        <div className="cartel__benja">
          <Benja expresion="feliz" ancho={84} />
        </div>
        <div className="bocadillo cartel__bocadillo">{texto}</div>
        <span className="cartel__seguir">▶</span>
      </div>
    </div>
  );
}
