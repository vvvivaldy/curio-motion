import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  cacheDir: '.vite-cache',
  server: { watch: { ignored: ['**/qa/**', '**/outputs/**', '**/dist/**'] } },
  build: { target: 'es2022', rollupOptions: { input: {
    scene: resolve('index.html'), player: resolve('player.html'), viewer: resolve('viewer.html'),
  } } },
});
