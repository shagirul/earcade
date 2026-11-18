import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      input: {
        arcade: fileURLToPath(new URL("./index.html", import.meta.url)),
        synthLab: fileURLToPath(new URL("./synth-lab/index.html", import.meta.url)),
      },
    },
  },
});
