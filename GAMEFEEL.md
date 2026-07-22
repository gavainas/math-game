# GAMEFEEL.md: Capa de diversión, feedback y spec de implementación

Complementa a `DESIGN.md` (pedagogía y estructura de mundos). Este documento define POR QUÉ el juego es divertido y CÓMO se implementa esa diversión. Si algo de acá contradice a DESIGN.md, gana DESIGN.md en lo pedagógico y gana este doc en lo sensorial.

## 1. Principio rector

Cada toque devuelve algo. Si una interacción no tiene respuesta visual y sonora en menos de 100ms, está rota. El jugador nunca duda si el juego "lo escuchó".

## 2. Motor de deseo (por qué Benja vuelve mañana)

DragonBox funciona porque alimentás algo que crece. Acá el equivalente:

- **La mascota come lo que producís.** Cada mundo produce comida al resolver: plantines (M1), frutas (M2), pizza/chocolate (M3), tesoro brillante (M4). Al resolver un nivel, la cosecha vuela a la boca de la mascota.
- **La mascota evoluciona.** 5 etapas visuales (0 a 4). Sube por niveles completados, no por estrellas. La evolución NO se anuncia antes: es sorpresa. Es el gancho principal de retención.
- **Álbum de stickers.** Un álbum por mundo, visible desde el mapa. Se ganan por hitos, no por nivel (ver sección 5).
- **Secretos.** Cada mundo esconde 2 o 3 interacciones ocultas (ej: tocar 5 veces una fruta) que dan sticker sorpresa. Enseñan a experimentar, que es exactamente la habilidad que el juego quiere entrenar.

## 3. Core loop emocional

1. Resolver puzzle (30 seg a 2 min)
2. La cosecha vuela a la mascota, come y reacciona (1.5 a 2 seg, salteable con un toque)
3. Barra de evolución sube un tick (visible, sutil)
4. Cada 4 o 5 niveles: recompensa grande (sticker, evolución o nivel especial)

Regla: recompensas chicas siempre, recompensas grandes espaciadas. Nunca un popup por nivel.

## 4. Momentos memorables: niveles boss

Cada mundo cierra con un boss. No introduce nada nuevo: combina todo lo del mundo con presentación distinta (pantalla propia, música propia, escala mayor). Sin game over posible.

| Mundo | Boss | Mecánica |
|---|---|---|
| M1 | La Gran Cosecha | Armar 3 grillas seguidas mientras un pájaro intenta robar plantines. El pájaro nunca hace perder: solo afecta estrellas. |
| M2 | El Picnic Gigante | Repartir una montaña de frutas entre muchos amigos, con resto, y decidir dónde va lo que sobra. |
| M3 | La Pizzería Loca | Clientes piden fracciones (pedido 100% visual, sin texto) y hay que cortar y servir la porción justa. |
| M4 | El Cofre Final | Ecuación combinada gigante. Al abrir el cofre: lluvia de tesoro y evolución final de la mascota. |

## 5. Economía de recompensas

- **Estrellas por nivel** (ya definido en DESIGN.md): 3 = sin pistas, 1 = con pista. Sirven para replay. NUNCA bloquean progreso.
- **Stickers**: por completar boss, por 3 estrellas en 5 niveles del mismo mundo, por encontrar un secreto. Aproximadamente 8 a 10 stickers por mundo.
- **Evolución de mascota**: etapa 1 al terminar M1, etapa 2 al terminar M2, etapa 3 al terminar M3, etapa 4 al terminar el boss final. Etapa 0 es la inicial.

## 6. Juice: spec por interacción

Esta tabla es la parte más importante del documento para el programador.

| Interacción | Visual | Sonido | Timing |
|---|---|---|---|
| Agarrar pieza | Escala a 1.1x, sombra aparece debajo | "Pop" suave | Inmediato (<50ms) |
| Arrastrar | La pieza sigue el dedo con lag elástico (spring suave) | Silencio | Continuo |
| Soltar en lugar válido | Snap magnético al slot + squash & stretch | "Click" grave y satisfactorio | <80ms |
| Soltar en lugar inválido | La pieza vuelve flotando al origen, no desaparece | "Boing" grave neutro (NO sonido de error) | 300ms |
| Progreso parcial (fila completa, amigo servido, corte hecho) | Brillo breve en lo completado | Nota corta ascendente | 200ms |
| Puzzle resuelto | Onda de luz recorre las piezas + confetti mínimo | Acorde ascendente (el mismo en los 4 mundos) | 600ms |
| Nivel resuelto | Cosecha vuela a la mascota, mascota come | Animación sonora propia de la mascota | 1.5 a 2 seg, salteable |
| 3 intentos iguales fallidos | El lugar correcto pulsa suave (pista visual) | Silencio | Se activa solo |
| Inactividad 30 seg | Mascota se rasca la cabeza y mira el puzzle | Silencio | Se activa solo |

Reglas duras:
- No existe la X roja, el color rojo de error ni el sonido de fallo. Un intento que no resuelve es un estado, no un castigo.
- El acorde de acierto es idéntico en los 4 mundos: es la firma sonora del juego.

## 7. Mascota: máquina de estados

La mascota es el canal de feedback principal porque no hay texto. Nombre y diseño visual se definen en Higgsfield (character reference para consistencia entre etapas y mundos).

| Estado | Trigger | Comportamiento |
|---|---|---|
| idle | Default | Parpadea, respira, mira el puzzle |
| curiosa | Jugador agarra una pieza | Sigue la pieza con la mirada |
| festejo | Progreso parcial | Saltito corto, sin interrumpir |
| hambrienta | Puzzle resuelto | Abre la boca, espera la comida |
| comiendo | Cosecha llega | Come, se relame, reacción única por mundo |
| pensativa | 30 seg sin input | Se rasca la cabeza. NO señala la respuesta |
| dormida | 60+ seg sin input | Ronca. Tocarla la despierta con sobresalto gracioso |

Regla absoluta: la mascota nunca muestra frustración, decepción ni apuro. Para ella el error no existe.

## 8. Humor (spec concreta, no "que sea gracioso")

- Micro-personalidad en objetos: frutas que se ríen al tocarlas, plantines que estornudan tierra al brotar, monedas que giran si las tocás.
- **El resto de la división es un personaje.** La fruta que sobra hace puchero 1 segundo, después se encoge de hombros y se sienta al costado. Normaliza el concepto de resto: no es un error, es alguien que quedó afuera esta vez.
- Toques inútiles con premio: la balanza vacía se hamaca si la tocás, tocar 5 veces a la mascota la marea (ojos en espiral 1 seg). Algunos de estos son los secretos de la sección 2.

## 9. Sonido

- Sin música de fondo constante: cansa en sesiones de 15 min y compite con la concentración. Ambiente suave por mundo (pájaros en el jardín, murmullo de picnic, horno de pizzería, cueva con eco).
- Familia de sonidos propia por mundo, pero el acorde de acierto es compartido.
- Todos los efectos duran menos de 1 seg, salvo música de boss.
- Botón de mute global siempre visible (para padres).

## 10. Anti-aburrimiento estructural

- **Niveles espejo**: cada tanto se invierte la pregunta. En vez de "armá la grilla y descubrí el total", "acá está el total, armá una grilla que lo produzca". Mismo motor, sensación de nivel nuevo.
- **Sandbox desbloqueable**: al terminar un mundo se abre un modo libre de 1 a 2 min con las piezas de ese mundo, sin objetivo. Los chicos lo usan para mostrar lo que saben.
- **Cierre de sesión amable**: después de 6 a 8 niveles seguidos, la mascota bosteza y se estira. No bloquea nada, solo sugiere. Respeta la sesión de 10 a 15 min y es un buen mensaje para los padres.
- La repetición espaciada silenciosa ya está definida en DESIGN.md sección 7 y se mantiene tal cual.

## 11. Especificación técnica para Claude Code

### 11.1 Schema de nivel

```ts
type Mundo = 'multiplicacion' | 'division' | 'fracciones' | 'ecuaciones';

type TipoNivel = 'grilla' | 'reparto' | 'corte' | 'balanza' | 'boss' | 'sandbox';

type Nivel = {
  id: string;                  // "m1-n03"
  mundo: Mundo;
  tipo: TipoNivel;
  objetivo: ObjetivoNivel;     // datos del puzzle: filas/columnas, cantidad/amigos, partes/sombreadas, ecuacion
  esRepaso?: boolean;          // nivel viejo reinsertado (repetición espaciada)
  esEspejo?: boolean;          // pregunta invertida (sección 10)
  introduceNotacion?: boolean; // primera aparición de ×, ÷ o a/b en este nivel
  pistas: Pista[];             // pistas progresivas, en orden
  recompensas?: { stickerId?: string };
};
```

`ObjetivoNivel` es una unión discriminada por `tipo`. Los niveles viven en `/src/data` como TS tipado, no JSON suelto: el compilador valida la data.

### 11.2 Sistema de eventos de feedback

El engine emite eventos y la capa de presentación (animación, sonido, mascota) los consume. Así el juice se ajusta sin tocar lógica de juego, y viceversa.

```ts
type EventoJuego =
  | { tipo: 'pieza_agarrada' }
  | { tipo: 'pieza_soltada_ok' }
  | { tipo: 'pieza_soltada_fuera' }
  | { tipo: 'progreso_parcial' }      // fila completa, amigo servido, corte hecho
  | { tipo: 'puzzle_resuelto'; estrellas: 1 | 2 | 3 }
  | { tipo: 'intentos_repetidos' }    // 3 intentos iguales: dispara pista visual
  | { tipo: 'inactividad'; segundos: 30 | 60 }
  | { tipo: 'secreto_encontrado'; secretoId: string };
```

La mascota es un componente que escucha estos eventos y resuelve su propia máquina de estados (sección 7). Nadie le habla directo.

### 11.3 Estado persistido (LocalStorage)

```ts
type Progreso = {
  version: number;                     // para migraciones futuras
  mundoDesbloqueado: Mundo;
  nivelesCompletados: Record<string, { estrellas: 1 | 2 | 3 }>;
  stickers: string[];
  secretosEncontrados: string[];
  etapaMascota: 0 | 1 | 2 | 3 | 4;
  sonidoActivado: boolean;
};
```

Guardar en cada `puzzle_resuelto`. Una sola key en LocalStorage, serializada.

### 11.4 Orden de implementación del juice

1. **Drag & drop con spring y snap magnético.** Es el 70% del feel. Si esto no se siente rico, nada de lo demás importa.
2. Sistema de eventos + acorde de acierto + sonidos de pieza.
3. Mascota con 3 estados (idle, festejo, comiendo). Los otros 4 estados después.
4. Stickers, evolución y secretos.

### 11.5 Impacto en ROADMAP.md

El sistema de eventos (11.2) y el drag & drop (11.4 punto 1) van en el paso 1 del roadmap (motor genérico), NO al final con el arte. El motor sin feel no se puede testear con Benja de verdad: un juego con placeholder art pero buen feel se testea bien, uno con lógica perfecta y drag muerto no.

## 12. Anti-patterns (qué NO hacer)

- Nada de X roja, sonido de error ni la palabra "incorrecto" en ninguna forma.
- Nada de texto instructivo ("¡Ahora aprendé a dividir!"). Si un nivel necesita explicación, el nivel está mal diseñado.
- No interrumpir el flujo con popups de recompensa por nivel. Recompensa grande cada 4 o 5 niveles.
- Sin timer en contenido nuevo (ya definido en DESIGN.md, se repite acá porque es tentador romperlo en los boss: el boss presiona con un antagonista suave, nunca con reloj ni con derrota).
- Las estrellas nunca bloquean contenido.
- La mascota nunca da la respuesta. Pista máxima: el lugar correcto pulsa.
