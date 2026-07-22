// Schema de nivel (GAMEFEEL.md 11.1) y estado persistido (GAMEFEEL.md 11.3).

export type Mundo = 'multiplicacion' | 'division' | 'fracciones' | 'ecuaciones';

export const ORDEN_MUNDOS: readonly Mundo[] = [
  'multiplicacion',
  'division',
  'fracciones',
  'ecuaciones',
];

export type TipoNivel = 'grilla' | 'reparto' | 'corte' | 'balanza' | 'boss' | 'sandbox';

// Pista máxima permitida: señalar un lugar con un pulso suave.
// La mascota nunca da la respuesta (GAMEFEEL.md 6 y 12).
export type Pista =
  | { tipo: 'pulso_lugar'; lugarId: string }
  | { tipo: 'resaltar_pieza'; piezaId: string };

// --- Objetivos por tipo de nivel (unión discriminada por `tipo`) ---

export type ObjetivoGrilla =
  | { tipo: 'grilla'; modo: 'armar'; filas: number; columnas: number }
  // Nivel espejo: dado el total, armar cualquier grilla que lo produzca.
  | { tipo: 'grilla'; modo: 'total'; total: number };

export type ObjetivoReparto =
  | { tipo: 'reparto'; modo: 'repartir'; cantidad: number; amigos: number }
  // Nivel espejo: ¿cuántos amigos si cada uno recibe `porAmigo`?
  | { tipo: 'reparto'; modo: 'amigos'; cantidad: number; porAmigo: number };

export type ObjetivoCorte =
  | { tipo: 'corte'; modo: 'cortar'; partes: number }
  | { tipo: 'corte'; modo: 'sombrear'; partes: number; sombreadas: number };

export type TerminoBalanza =
  | { clase: 'objeto'; icono: string }
  | { clase: 'numero'; valor: number }
  | { clase: 'incognita' };

export type ObjetivoBalanza = {
  tipo: 'balanza';
  izquierda: TerminoBalanza[];
  derecha: TerminoBalanza[];
};

export type ObjetivoJugable =
  | ObjetivoGrilla
  | ObjetivoReparto
  | ObjetivoCorte
  | ObjetivoBalanza;

export type ObjetivoBoss = { tipo: 'boss'; rondas: ObjetivoJugable[] };
export type ObjetivoSandbox = { tipo: 'sandbox' };

export type ObjetivoNivel = ObjetivoJugable | ObjetivoBoss | ObjetivoSandbox;

// --- Nivel ---

type NivelBase = {
  id: string; // "m1-n03"
  mundo: Mundo;
  esRepaso?: boolean; // nivel viejo reinsertado (repetición espaciada, DESIGN.md 7)
  esEspejo?: boolean; // pregunta invertida (GAMEFEEL.md 10)
  introduceNotacion?: boolean; // primera aparición de ×, ÷ o a/b en este nivel
  pistas: Pista[]; // pistas progresivas, en orden
  recompensas?: { stickerId?: string };
};

// `tipo` y `objetivo` van atados para que el compilador rechace combinaciones imposibles.
export type Nivel = NivelBase &
  (
    | { tipo: 'grilla'; objetivo: ObjetivoGrilla }
    | { tipo: 'reparto'; objetivo: ObjetivoReparto }
    | { tipo: 'corte'; objetivo: ObjetivoCorte }
    | { tipo: 'balanza'; objetivo: ObjetivoBalanza }
    | { tipo: 'boss'; objetivo: ObjetivoBoss }
    | { tipo: 'sandbox'; objetivo: ObjetivoSandbox }
  );

// --- Progreso persistido (GAMEFEEL.md 11.3) ---

export type Estrellas = 1 | 2 | 3;
export type EtapaMascota = 0 | 1 | 2 | 3 | 4;

export type Progreso = {
  version: number; // para migraciones futuras
  mundoDesbloqueado: Mundo;
  nivelesCompletados: Record<string, { estrellas: Estrellas }>;
  stickers: string[];
  secretosEncontrados: string[];
  etapaMascota: EtapaMascota;
  sonidoActivado: boolean;
};
