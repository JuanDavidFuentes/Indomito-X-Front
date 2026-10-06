import { getTranslations } from 'next-intl/server';

// Marcador de posición: la búsqueda con mapa se construye en la fase F4.
export default async function SearchPage({ searchParams }: PageProps<'/[locale]/buscar'>) {
  const t = await getTranslations('search');
  const { q } = await searchParams;
  const query = typeof q === 'string' && q.trim() ? q.trim() : '—';

  return (
    <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-5xl font-bold uppercase">{t('title')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t('comingBody', { query })}</p>
    </section>
  );
}
