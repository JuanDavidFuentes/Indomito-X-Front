'use client';

import type { HostDocumentDto, SignedFileUrl } from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut, WarningCircle } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';

/**
 * Visor de un documento privado (HOST-08): pide una URL firmada de pocos minutos y muestra el
 * PDF o la imagen dentro del diálogo. `actions` agrega botones (p. ej. aprobar o rechazar).
 */
export function DocumentViewer({
  document,
  title,
  urlPath,
  note,
  actions,
  onOpenChange,
}: {
  document: HostDocumentDto | null;
  title: string;
  /** Ruta de la API que entrega la URL firmada. */
  urlPath: string | null;
  note?: string;
  actions?: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const { data, isPending, isError } = useQuery({
    queryKey: ['document-url', urlPath],
    queryFn: () => api<SignedFileUrl>(urlPath!),
    enabled: urlPath !== null,
    // La URL vence a los 5 minutos: se pide de nuevo cada vez que se abre.
    staleTime: 0,
    gcTime: 0,
  });
  const isPdf = document?.contentType === 'application/pdf';

  return (
    <Dialog open={document !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
          <DialogDescription>
            {[document?.fileName, note].filter(Boolean).join(' · ')}
          </DialogDescription>
        </DialogHeader>
        <div className="relative min-h-[50dvh] flex-1 overflow-hidden rounded-lg border border-border bg-muted">
          {isPending ? (
            <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground">
              <Spinner aria-hidden="true" />
              {t('admin.viewerLoading')}
            </div>
          ) : isError || !data ? (
            <div role="alert" className="absolute inset-0 flex items-center justify-center gap-2 text-destructive">
              <WarningCircle size={22} weight="fill" aria-hidden="true" />
              {t('admin.viewerError')}
            </div>
          ) : isPdf ? (
            <iframe src={data.url} title={title} className="absolute inset-0 size-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada que vence en minutos: no pasa por el optimizador.
            <img src={data.url} alt={title} className="absolute inset-0 size-full object-contain" />
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {data ? (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-secondary underline-offset-4 hover:underline"
            >
              <ArrowSquareOut size={18} aria-hidden="true" />
              {t('common.openInNewTab')}
            </a>
          ) : (
            <span />
          )}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
