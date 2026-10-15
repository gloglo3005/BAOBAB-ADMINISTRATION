import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Port 5173 : autorisé par défaut dans CORS_ALLOWED_ORIGINS du backend.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
