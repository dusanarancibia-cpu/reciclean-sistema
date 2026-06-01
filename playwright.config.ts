// Playwright config · MVP E2E · SPEC mayordomo/SPEC-E2E-PLAYWRIGHT-MVP.md
// Firma Dusan 31-may opción 1. Solo chromium para MVP, agregar firefox/webkit en nivel MEDIO.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://reciclean-sistema.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
