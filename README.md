# Indómito X — Front (web)

Web del marketplace de deportes extremos **Indómito X**: sitio público indexable en Google, panel del Guía y panel de administración. Next.js 16 (App Router), Tailwind 4 y next-intl (es/en/fr).

| Repositorio | Contenido |
|---|---|
| [Indomito-X-Shared](https://github.com/JuanDavidFuentes/Indomito-X-Shared) | Paquete compartido, requerimientos, plan y diseño |
| [Indomito-X-Back](https://github.com/JuanDavidFuentes/Indomito-X-Back) | API |
| **Indomito-X-Front** (este) | Web |
| [Indomito-X-App](https://github.com/JuanDavidFuentes/Indomito-X-App) | App móvil (Expo) |

## Requisitos

- Node 24 y npm 11
- La API corriendo en local (ver Indomito-X-Back)
- Acceso al paquete `@juandavidfuentes/indomitox-shared` en GitHub Packages: token *classic* con `read:packages` en tu `~/.npmrc`:
  ```
  //npm.pkg.github.com/:_authToken=TU_TOKEN
  ```

## Primeros pasos

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:3000 → redirige a /es
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run check` | Lint, verificación de tipos y pruebas |
| `npm run build` | Compilación de producción (las portadas por idioma se generan estáticas) |
| `npm run screenshots -- /es` | Capturas en 375 y 1440 px, en modo claro y oscuro (con la web corriendo) |

## Estructura

```
src/
  app/[locale]/   rutas con prefijo de idioma (/es, /en, /fr)
  i18n/           enrutamiento con slugs traducidos y carga de mensajes
  components/     marca (logo, curvas de nivel) y diseño (encabezado, pie, tema, idioma)
  proxy.ts        detección de idioma (en Next 16, middleware se llama proxy)
```

Diseño: tokens y reglas en `@juandavidfuentes/indomitox-shared/tokens` y en `design-system/indomito-x/MASTER.md` (repo Shared).
