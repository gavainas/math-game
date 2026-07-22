import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: la app funciona igual servida desde la raíz o desde
  // /math-game/ en GitHub Pages.
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
