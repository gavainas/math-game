// Intro del juego: Benja de cuerpo entero saluda y da la bienvenida.
// Se muestra una sola vez (queda en el progreso guardado).

import Benja from './Benja';

type Props = {
  alEmpezar: () => void;
};

export default function IntroBenja({ alEmpezar }: Props) {
  return (
    <div className="intro">
      <div className="bocadillo intro__bocadillo">
        ¡Hola! Yo soy <strong>Benja</strong>.
        <br />
        ¡Bienvenido a mi juego!
      </div>
      <div className="intro__benja">
        <Benja expresion="feliz" cuerpo ancho={165} />
      </div>
      <button type="button" className="boton-redondo boton-redondo--principal intro__jugar" onClick={alEmpezar}>
        ▶
      </button>
    </div>
  );
}
