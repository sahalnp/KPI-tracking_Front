import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",

    // ✅ Allow your frontend’s Render host so it won’t be blocked
    allowedHosts: [
      "kpi-tracking-front.onrender.com", // your frontend domain
    ],

    // ✅ Proxy (only used in local dev)
    proxy: {
      "/api": {
        target: "http://localhost:3000", // local backend
        changeOrigin: true,
        secure: false,
      },
    },
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
