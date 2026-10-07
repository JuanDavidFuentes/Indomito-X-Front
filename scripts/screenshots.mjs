// Capturas rápidas para revisar el diseño: node scripts/screenshots.mjs [ruta(s)] [carpeta]
// Varias rutas separadas por comas: /es/panel,/es/panel/equipo (se inicia sesión una sola vez).
// Requiere la web corriendo (por defecto http://localhost:3000; cambiar con BASE_URL).
// Opcional:
//   LOGIN_EMAIL / LOGIN_PASSWORD → inicia sesión antes (p. ej. explorador@indomitox.co / Aventura-2026)
//   VIEWPORT_ONLY=1              → solo la parte visible (sin desplazar)
//   ONLY=movil|escritorio        → un solo tamaño · SCHEME=light|dark → un solo tema
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
const routes = (process.argv[2] ?? '/es').split(',').filter(Boolean);
const outDir = process.argv[3] ?? 'test-results/screenshots';
const fullPage = process.env.VIEWPORT_ONLY !== '1';
const viewports = [
  { name: 'movil', width: 375, height: 812 },
  { name: 'escritorio', width: 1440, height: 900 },
].filter((vp) => !process.env.ONLY || vp.name === process.env.ONLY);
const schemes = ['light', 'dark'].filter((scheme) => !process.env.SCHEME || scheme === process.env.SCHEME);

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

// Se inicia sesión una sola vez (el login tiene límite de intentos) y se reutilizan las cookies.
let storageState;
if (process.env.LOGIN_EMAIL) {
  const login = await browser.newContext();
  // La API deja las cookies de sesión en localhost (las comparten la web y la API).
  const res = await login.request.post(`${apiUrl}/v1/auth/login`, {
    headers: { origin: baseUrl },
    data: { email: process.env.LOGIN_EMAIL, password: process.env.LOGIN_PASSWORD ?? '' },
  });
  if (!res.ok()) throw new Error(`No se pudo iniciar sesión (${res.status()})`);
  storageState = await login.storageState();
  await login.close();
}

for (const route of routes) for (const scheme of schemes) {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: scheme,
      storageState,
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // MASTER §12: sin desplazamiento horizontal.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > vp.width) console.warn(`⚠ desborde horizontal en ${route} (${vp.name}): ${scrollWidth}px`);
    const file = `${outDir}/${route.replace(/[/?=&]/g, '_') || 'home'}-${vp.name}-${scheme}.png`;
    await page.screenshot({ path: file, fullPage });
    console.log(file);
    await context.close();
  }
}
await browser.close();
