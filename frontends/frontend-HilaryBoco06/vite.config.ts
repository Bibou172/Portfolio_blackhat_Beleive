import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Le port 5173 fait partie des origines autorisées par CORS_ORIGINS (.env du dépôt).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Autorise la lecture (seule) du dossier data/ du dépôt : source de repli si l'API ne répond pas.
    fs: { allow: [fileURLToPath(new URL("../..", import.meta.url))] },
  },
  preview: { port: 5173, strictPort: true },
  // La scène 3D (Three.js) forme un chunk séparé d'environ 525 ko (≈ 140 ko gzip), chargé à la demande.
  build: { chunkSizeWarningLimit: 600 },
});
