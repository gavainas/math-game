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
import { nivelesFracciones } from './data/fracciones';
import { nivelesEcuaciones } from './data/ecuaciones';
import { conectarSonidos } from './components/sonidos';
import { explicacionDeNivel } from './data/carteles';
import type { Explicacion } from './data/carteles';
import Mascota from './components/Mascota';
import MapaMundo from './components/MapaMundo';
import SelectorMundos from './components/SelectorMundos';
import IntroBenja from './components/IntroBenja';
import CartelBenja from './components/CartelBenja';
import PantallaNivel from './worlds/multiplicacion/PantallaNivel';
import PantallaReparto from './worlds/division/PantallaReparto';
import PantallaPizza from './worlds/fracciones/PantallaPizza';
import PantallaBalanza from './worlds/ecuaciones/PantallaBalanza';
import './App.css';

const TODOS_LOS_NIVELES: Nivel[] = [
  ...nivelesMultiplicacion,
  ...nivelesDivision,
  ...nivelesFracciones,
  ...nivelesEcuaciones,
];

type Pantalla =
  | { vista: 'intro' }
  | { vista: 'mundos' }
  | { vista: 'mapa'; mundo: Mundo }
  | { vista: 'nivel'; nivel: Nivel };

// Pedido del autor: todos los capítulos y niveles quedan siempre
// desbloqueados. Las estrellas y el progreso se siguen guardando igual.
const MODO_PRUEBA = true;

export default function App() {
  const [progreso, setProgreso] = useState<Progreso>(() => cargarProgreso());
  const [pantalla, setPantalla] = useState<Pantalla>({ vista: 'intro' });
  const [cartel, setCartel] = useState<Explicacion | null>(null);

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

  const abrirNivel = (nivel: Nivel) => {
    setPantalla({ vista: 'nivel', nivel });
    const explicacion = explicacionDeNivel(nivel);
    if (!(progreso.cartelesVistos ?? []).includes(explicacion.clave)) {
      setCartel(explicacion);
    }
  };

  // El botón con la cara de Benja en cada nivel reabre la explicación.
  const pedirAyuda = () => {
    if (pantalla.vista === 'nivel') setCartel(explicacionDeNivel(pantalla.nivel));
  };

  const cerrarCartel = () => {
    if (cartel !== null && !(progreso.cartelesVistos ?? []).includes(cartel.clave)) {
      const nuevo = {
        ...progreso,
        cartelesVistos: [...(progreso.cartelesVistos ?? []), cartel.clave],
      };
      guardarProgreso(nuevo);
      setProgreso(nuevo);
    }
    setCartel(null);
  };

  const terminarIntro = () => {
    const nuevo = { ...progreso, introVista: true };
    guardarProgreso(nuevo);
    setProgreso(nuevo);
    setPantalla({ vista: 'mundos' });
  };

  // Fondo según el mundo que se está mirando.
  const mundoActual: Mundo | null =
    pantalla.vista === 'mapa'
      ? pantalla.mundo
      : pantalla.vista === 'nivel'
        ? pantalla.nivel.mundo
        : null;

  useEffect(() => {
    document.body.className = mundoActual ? `fondo--${mundoActual}` : '';
    return () => {
      document.body.className = '';
    };
  }, [mundoActual]);

  return (
    <main className="juego">
      <button type="button" className="boton-redondo boton-sonido" onClick={alternarSonido}>
        {progreso.sonidoActivado ? '🔊' : '🔇'}
      </button>

      {pantalla.vista === 'intro' && <IntroBenja alEmpezar={terminarIntro} />}

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
            alAyuda: pedirAyuda,
          };
          if (nivel.tipo === 'reparto') return <PantallaReparto key={nivel.id} {...props} />;
          if (nivel.tipo === 'corte') return <PantallaPizza key={nivel.id} {...props} />;
          if (nivel.tipo === 'balanza') return <PantallaBalanza key={nivel.id} {...props} />;
          return <PantallaNivel key={nivel.id} {...props} />;
        })()}

      {pantalla.vista === 'nivel' && cartel !== null && (
        <CartelBenja texto={cartel.texto} alCerrar={cerrarCartel} />
      )}

      {pantalla.vista !== 'intro' && <Mascota etapa={progreso.etapaMascota} />}
    </main>
  );
}
