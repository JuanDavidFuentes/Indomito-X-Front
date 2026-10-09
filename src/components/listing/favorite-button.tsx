'use client';

import { pickVariant, WISHLIST_LIMITS, type WishlistSummary } from '@juandavidfuentes/indomitox-shared';
import { Heart, Plus } from '@phosphor-icons/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from '@/i18n/navigation';
import { hasSessionHint } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useSession } from '@/lib/session';
import { useSavedIds, useWishlistActions, useWishlists } from '@/lib/wishlists';

/**
 * Corazón de favorito (EXP-01). Sin sesión lleva a ingresar y luego de vuelta (AUTH-07). Vacío:
 * abre "Guardar en una lista"; lleno: la quita de todas las listas.
 * `overlay` va sobre la foto de una tarjeta (44 px); `button` es el botón con texto del detalle.
 */
export function FavoriteButton({ listingId, title, variant = 'overlay' }: { listingId: string; title: string; variant?: 'overlay' | 'button' }) {
  const t = useTranslations();
  const router = useRouter();
  const { data: user } = useSession();
  const saved = useSavedIds().has(listingId);
  const { unsave } = useWishlistActions();
  const [open, setOpen] = useState(false);

  const onClick = () => {
    if (!user && !hasSessionHint()) {
      const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.push({ pathname: '/ingresar', query: { next } });
      return;
    }
    if (saved) {
      unsave.mutate(listingId, { onSuccess: () => toast(t('favorites.removed')) });
      return;
    }
    setOpen(true);
  };

  const label = saved ? t('listing.removeFromFavorites') : t('listing.addToFavorites');
  const icon = <Heart size={22} weight={saved ? 'fill' : 'bold'} className={saved ? 'text-brand' : undefined} aria-hidden="true" />;

  return (
    <>
      {variant === 'overlay' ? (
        <button
          type="button"
          aria-label={`${label}: ${title}`}
          aria-pressed={saved}
          onClick={onClick}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-night/45 text-night-foreground backdrop-blur-sm transition-transform duration-150 ease-trail hover:bg-night/60 active:scale-90"
        >
          {icon}
        </button>
      ) : (
        <Button type="button" variant="outline" aria-pressed={saved} onClick={onClick}>
          {icon}
          {saved ? t('listing.removeFromFavorites') : t('listing.addToFavorites')}
        </Button>
      )}
      {open ? <SaveToListDialog listingId={listingId} title={title} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ListCover({ list }: { list: WishlistSummary }) {
  const variant = list.covers[0] ? pickVariant(list.covers[0].variants, 320) : null;
  return (
    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
      {variant ? (
        <Image src={variant.url} alt="" fill sizes="56px" quality={70} className="object-cover" />
      ) : (
        <Heart size={22} className="absolute inset-0 m-auto text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}

/** "Guardar en una lista": las listas existentes (un toque guarda) y una lista nueva. */
function SaveToListDialog({ listingId, title, onClose }: { listingId: string; title: string; onClose: () => void }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const nameId = useId();
  const { data, isPending } = useWishlists();
  const { create, add } = useWishlistActions();
  const lists = data?.lists ?? [];
  const [name, setName] = useState('');
  const busy = create.isPending || add.isPending;

  const saveTo = (list: WishlistSummary) =>
    add.mutate(
      { listId: list.id, listingId },
      {
        onSuccess: () => {
          toast(t('favorites.saved', { name: list.name }));
          onClose();
        },
        onError: (error) => toast.error(errorText.api(error)),
      },
    );

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    const listName = name.trim() || t('favorites.defaultListName');
    create.mutate(
      { name: listName, listingId },
      {
        onSuccess: () => {
          toast(t('favorites.saved', { name: listName }));
          onClose();
        },
        onError: (error) => toast.error(errorText.api(error)),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('favorites.saveTo')}</DialogTitle>
          <DialogDescription>{t('favorites.saveToBody', { title })}</DialogDescription>
        </DialogHeader>
        {isPending ? (
          <p role="status" className="flex items-center gap-2 text-muted-foreground">
            <Spinner aria-hidden="true" />
            {t('common.loading')}
          </p>
        ) : lists.length ? (
          <ul aria-label={t('favorites.listsLabel')} className="-mx-2 grid max-h-72 gap-1 overflow-y-auto">
            {lists.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => saveTo(list)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-muted disabled:opacity-60"
                >
                  <ListCover list={list} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{list.name}</span>
                    <span className="block text-sm text-muted-foreground">{t('favorites.listCount', { count: list.itemCount })}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <form onSubmit={onCreate} className="grid gap-2 border-t border-border pt-4">
          <label htmlFor={nameId} className="font-semibold">
            {lists.length ? t('favorites.newList') : t('favorites.listName')}
          </label>
          <div className="flex gap-2">
            <Input
              id={nameId}
              value={name}
              maxLength={WISHLIST_LIMITS.nameMax}
              placeholder={lists.length ? t('favorites.listNamePlaceholder') : t('favorites.defaultListName')}
              onChange={(event) => setName(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={busy}>
              {create.isPending ? <Spinner aria-hidden="true" /> : <Plus weight="bold" aria-hidden="true" />}
              {t('favorites.createAndSave')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
