import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Tests need to run sequentially for cache state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for cache state consistency
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 10000,

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Server should be started externally (via Docker or make serve)
  // Use `make test` in examples/php-vanilla to run with Docker
});
