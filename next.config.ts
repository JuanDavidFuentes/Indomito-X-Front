import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Raíz para Turbopack y el trazado de archivos.
 * - En el espacio de trabajo local (Indomito-X/{shared,back,web,app}) las dependencias se
 *   instalan en la carpeta padre, que está fuera de este repo de git: la raíz es el padre.
 * - Si el repo se clona solo (CI, despliegue), la raíz es esta misma carpeta.
 */
function projectRoot(): string {
  const appDir = process.cwd();
  const parentDir = path.dirname(appDir);
  try {
    const parentPkg = JSON.parse(readFileSync(path.join(parentDir, 'package.json'), 'utf8')) as {
      workspaces?: string[];
    };
    if (parentPkg.workspaces?.includes(path.basename(appDir))) return parentDir;
  } catch {
    // Sin package.json en el padre: repo independiente.
  }
  return appDir;
}

const root = projectRoot();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root },
  outputFileTracingRoot: root,
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_WEB_URL: process.env.WEB_URL ?? 'http://localhost:3000',
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
