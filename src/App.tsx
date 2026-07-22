// Orquestación: mundos ↔ mapa ↔ nivel, progreso persistido, sonido y mascota.
// El engine emite eventos por el bus; acá solo se decide qué pantalla se ve
// y se guarda el progreso en cada puzzle_resuelto (GAMEFEEL.md 11.3).

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  cargarProgreso,
  completarNivel,
  guardarProgreso,
  nivelesDeMundo,
} from './engine';
import type { Mundo, Nivel, Progreso } from './engine';
import { nivelesMultiplicacion } from './data/multiplicacion';
import { nivelesDivision } from './data/division';
import { nivelesEcuaciones } from './data/ecuaciones';
import { conectarSonidos } from './components/sonidos';
import Mascota from './components/Mascota';
import MapaMundo from './components/MapaMundo';
import SelectorMundos from './components/SelectorMundos';
import PantallaNivel from './worlds/multiplicacion/PantallaNivel';
import PantallaReparto from './worlds/division/PantallaReparto';
import PantallaBalanza from './worlds/ecuaciones/PantallaBalanza';
import './App.css';

const TODOS_LOS_NIVELES: Nivel[] = [
  ...nivelesMultiplicacion,
  ...nivelesDivision,
  ...nivelesEcuaciones,
];

type Pantalla =
  | { vista: 'mundos' }
  | { vista: 'mapa'; mundo: Mundo }
  | { vista: 'nivel'; nivel: Nivel };

// ?probar en la URL desbloquea todos los niveles para revisarlos (modo padre).
const MODO_PRUEBA = new URLSearchParams(window.location.search).has('probar');

export default function App() {
  const [progreso, setProgreso] = useState<Progreso>(() => cargarProgreso());
  const [pantalla, setPantalla] = useState<Pantalla>({ vista: 'mundos' });

  const progresoRef = useRef(progreso);
  progresoRef.current = progreso;
  const pantallaRef = useRef(pantalla);
  pantallaRef.current = pantalla;

  useEffect(() => conectarSonidos(busJuego, () => progresoRef.current.sonidoActivado), []);

  useEffect(() => {
    return busJuego.escuchar((evento) => {
      if (evento.tipo !== 'puzzle_resuelto') return;
      const actual = pantallaRef.current;
      if (actual.vista !== 'nivel') return;
      const nuevo = completarNivel(
        TODOS_LOS_NIVELES,
        progresoRef.current,
        actual.nivel.id,
        evento.estrellas,
      );
      guardarProgreso(nuevo);
      setProgreso(nuevo);
    });
  }, []);

  const alternarSonido = () => {
    const nuevo = { ...progreso, sonidoActivado: !progreso.sonidoActivado };
    guardarProgreso(nuevo);
    setProgreso(nuevo);
  };

  // El botón ➜ del final de nivel avanza dentro del mismo mundo.
  const siguienteEnMundo = (mundo: Mundo): Nivel | null =>
    nivelesDeMundo(TODOS_LOS_NIVELES, mundo).find(
      (nivel) => !progreso.nivelesCompletados[nivel.id],
    ) ?? null;
  const abrirNivel = (nivel: Nivel) => setPantalla({ vista: 'nivel', nivel });

  return (
    <main className="juego">
      <button type="button" className="boton-redondo boton-sonido" onClick={alternarSonido}>
        {progreso.sonidoActivado ? '🔊' : '🔇'}
      </button>

      {pantalla.vista === 'mundos' && (
        <SelectorMundos
          niveles={TODOS_LOS_NIVELES}
          progreso={progreso}
          modoPrueba={MODO_PRUEBA}
          alElegir={(mundo) => setPantalla({ vista: 'mapa', mundo })}
        />
      )}

      {pantalla.vista === 'mapa' && (
        <MapaMundo
          niveles={TODOS_LOS_NIVELES}
          mundo={pantalla.mundo}
          progreso={progreso}
          modoPrueba={MODO_PRUEBA}
          alElegir={abrirNivel}
          alVolver={() => setPantalla({ vista: 'mundos' })}
        />
      )}

      {pantalla.vista === 'nivel' &&
        (() => {
          const { nivel } = pantalla;
          const proximo = siguienteEnMundo(nivel.mundo);
          const props = {
            nivel,
            alVolver: () => setPantalla({ vista: 'mapa', mundo: nivel.mundo }),
            alSiguiente: proximo ? () => abrirNivel(proximo) : null,
          };
          if (nivel.tipo === 'reparto') return <PantallaReparto key={nivel.id} {...props} />;
          if (nivel.tipo === 'balanza') return <PantallaBalanza key={nivel.id} {...props} />;
          return <PantallaNivel key={nivel.id} {...props} />;
        })()}

      <Mascota />
    </main>
  );
}
