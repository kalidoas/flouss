import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.PLAYWRIGHT_PREVIEW_PORT || '4173';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'qa-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${previewPort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 12'], viewport: { width: 390, height: 844 } },
      timeout: 90000,
      workers: 1,
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: `http://127.0.0.1:${previewPort}`,
    reuseExistingServer: false,
    timeout: 180000,
  },
  outputDir: 'qa',
});
