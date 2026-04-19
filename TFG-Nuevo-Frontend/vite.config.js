import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../public/app",
    emptyOutDir: true,
  },
});