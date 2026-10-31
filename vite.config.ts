import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function injectServiceWorkerAssets() {
  return {
    name: 'inject-sw-assets',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const assetsDir = path.resolve(distDir, 'assets');
      const swPath = path.resolve(distDir, 'sw.js');

      if (!fs.existsSync(swPath) || !fs.existsSync(assetsDir)) return;

      const assetFiles = fs
        .readdirSync(assetsDir)
        .filter((file) => !file.endsWith('.map'))
        .map((file) => `/assets/${file}`);

      let swContent = fs.readFileSync(swPath, 'utf-8');

      // Replace or insert pre-cache list
      const coreAssets = [
        '/',
        '/index.html',
        '/manifest.json',
        '/icon.svg',
        '/icon-192.png',
        '/icon-512.png',
        ...assetFiles,
      ];

      const replacement = `const ASSETS_TO_CACHE = ${JSON.stringify(coreAssets, null, 2)};`;
      swContent = swContent.replace(/const ASSETS_TO_CACHE = \[[\s\S]*?\];/, replacement);

      fs.writeFileSync(swPath, swContent, 'utf-8');
      console.log(`\n✅ Pre-cached ${coreAssets.length} assets in dist/sw.js!`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), injectServiceWorkerAssets()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'zustand', 'recharts', 'lucide-react'],
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-xlsx';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'vendor-confetti';
          }
        },
      },
    },
  },
});

