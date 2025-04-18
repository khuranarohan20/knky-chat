import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  mode: "test",
  envDir: "./envs",
  envPrefix: "KNKY_",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "converse.svc-client": path.resolve(
        __dirname,
        "./node_modules/converse.svc-client/src/index.js"
      ),
    },
  },
});
