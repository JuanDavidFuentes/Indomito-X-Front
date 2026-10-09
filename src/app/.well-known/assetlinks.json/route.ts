/**
 * Android App Links (EXP-04): autoriza a la app `co.indomitox.app` a abrir los enlaces de la web.
 * Las huellas SHA-256 de los certificados de firma van en `ANDROID_CERT_SHA256` (separadas por
 * comas: la de Google Play y la de desarrollo). Sin ellas, la lista va vacía y los enlaces se
 * abren en el navegador.
 */
export const dynamic = 'force-static';

export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  const body = fingerprints.length
    ? [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: { namespace: 'android_app', package_name: 'co.indomitox.app', sha256_cert_fingerprints: fingerprints },
        },
      ]
    : [];
  return Response.json(body, { headers: { 'cache-control': 'public, max-age=3600' } });
}
