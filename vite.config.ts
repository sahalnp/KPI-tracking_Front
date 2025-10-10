import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import * as path from "path"

export default defineConfig({
  server:{
    proxy: {
      // Proxy API calls during dev to avoid CORS and mixed content
      '/api': {
        target: import.meta.env.VITE_API_BASE_URL,
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
