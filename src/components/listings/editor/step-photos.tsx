'use client';

import {
  acceptAttribute,
  LISTING_LIMITS,
  ListingDraftSchema,
  maxUploadMb,
  type HostListingResponse,
  type ListingPhotoDto,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowLeft, ArrowRight, Star, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AutosaveIndicator } from '@/components/host/autosave-indicator';
import { TextField } from '@/components/forms/fields';
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
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useStoreListing } from '@/lib/listings';
import { checkFile, uploadFile } from '@/lib/uploads';
import { ListingPhoto } from '../listing-photo';
import type { StepProps } from './step-props';
import { useListingForm } from './use-listing-form';

const FIELDS = { videoUrl: ListingDraftSchema.shape.videoUrl };

interface Upload {
  key: string;
  name: string;
  progress: number;
  error: string | null;
}

/**
 * Paso 4: fotos (de 3 a 20; la primera es la portada) y un video opcional (LIST-01). Las fotos
 * suben directo a S3 y la API genera sus variantes en segundo plano; mientras tanto se ve un
 * aviso. El orden se cambia con botones (no hace falta arrastrar, WCAG 2.5.7).
 */
export function StepPhotos({ data, editable }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeListing = useStoreListing();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const { listing } = data;
  const photos = listing.photos;
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<ListingPhotoDto | null>(null);
  const { form, autosave } = useListingForm<{ videoUrl: string }>(listing.id, FIELDS, { videoUrl: listing.videoUrl ?? '' }, { disabled: !editable });
  const remaining = LISTING_LIMITS.photosMax - photos.length;

  const store = (result: HostListingResponse) => storeListing(result);

  const addFiles = async (files: File[]) => {
    const batch = files.slice(0, remaining);
    if (files.length > remaining) toast.warning(t('listings.photos.tooMany', { max: LISTING_LIMITS.photosMax }));
    setUploads(batch.map((file, index) => ({ key: `${Date.now()}-${index}`, name: file.name, progress: 0, error: null })));
    setBusy(true);
    for (const [index, file] of batch.entries()) {
      const setUpload = (patch: Partial<Upload>) => setUploads((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
      const problem = checkFile(file, 'LISTING_PHOTO');
      if (problem) {
        setUpload({ error: problem === 'tooLarge' ? t('uploads.tooLarge', { maxMb: maxUploadMb('LISTING_PHOTO') }) : t('uploads.typeNotAllowed') });
        continue;
      }
      try {
        const fileId = await uploadFile(file, 'LISTING_PHOTO', (progress) => setUpload({ progress }));
        store(await api<HostListingResponse>(`/v1/host/listings/${listing.id}/photos`, { method: 'POST', body: { fileId } }));
        setUpload({ progress: 100 });
      } catch (error) {
        setUpload({ error: errors.api(error) });
      }
    }
    setBusy(false);
    setUploads((current) => current.filter((item) => item.error));
    if (input.current) input.current.value = '';
  };

  const reorder = async (order: string[]) => {
    try {
      store(await api<HostListingResponse>(`/v1/host/listings/${listing.id}/photos/order`, { method: 'PUT', body: { photoIds: order } }));
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  const move = (index: number, delta: number) => {
    const order = photos.map((photo) => photo.id);
    const [moved] = order.splice(index, 1);
    order.splice(index + delta, 0, moved!);
    void reorder(order);
  };

  const remove = async () => {
    if (!removing) return;
    try {
      store(await api<HostListingResponse>(`/v1/host/listings/${listing.id}/photos/${removing.id}`, { method: 'DELETE' }));
      toast.success(t('listings.photos.removed'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`font-semibold tabular-nums ${photos.length >= LISTING_LIMITS.photosMin ? 'text-success' : ''}`}>
          {t('listings.photos.count', { count: photos.length, min: LISTING_LIMITS.photosMin, max: LISTING_LIMITS.photosMax })}
        </p>
        <AutosaveIndicator status={autosave.status} />
      </div>

      {photos.length ? (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative">
                <ListingPhoto photo={photo} sizes="(min-width: 1280px) 20rem, (min-width: 640px) 40vw, 90vw" />
                {index === 0 ? <span className="tape absolute bottom-3 left-3 text-xs!">{t('listings.photos.cover')}</span> : null}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="px-2 text-sm font-semibold text-muted-foreground tabular-nums">{t('listings.photos.position', { index: index + 1 })}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" disabled={!editable || index === 0} aria-label={t('listings.photos.moveBefore', { index: index + 1 })} onClick={() => move(index, -1)}>
                    <ArrowLeft size={18} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!editable || index === photos.length - 1}
                    aria-label={t('listings.photos.moveAfter', { index: index + 1 })}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!editable || index === 0}
                    aria-label={t('listings.photos.makeCover', { index: index + 1 })}
                    onClick={() => void reorder([photo.id, ...photos.filter((p) => p.id !== photo.id).map((p) => p.id)])}
                  >
                    <Star size={18} aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" disabled={!editable} aria-label={t('listings.photos.remove', { index: index + 1 })} onClick={() => setRemoving(photo)}>
                    <Trash size={18} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {editable && remaining > 0 ? (
        <div className="grid gap-3 rounded-xl border-2 border-dashed border-input bg-muted/40 p-6 text-center">
          <UploadSimple size={36} weight="duotone" className="mx-auto text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">{t('listings.photos.hint')}</p>
          <label
            htmlFor={inputId}
            className={`mx-auto inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 font-semibold transition-colors duration-150 focus-within:ring-3 focus-within:ring-ring/50 ${
              busy ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:bg-muted'
            }`}
          >
            <UploadSimple size={18} aria-hidden="true" />
            {t('listings.photos.add')}
            <input
              ref={input}
              id={inputId}
              type="file"
              multiple
              accept={acceptAttribute('LISTING_PHOTO')}
              disabled={busy}
              className="sr-only"
              onChange={(event) => void addFiles([...(event.target.files ?? [])])}
            />
          </label>
          <p className="text-xs text-muted-foreground">{t('uploads.formats', { formats: 'JPG, PNG, WebP', maxMb: maxUploadMb('LISTING_PHOTO') })}</p>
          {uploads.length ? (
            <ul className="mx-auto grid w-full max-w-md gap-2 text-left" aria-live="polite">
              {uploads.map((upload) => (
                <li key={upload.key} className="grid gap-1 text-sm">
                  <span className="flex items-center justify-between gap-2 font-semibold [overflow-wrap:anywhere]">
                    {upload.name}
                    {upload.error ? null : <span className="tabular-nums text-muted-foreground">{upload.progress} %</span>}
                  </span>
                  {upload.error ? (
                    <span className="flex items-center gap-1.5 font-medium text-destructive">
                      <WarningCircle size={16} weight="fill" aria-hidden="true" />
                      {upload.error}
                    </span>
                  ) : (
                    <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${upload.progress}%` }} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <TextField
          control={form.control}
          name="videoUrl"
          label={`${t('listings.photos.video')} (${t('common.optional')})`}
          description={t('listings.photos.videoHint')}
          type="url"
          inputMode="url"
          placeholder="https://youtu.be/…"
        />
      </form>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('listings.photos.removeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('listings.photos.removeBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => void remove()}>
              {t('common.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
