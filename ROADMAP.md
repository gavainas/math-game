# ROADMAP.md: Orden de construcción

Derivado de DESIGN.md sección 11, ajustado por GAMEFEEL.md 11.5: el sistema de
eventos de feedback y el drag & drop con spring/snap van en el paso 1 (motor
genérico), NO al final con el arte. Un juego con arte placeholder pero buen feel
se testea bien; uno con lógica perfecta y drag muerto, no.

Regla de avance: no se arranca un paso hasta cerrar el anterior. Dentro de un
paso, el orden de sub-ítems es sugerido.

## Paso 1: Motor genérico de niveles (sin arte final)

- [x] Tipos base: `Mundo`, `TipoNivel`, `Nivel`, `ObjetivoNivel` como unión
      discriminada, `Pista` (GAMEFEEL.md 11.1). Niveles como TS tipado en `/src/data`.
- [x] Motor de validación de niveles y progresión (desbloqueo lineal de mundos,
      replay dentro del mundo, repetición espaciada, niveles espejo — DESIGN.md 7).
- [x] Guardado en LocalStorage: schema `Progreso` de GAMEFEEL.md 11.3, una sola
      key serializada, guardar en cada `puzzle_resuelto`, `version` para migraciones.
- [x] **Sistema de eventos de feedback** (GAMEFEEL.md 11.2): el engine emite
      `EventoJuego`, la presentación (animación, sonido, mascota) consume.
- [x] **Drag & drop con spring y snap magnético** (GAMEFEEL.md 11.4 punto 1 y
      tabla de juice sección 6): agarrar, arrastrar con lag elástico, snap al
      slot válido, vuelta flotante al origen si es inválido. Es el 70% del feel.
- [x] Detección de inactividad (30/60 seg) y de 3 intentos iguales, emitidas
      como eventos (`inactividad`, `intentos_repetidos`).

## Paso 2: Mundo 1 completo (Multiplicación), arte placeholder

- [ ] Los 7 tramos de progresión de DESIGN.md 3, una idea nueva por nivel.
      El símbolo × recién tras ~15 puzzles resueltos armando grillas.
      (26 niveles jugables con el ajuste de dificultad de DESIGN.md 3: campo
      libre, factoreo y predicción; falta el tramo 7: factor de 2 dígitos.)
      Modo prueba para padres: agregar `?probar` a la URL desbloquea todo.
- [x] Sonidos: acorde de acierto compartido + sonidos de pieza (GAMEFEEL.md 11.4
      punto 2), botón de mute global persistido.
- [x] Mascota con 3 estados: idle, festejo, comiendo (GAMEFEEL.md 11.4 punto 3);
      escucha eventos, nadie le habla directo.
- [x] Mapa camino del mundo y estrellas por nivel. (La pista automática por
      intentos repetidos funciona; pistas explícitas progresivas pendientes.)
- [ ] Boss "La Gran Cosecha" (GAMEFEEL.md 4) y sandbox desbloqueable.

## Paso 3: Testear con Benja

- [ ] Sesiones reales de 10-15 min; ajustar dificultad, ritmo y pistas antes de
      seguir. Lo que se aprenda acá corrige el motor y el Mundo 1.

## Paso 4: Mundo 2 (División), reusando componentes de Mundo 1

- [x] Reparto justo con resto visible (tocar da/devuelve frutas), espejo de
      amigos ("cada uno recibe C, ¿cuántos entran?") y predicción de cocientes
      con distractores, incluidos los de 2 dígitos; ÷ desde mitad del mundo.
      Selector de mundos con desbloqueo lineal. (Pendiente: la animación de
      puchero del resto y la conexión visual con el tablero de M1 — DESIGN.md 4.3.)
- [ ] Stickers, evolución de mascota y secretos (GAMEFEEL.md 11.4 punto 4):
      etapa 1 al terminar M1 ya operativa, álbum visible desde el mapa.
- [ ] Boss "El Picnic Gigante".

## Paso 5: Mundo 3 (Fracciones), el más largo, ir despacio

- [ ] Doble de niveles chicos que los otros mundos (DESIGN.md 5); sin
      denominadores distintos ni fracciones impropias (quedan para v2).
- [ ] Estados restantes de la mascota: curiosa, hambrienta, pensativa, dormida.
- [ ] Boss "La Pizzería Loca".

## Paso 6: Mundo 4 (Ecuaciones)

- [x] Balanza mágica, de dibujos a notación real (DESIGN.md 6): quitar en
      espejo, restar números, repartir cofres (2x = 10 usa el Mundo 2) y
      combinadas (2x + 3 = 11) con la ecuación simplificándose en vivo.
      Se adelantó antes que Fracciones a pedido; el desbloqueo saltea los
      mundos no construidos.
- [ ] Boss "El Cofre Final" + evolución final de la mascota (etapa 4).

## Paso 7: Arte final + mascota (Higgsfield / Claude Design)

- [ ] Recién con la mecánica validada: mascota con character reference, íconos
      y fondos por mundo, paletas de DESIGN.md 9. Reemplaza placeholders sin
      tocar lógica (el sistema de eventos lo garantiza).
