import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de punta a punta de la web (PLAN §10). Necesitan todo corriendo en local:
 * `npm run infra:up` y `npm run dev` (API en :4000, web en :3000, Mailpit en :8025).
 * Correr con: `npm run test:e2e -w indomitox-web`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    locale: 'es-CO',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
