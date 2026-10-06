// Capturas rápidas para revisar el diseño: node scripts/screenshots.mjs [ruta] [carpeta]
// Requiere la web corriendo (por defecto http://localhost:3000; cambiar con BASE_URL).
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const route = process.argv[2] ?? '/es';
const outDir = process.argv[3] ?? 'test-results/screenshots';
const viewports = [
  { name: 'movil', width: 375, height: 812 },
  { name: 'escritorio', width: 1440, height: 900 },
];
const schemes = ['light', 'dark'];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
for (const scheme of schemes) {
  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: scheme,
    });
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const file = `${outDir}/${route.replaceAll('/', '_') || 'home'}-${vp.name}-${scheme}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
    await page.close();
  }
}
await browser.close();
