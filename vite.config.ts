import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { offlineBuild } from "./build/offline";

export default defineConfig({
  plugins: [react(), offlineBuild()],
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
