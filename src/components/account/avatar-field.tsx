'use client';

import { acceptAttribute, maxUploadMb, type MeResponse } from '@juandavidfuentes/indomitox-shared';
import { Camera, Trash } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { checkFile, uploadFile } from '@/lib/uploads';
import { useStoreMe } from './account-data';
import { UserAvatar } from './user-avatar';

/** Foto de perfil (EXP-02): se sube directo al bucket público y reemplaza la anterior. */
export function AvatarField({ me }: { me: MeResponse }) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file, 'AVATAR');
    if (problem) {
      toast.error(problem === 'tooLarge' ? t('uploads.tooLarge', { maxMb: maxUploadMb('AVATAR') }) : t('uploads.typeNotAllowed'));
      return;
    }
    setProgress(0);
    try {
      const fileId = await uploadFile(file, 'AVATAR', setProgress);
      storeMe(await api<MeResponse>('/v1/me/avatar', { method: 'PUT', body: { fileId } }));
      toast.success(t('account.photoUpdated'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      storeMe(await api<MeResponse>('/v1/me/avatar', { method: 'DELETE' }));
      toast.success(t('account.photoRemoved'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <UserAvatar user={me.user} className="size-20" textClassName="text-2xl" />
      <div className="grid gap-2">
        <p className="font-semibold">{t('account.photo')}</p>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {t('account.photoHint', { maxMb: maxUploadMb('AVATAR') })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 font-semibold transition-colors duration-150 focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted"
          >
            {progress !== null ? <Spinner aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
            {progress !== null ? t('uploads.uploading', { percent: progress }) : t('account.changePhoto')}
            <input
              ref={input}
              id={id}
              type="file"
              accept={acceptAttribute('AVATAR')}
              aria-describedby={`${id}-hint`}
              disabled={progress !== null}
              className="sr-only"
              onChange={(event) => void choose(event.target.files?.[0])}
            />
          </label>
          {me.user.avatarUrl ? (
            <Button type="button" variant="ghost" onClick={remove} disabled={removing}>
              {removing ? <Spinner aria-hidden="true" /> : <Trash size={18} aria-hidden="true" />}
              {t('account.removePhoto')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
