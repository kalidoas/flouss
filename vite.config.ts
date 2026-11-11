import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';

const getBuildSha = () => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim().slice(0, 7);
  } catch {
    return 'dev';
  }
};

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      'react-router-dom': path.resolve(__dirname, 'src/lib/react-router-dom.ts'),
    },
  },
  define: {
    __BUILD_SHA__: JSON.stringify(getBuildSha()),
  },
  build: {
    // Cross-Browser & Campus Wi-Fi legacy compatibility for Safari iOS 14+ and older Android Chrome
    target: 'es2020',
    cssTarget: 'chrome80',
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
  },
  preview: {
    // Normalizes preview port towards standard HTTPS/HTTP deployment defaults
    port: 443,
    strictPort: false,
  },
  server: {
    port: 3000,
    host: true,
  },
});
