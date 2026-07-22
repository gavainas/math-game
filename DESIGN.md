# DESIGN.md: Juego de Matemáticas (Multiplicación, División, Fracciones, Ecuaciones)

## 1. Concepto general

Juego educativo estilo DragonBox: **sin texto explicativo, sin instrucciones**. El jugador descubre la regla matemática manipulando objetos en pantalla. El feedback es inmediato y nunca punitivo (no hay "mal", solo estados que todavía no resuelven el puzzle).

- **Target:** Benja, 8-9 años (3°-4° grado), ya domina suma/resta
- **Plataforma:** Web app, React + TypeScript + Vite, sin backend (LocalStorage), mismo stack que basket-manager
- **Idioma:** Español rioplatense, mínimo texto en UI (íconos + color + animación llevan el peso comunicacional)
- **Sesión típica:** 10-15 min por sentada (atención de un chico de 8 años)

## 2. Estructura de Mundos

| Orden | Mundo | Mecánica core | Ícono/tema visual |
|---|---|---|---|
| 1 | Multiplicación | Arrays / grillas | Jardín de plantines en filas |
| 2 | División | Reparto justo | Repartir frutas entre amigos |
| 3 | Fracciones | Partes de un todo | Cortar pizzas/chocolates |
| 4 | Ecuaciones | Balanza mágica | Cofre del tesoro + balanza |

Se desbloquean en orden. División usa el mismo tablero visual que Multiplicación (flecha invertida) para reforzar que son operaciones inversas.

## 3. Mundo 1: Multiplicación (Array Garden)

**Mecánica:** el jugador arrastra fichas para armar una grilla de filas × columnas. El resultado se ve como área antes de mostrarse como número.

**Progresión de niveles:**
1. Armar grupos iguales sin contar (visual, tocar para agregar fila)
2. Reconocer "3 filas de 4" = mismo total que "4 filas de 3" (conmutatividad, sin nombrarla)
3. Introducir el número total (contador aparece solo cuando arma bien la grilla)
4. Tabla del 2, 5, 10 (patrones fáciles de ver)
5. Predecir el resultado antes de armar la grilla (drag de un número a un slot)
6. Notación ×: aparece el símbolo recién en nivel 6, nunca antes
7. Multiplicación con un factor de 2 dígitos (grilla se comprime en "paquetes de 10")

**Regla de oro:** el símbolo "×" y la palabra "multiplicar" no aparecen hasta que el chico ya resolvió ~15 puzzles armando grillas.

## 4. Mundo 2: División (Reparto Justo)

**Mecánica:** arrastrar una cantidad de objetos y repartirlos uno por uno entre N "amigos" en pantalla. Lo que sobra (resto) queda visualmente aislado, no desaparece.

**Progresión de niveles:**
1. Repartir sin resto (12 entre 3 amigos)
2. Repartir con resto visible ("no le tocó a nadie, se queda solito")
3. Conectar con Mundo 1: "¿cuántos amigos si cada uno recibe 4?" (división como inversa de multiplicación, mismo tablero)
4. Introducir el símbolo ÷ recién acá
5. División con resultado de 2 dígitos
6. Problemas simples con contexto (repartir figuritas, caramelos)

## 5. Mundo 3: Fracciones (Partes de un Todo)

Es el mundo más delicado, conviene el doble de niveles chicos que los otros mundos.

**Mecánica:** barras/círculos (pizza, chocolate) que se cortan en partes iguales arrastrando un cuchillo/línea divisoria.

**Progresión de niveles:**
1. Cortar un entero en 2, 3, 4 partes iguales (sin números, solo "partes")
2. Sombrear/comer partes → aparece la fracción visual (1 de 4 partes sombreadas)
3. Notación 1/4 aparece recién acá, ligada a lo que ya vio
4. Comparar fracciones arrastrando dos barras sobre una recta numérica (¿cuál es más grande, 1/2 o 1/4?)
5. Fracciones equivalentes: mismo pedazo, diferente corte (1/2 = 2/4), mostrado superponiendo barras
6. Sumar fracciones con mismo denominador (juntar pedazos de la misma pizza)
7. Fracción de una cantidad (1/2 de 8 caramelos)

**Evitar:** suma de fracciones con denominadores distintos y fracciones impropias: quedan para una v2, no corresponden a 3°-4° grado.

## 6. Mundo 4: Ecuaciones (Balanza Mágica)

Mecánica DragonBox clásica: una balanza que debe mantenerse equilibrada. Lo que se hace de un lado hay que hacerlo del otro.

**Progresión de niveles:**
1. Balanza con dibujos (dragón + caja = 5 manzanas), sin números ni letras
2. Sacar el mismo objeto de ambos lados para simplificar (regla de "quitar en espejo")
3. Los dibujos empiezan a convertirse en números conocidos
4. Aparece un "cofre cerrado" (la incógnita) que hay que dejar solo de un lado
5. Notación real: x + 3 = 8, resuelto tal como aprendió a despejar con dibujos
6. Ecuaciones con multiplicación: 2x = 10 (usa lo aprendido en Mundo 1)
7. Ecuaciones combinadas: 2x + 3 = 11

## 7. Sistema de progresión y refuerzo

- **Una idea nueva por nivel**, nunca dos conceptos nuevos juntos
- **Repetición espaciada silenciosa:** cada 4-5 niveles nuevos, un nivel "viejo" reaparece mezclado, sin avisar que es repaso
- **Sin vidas ni penalidad por error:** el puzzle simplemente no se resuelve hasta que la acción es correcta
- **Desbloqueo lineal** entre mundos, pero dentro de un mundo se puede rejugar cualquier nivel ya pasado
- **Sin timer** en niveles nuevos (mata la exploración); opcional modo "contrarreloj" en niveles ya dominados, para repaso rápido

## 8. Progreso y motivación (LocalStorage)

- Guardar: mundo actual, nivel actual, estrellas por nivel (3 estrellas = sin ayudas, 1 estrella = usó pista)
- Mapa visual tipo "camino" (como Candy Crush/Duolingo) en vez de menú de lista
- Mascota/personaje que acompaña y reacciona (sin texto, solo animación/sonido), bien pensado para generarlo en Higgsfield
- Sin login, sin backend: todo el progreso vive en el dispositivo

## 9. Estilo visual (para Claude Design / Higgsfield)

- Paleta cálida, alto contraste, formas redondeadas (no infantil-bebé, sino tipo Duolingo/Monument Valley liviano)
- Un mascota/guía recurrente entre los 4 mundos, para dar continuidad narrativa
- Cada mundo con paleta e iconografía propia (Multiplicación=verde/jardín, División=naranja/frutas, Fracciones=amarillo/postres, Ecuaciones=violeta/tesoro)
- Animaciones cortas de recompensa (1-2 seg) al resolver, sin interrumpir el flujo
- Assets a generar en Higgsfield: mascota (character reference para consistencia entre escenas), íconos de mundo, fondos de cada mundo
- Layout de niveles y UI general: Claude Design (consistencia de componentes, accesible en touch para tablet)

## 10. Arquitectura técnica (para Claude Code)

- **Stack:** React + TypeScript + Vite (mismo patrón que basket-manager)
- **Estado:** LocalStorage, sin backend
- **Estructura sugerida de carpetas:**
  ```
  /src
    /worlds
      /multiplicacion
      /division
      /fracciones
      /ecuaciones
    /components (compartidos: Balanza, Grilla, BarraFraccion, etc)
    /engine (lógica de validación de niveles, motor de progresión)
    /data (definición de niveles por mundo, JSON o TS)
  ```
- **Documentación a mantener (mismo patrón que basket-manager):**
  - `CLAUDE.md`: reglas de shell e índice de stack
  - `DESIGN.md`: este documento (decisiones de diseño)
  - `GAMEFEEL.md`: capa de diversión, feedback y spec de implementación
  - `ROADMAP.md`: orden de construcción, mundo por mundo

## 11. Roadmap sugerido de construcción

1. Motor genérico de niveles (validación, progresión, guardado), sin arte final. Incluye el sistema de eventos de feedback y el drag & drop con spring/snap (ver GAMEFEEL.md 11.5)
2. Mundo 1 completo (Multiplicación) end-to-end, con arte placeholder
3. Testear con Benja, ajustar dificultad real antes de seguir
4. Mundo 2 (División), reusando componentes de Mundo 1
5. Mundo 3 (Fracciones), el más largo, ir despacio
6. Mundo 4 (Ecuaciones)
7. Arte final + mascota (Higgsfield/Claude Design) una vez validada la mecánica
