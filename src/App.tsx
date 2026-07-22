// Orquestación: mundos ↔ mapa ↔ nivel, progreso persistido, sonido y mascota.
// El engine emite eventos por el bus; acá solo se decide qué pantalla se ve
// y se guarda el progreso en cada puzzle_resuelto (GAMEFEEL.md 11.3).

import { useEffect, useRef, useState } from 'react';
import {
  busJuego,
  cargarProgreso,
  completarNivel,
  guardarProgreso,
  siguienteNivel,
} from './engine';
import type { Mundo, Nivel, Progreso } from './engine';
import { nivelesMultiplicacion } from './data/multiplicacion';
import { nivelesDivision } from './data/division';
import { conectarSonidos } from './components/sonidos';
import Mascota from './components/Mascota';
import MapaMundo from './components/MapaMundo';
import SelectorMundos from './components/SelectorMundos';
import PantallaNivel from './worlds/multiplicacion/PantallaNivel';
import PantallaReparto from './worlds/division/PantallaReparto';
import './App.css';

const TODOS_LOS_NIVELES: Nivel[] = [...nivelesMultiplicacion, ...nivelesDivision];

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

  const proximo = siguienteNivel(TODOS_LOS_NIVELES, progreso);
  const abrirNivel = (nivel: Nivel) => setPantalla({ vista: 'nivel', nivel });

  return (
    <main className="juego">
      <button type="button" className="boton-redondo boton-sonido" onClick={alternarSonido}>
        {progreso.sonidoActivado ? '🔊' : '🔇'}
      </button>

      {pantalla.vista === 'mundos' && (
        <SelectorMundos
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
        (pantalla.nivel.tipo === 'reparto' ? (
          <PantallaReparto
            key={pantalla.nivel.id}
            nivel={pantalla.nivel}
            alVolver={() => setPantalla({ vista: 'mapa', mundo: pantalla.nivel.mundo })}
            alSiguiente={proximo ? () => abrirNivel(proximo) : null}
          />
        ) : (
          <PantallaNivel
            key={pantalla.nivel.id}
            nivel={pantalla.nivel}
            alVolver={() => setPantalla({ vista: 'mapa', mundo: pantalla.nivel.mundo })}
            alSiguiente={proximo ? () => abrirNivel(proximo) : null}
          />
        ))}

      <Mascota />
    </main>
  );
}
