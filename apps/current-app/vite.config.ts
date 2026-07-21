import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Plain Vite SPA dev playground for the chat packages.
// Uses esbuild's automatic JSX runtime (no @vitejs/plugin-react needed).
// Workspace packages resolve via node_modules symlinks to their built dist.
export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: { jsx: 'automatic' },
  server: { port: 5173, open: true },
});
