import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      "/api": {
        target: "https://raulhp579-backgestorguardias.test",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "../public/app",
    emptyOutDir: true,
  },
});