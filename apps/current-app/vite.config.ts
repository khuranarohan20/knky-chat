import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Plain Vite SPA dev playground for the chat packages.
// Uses esbuild's automatic JSX runtime (no @vitejs/plugin-react needed).
//
// Resolve @knky-chat/* to each package's SOURCE via a global alias so editing
// library source hot-reloads here without a rebuild. A global alias (not
// vite-tsconfig-paths) is required: it applies to EVERY importer, including
// imports made from inside the packages themselves — otherwise cross-package
// imports (e.g. adapters/src importing chat-ui) fall back to dist and you end
// up with two useChatStore instances (adapter writes one, UI reads the other).
const pkgSrc = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@knky-chat/core-chat': pkgSrc('core-chat'),
      '@knky-chat/chat-ui': pkgSrc('chat-ui'),
      '@knky-chat/adapters': pkgSrc('adapters'),
    },
    // Only dedupe packages that are deps of this app — dedupe resolves from
    // the app root, so listing immer/zustand (not app deps) breaks them.
    // React must be a single copy (invalid-hook-call); the store singleton is
    // already guaranteed by the alias above.
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 5173, open: true },
});
