'use client';

import { pickVariant, type WishlistsResponse, type WishlistSummary } from '@juandavidfuentes/indomitox-shared';
import { Heart } from '@phosphor-icons/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { Link } from '@/i18n/navigation';
import { useWishlists } from '@/lib/wishlists';

/** Mosaico de portadas de una lista (hasta tres fotos). */
function Mosaic({ list }: { list: WishlistSummary }) {
  const covers = list.covers.slice(0, 3);
  return (
    <div className="grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-xl bg-muted">
      {covers.length ? (
        covers.map((cover, index) => {
          const variant = pickVariant(cover.variants, index === 0 ? 640 : 320);
          return (
            <div key={cover.id} className={`relative ${index === 0 ? (covers.length === 1 ? 'col-span-3 row-span-2' : 'col-span-2 row-span-2') : covers.length === 2 ? 'row-span-2' : ''}`}>
              {variant ? <Image src={variant.url} alt="" fill sizes={index === 0 ? '(min-width: 1024px) 18rem, 60vw' : '10rem'} quality={70} className="object-cover" /> : null}
            </div>
          );
        })
      ) : (
        <div className="col-span-3 row-span-2 grid place-items-center">
          <Heart size={40} className="text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/** Favoritos (EXP-01): las listas del Explorador con su mosaico y cuántas aventuras tienen. */
export function WishlistsView({ initial }: { initial: WishlistsResponse }) {
  const t = useTranslations();
  const { data } = useWishlists();
  const lists = (data ?? initial).lists;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl leading-[0.95] font-extrabold uppercase italic">{t('favorites.title')}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{t('favorites.subtitle')}</p>
      {lists.length ? (
        <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {lists.map((list) => (
            <li key={list.id}>
              <Link href={{ pathname: '/cuenta/favoritos/[id]', params: { id: list.id } }} className="group grid gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <div className="transition-transform duration-300 ease-trail group-hover:-translate-y-0.5">
                  <Mosaic list={list} />
                </div>
                <span>
                  <span className="block font-display text-xl leading-tight font-bold uppercase [overflow-wrap:anywhere]">{list.name}</span>
                  <span className="block text-sm text-muted-foreground">{t('favorites.listCount', { count: list.itemCount })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card p-10 text-center">
          <TopoPattern variant="band" className="absolute inset-0 size-full text-primary/10" />
          <div className="relative grid justify-items-center gap-3">
            <Heart size={48} weight="duotone" className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-3xl leading-tight font-extrabold uppercase italic">{t('favorites.emptyTitle')}</h2>
            <p className="max-w-md text-muted-foreground">{t('favorites.emptyBody')}</p>
            <Link href="/buscar" className="mt-2 inline-flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
              {t('favorites.emptyAction')}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
