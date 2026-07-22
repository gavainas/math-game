# CLAUDE.md

Índice del proyecto **mate-game**: juego educativo de matemáticas estilo DragonBox
para un chico de 8-9 años. Sin texto instructivo: se aprende manipulando.

## Reglas de shell (Windows)

- El entorno de desarrollo local es Windows con PowerShell: no asumir bash.
- Encadenar comandos con `;`, nunca con `&&` (falla en PowerShell 5.x).
- No usar `rm -rf`, `cp`, `mv`, `touch`: usar `Remove-Item -Recurse -Force`,
  `Copy-Item`, `Move-Item`, `New-Item`.
- Rutas con `/` funcionan en Node/Vite; no hardcodear `\` en código ni scripts.
- Scripts npm siempre multiplataforma (nada que dependa de sintaxis de un shell).

## Stack

- **React 19 + TypeScript + Vite** (template react-ts), sin backend.
- **Persistencia:** solo LocalStorage, una sola key serializada,
  con el schema `Progreso` de GAMEFEEL.md 11.3.
- **Niveles:** data tipada en TS dentro de `/src/data` (no JSON suelto).
- Comandos: `npm run dev` | `npm run build` (tsc + vite) | `npm run lint` (oxlint).

## Estructura (DESIGN.md sección 10)

```
/src
  /worlds        multiplicacion | division | fracciones | ecuaciones
  /components    compartidos (Balanza, Grilla, BarraFraccion, ...)
  /engine        validación de niveles, progresión, eventos, drag & drop
  /data          definición tipada de niveles por mundo
```

## Documentos (leer antes de tocar código)

| Doc | Qué define |
|---|---|
| `DESIGN.md` | Pedagogía, mundos, progresión, arquitectura. Manda en lo pedagógico. |
| `GAMEFEEL.md` | Juice, feedback, mascota, spec técnica. Manda en lo sensorial. |
| `ROADMAP.md` | Orden de construcción, paso a paso. |

Si se contradicen: DESIGN.md gana en lo pedagógico, GAMEFEEL.md en lo sensorial.

## Reglas fijas (no negociables)

1. **Sin backend.** Persistencia solo en LocalStorage (schema GAMEFEEL.md 11.3).
2. **UI casi sin texto.** El poco que haya, en español rioplatense.
3. **Prohibido el feedback punitivo de error:** nada de X roja, color rojo de
   error, sonido de fallo ni la palabra "incorrecto" (GAMEFEEL.md 6 y 12).
   Un intento que no resuelve es un estado, no un castigo.
4. **El engine emite eventos y la presentación los consume** (GAMEFEEL.md 11.2).
   La mascota solo escucha eventos: nadie le habla directo.

Este archivo es un índice, no documentación: el detalle vive en los docs de arriba.
