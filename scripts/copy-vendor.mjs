// Copia a public/vendor los archivos de librerías que el navegador carga por URL y que el
// empaquetador no puede resolver solo. Hoy: el worker de MapLibre (maplibre-gl 6 lo busca
// junto a su módulo con una URL calculada en tiempo de ejecución). Corre antes de `dev` y `build`.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const webDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const target = path.join(webDir, 'public', 'vendor');
mkdirSync(target, { recursive: true });

const maplibreDir = path.dirname(require.resolve('maplibre-gl/package.json'));
copyFileSync(path.join(maplibreDir, 'dist', 'maplibre-gl-worker.mjs'), path.join(target, 'maplibre-gl-worker.mjs'));
console.log('vendor: public/vendor/maplibre-gl-worker.mjs');
