// Orquestación: mapa ↔ nivel, progreso persistido, sonido y mascota.
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
import type { Nivel, Progreso } from './engine';
import { nivelesMultiplicacion } from './data/multiplicacion';
import { conectarSonidos } from './components/sonidos';
import Mascota from './components/Mascota';
import MapaMundo from './components/MapaMundo';
import PantallaNivel from './worlds/multiplicacion/PantallaNivel';
import './App.css';

type Pantalla = { vista: 'mapa' } | { vista: 'nivel'; nivel: Nivel };

export default function App() {
  const [progreso, setProgreso] = useState<Progreso>(() => cargarProgreso());
  const [pantalla, setPantalla] = useState<Pantalla>({ vista: 'mapa' });

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
        nivelesMultiplicacion,
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

  const proximo = siguienteNivel(nivelesMultiplicacion, progreso);

  return (
    <main className="juego">
      <button type="button" className="boton-redondo boton-sonido" onClick={alternarSonido}>
        {progreso.sonidoActivado ? '🔊' : '🔇'}
      </button>

      {pantalla.vista === 'mapa' ? (
        <MapaMundo
          niveles={nivelesMultiplicacion}
          progreso={progreso}
          alElegir={(nivel) => setPantalla({ vista: 'nivel', nivel })}
        />
      ) : (
        <PantallaNivel
          key={pantalla.nivel.id}
          nivel={pantalla.nivel}
          alVolver={() => setPantalla({ vista: 'mapa' })}
          alSiguiente={
            proximo ? () => setPantalla({ vista: 'nivel', nivel: proximo }) : null
          }
        />
      )}

      <Mascota />
    </main>
  );
}
