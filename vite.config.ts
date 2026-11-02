import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

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
  define: {
    __BUILD_SHA__: JSON.stringify(getBuildSha()),
  },
  server: {
    port: 3000,
  },
});
