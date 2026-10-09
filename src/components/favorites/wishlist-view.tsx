'use client';

import { WISHLIST_LIMITS, type SportDto, type WishlistDetail } from '@juandavidfuentes/indomitox-shared';
import { ArrowLeft, PencilSimple, Trash, X } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ListingCard } from '@/components/listing/listing-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { useErrorText } from '@/lib/forms';
import { useWishlist, useWishlistActions } from '@/lib/wishlists';

/** Una lista de favoritos: sus aventuras, cambiar el nombre, quitar una o eliminar la lista. */
export function WishlistView({ initial, sports }: { initial: WishlistDetail; sports: SportDto[] }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const router = useRouter();
  const nameId = useId();
  const { data } = useWishlist(initial.id);
  const list = data ?? initial;
  const { rename, remove, destroy } = useWishlistActions();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [confirm, setConfirm] = useState(false);

  const onRename = (event: FormEvent) => {
    event.preventDefault();
    rename.mutate(
      { id: list.id, name },
      {
        onSuccess: () => {
          toast(t('favorites.renamed'));
          setEditing(false);
        },
        onError: (error) => toast.error(errorText.api(error)),
      },
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cuenta/favoritos" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        {t('favorites.backToLists')}
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        {editing ? (
          <form onSubmit={onRename} className="flex w-full max-w-xl flex-wrap items-end gap-2">
            <div className="grid min-w-0 flex-1 gap-1">
              <label htmlFor={nameId} className="text-sm font-semibold">
                {t('favorites.listName')}
              </label>
              <Input id={nameId} value={name} maxLength={WISHLIST_LIMITS.nameMax} onChange={(event) => setName(event.target.value)} autoFocus />
            </div>
            <Button type="submit" disabled={rename.isPending || !name.trim()}>
              {t('common.save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(list.name);
              }}
            >
              {t('common.cancel')}
            </Button>
          </form>
        ) : (
          <>
            <div className="min-w-0">
              <h1 className="font-display text-5xl leading-[0.95] font-extrabold uppercase italic [overflow-wrap:anywhere]">{list.name}</h1>
              <p className="mt-2 text-muted-foreground">{t('favorites.listCount', { count: list.items.length })}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                <PencilSimple aria-hidden="true" />
                {t('favorites.rename')}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirm(true)}>
                <Trash aria-hidden="true" />
                {t('favorites.deleteList')}
              </Button>
            </div>
          </>
        )}
      </div>

      {list.unavailableCount ? <p className="mt-4 text-sm text-muted-foreground">{t('favorites.unavailable', { count: list.unavailableCount })}</p> : null}

      {list.items.length ? (
        <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {list.items.map((item) => (
            <li key={item.id} className="grid content-start gap-2">
              <ListingCard listing={item} sports={sports} headingLevel="h2" sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 92vw" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-self-start"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ listId: list.id, listingId: item.id }, { onError: (error) => toast.error(errorText.api(error)) })}
              >
                <X aria-hidden="true" />
                {t('favorites.removeItem')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">{t('favorites.listEmpty')}</p>
      )}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('favorites.deleteConfirmTitle', { name: list.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('favorites.deleteConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() =>
                destroy.mutate(list.id, {
                  onSuccess: () => {
                    toast(t('favorites.deleted'));
                    router.replace('/cuenta/favoritos');
                  },
                  onError: (error) => toast.error(errorText.api(error)),
                })
              }
            >
              {t('favorites.deleteList')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
