import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "kpi-tracking-front.onrender.com",
    ],
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});