import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force single instances so reactflow's d3-zoom/d3-transition patch the same
    // d3-selection it uses (otherwise: "selection.interrupt is not a function").
    dedupe: ["react", "react-dom", "d3-selection", "d3-transition", "d3-zoom", "d3-drag"],
  },
});
