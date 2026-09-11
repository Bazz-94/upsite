import { defineConfig, devices } from '@playwright/test'

/** Base URL the dev server is served on during UI tests. */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// UI tests only. Backend tests run in jest (see jest.config.ts).
export default defineConfig({
  testDir: './src/app.tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // No accidental .only in CI.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Reuses an already running dev server locally, starts one otherwise.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
