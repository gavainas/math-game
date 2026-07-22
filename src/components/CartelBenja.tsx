// Cartel de Benja: la primera vez que aparece una mecánica, Benja la explica
// con una frase corta. Un toque en cualquier lado lo cierra y no vuelve.

import Benja from './Benja';

type Props = {
  texto: string;
  alCerrar: () => void;
};

export default function CartelBenja({ texto, alCerrar }: Props) {
  return (
    <div className="cartel" onPointerDown={alCerrar}>
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
