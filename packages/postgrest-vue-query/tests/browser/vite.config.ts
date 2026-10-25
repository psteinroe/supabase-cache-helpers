import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./page', import.meta.url)),
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
});
