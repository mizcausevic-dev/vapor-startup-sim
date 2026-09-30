import { defineConfig } from 'vite';

// VAPOR — static-first build. No backend, no env injection at runtime.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
