import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import * as path from "path"

export default defineConfig({
  server:{
    host:true,
    proxy: {
      // Proxy API calls during dev to avoid CORS and mixed content
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
