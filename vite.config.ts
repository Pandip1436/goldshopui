import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The code shared with the API: ../shared inside the full project, else the copy in ./shared that
// scripts/sync-shared.mjs keeps for the storefront's own repository (same lookup as tsconfig paths).
const shared = fs.existsSync(here('../shared/src/index.ts')) ? here('../shared/src/index.ts') : here('./shared/src/index.ts');

export default defineConfig(({ mode }) => {
  // API_URL from the environment or client/.env (a real environment variable wins).
  const api = loadEnv(mode, here('.'), '').API_URL || 'http://localhost:4000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@goldshop/shared': shared } },
    server: {
      port: 5173,
      strictPort: true,
      // Listen on the LAN so the site can be opened from a phone on the same Wi-Fi.
      host: true,
      proxy: {
        '/api': { target: api, changeOrigin: false },
        '/uploads': { target: api, changeOrigin: false },
        '/sitemap.xml': { target: api, changeOrigin: false },
        '/robots.txt': { target: api, changeOrigin: false },
      },
    },
    preview: { port: 5173 },
    build: {
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return 'react';
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
            if (id.includes('@tanstack')) return 'query';
            if (id.includes('marked') || id.includes('dompurify')) return 'markdown';
            return undefined;
          },
        },
      },
    },
  };
});
