import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: funciona en https://<usuario>.github.io/<repo>/ sin tocar nada
export default defineConfig({
  plugins: [react()],
  base: './',
})
