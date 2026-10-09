/**
 * iOS Universal Links (EXP-04): las páginas públicas (`/es/…`, `/en/…`, `/fr/…`) se abren en la
 * app si está instalada. Requiere el Team ID de Apple en `APPLE_TEAM_ID`; sin él responde 404.
 */
export const dynamic = 'force-static';

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!teamId) return new Response('Not found', { status: 404 });
  const components = ['es', 'en', 'fr'].map((locale) => ({ '/': `/${locale}/*`, comment: `Páginas públicas en ${locale}` }));
  return Response.json(
    { applinks: { details: [{ appIDs: [`${teamId}.co.indomitox.app`], components }] } },
    { headers: { 'cache-control': 'public, max-age=3600' } },
  );
}
