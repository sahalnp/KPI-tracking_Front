import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import * as path from "path"

export default defineConfig({
  server:{
    proxy: {
      host: '0.0.0.0',    
      '/api': {
        target:"https://kpi-tracking-back.vercel.app/api",
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
