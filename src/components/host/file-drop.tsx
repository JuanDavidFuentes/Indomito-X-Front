'use client';

import { acceptAttribute, formatFileSize, maxUploadMb, type UploadPurpose } from '@juandavidfuentes/indomitox-shared';
import { CheckCircle, FilePdf, Image as ImageIcon, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useRef, useState, type DragEvent } from 'react';
import { checkFile, uploadFile } from '@/lib/uploads';
import { useErrorText } from '@/lib/forms';

const FORMAT_NAMES: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'application/pdf': 'PDF',
};

export interface UploadedFile {
  fileId: string;
  file: File;
}

/**
 * Elegir o soltar un archivo y subirlo directo a S3 con barra de progreso. Arrastrar es solo
 * un atajo: el botón funciona con teclado y lector de pantalla (WCAG 2.5.7). Un archivo
 * subido que no se llega a usar (p. ej. se cierra el diálogo) lo borra el job de limpieza.
 */
export function FileDrop({
  purpose,
  label,
  hint,
  onUploaded,
  disabled = false,
  compact = false,
}: {
  purpose: UploadPurpose;
  label: string;
  hint?: string;
  onUploaded: (uploaded: UploadedFile) => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations('uploads');
  const locale = useLocale();
  const errors = useErrorText();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<File | null>(null);

  const formats = acceptAttribute(purpose)
    .split(',')
    .map((type) => FORMAT_NAMES[type] ?? type)
    .join(', ');

  const handle = async (file: File | undefined) => {
    if (!file || disabled) return;
    setProblem(null);
    setDone(null);
    const issue = checkFile(file, purpose);
    if (issue) {
      setProblem(issue === 'tooLarge' ? t('tooLarge', { maxMb: maxUploadMb(purpose) }) : t('typeNotAllowed'));
      return;
    }
    setProgress(0);
    try {
      const fileId = await uploadFile(file, purpose, setProgress);
      await onUploaded({ fileId, file });
      setDone(file);
    } catch (error) {
      setProblem(errors.api(error));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void handle(event.dataTransfer.files[0]);
  };

  const uploading = progress !== null;
  const FileIcon = purpose === 'HOST_DOCUMENT' ? FilePdf : ImageIcon;

  return (
    <div className="grid gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition-colors duration-150 ${
          compact ? 'px-4 py-5' : 'px-6 py-8'
        } ${dragging ? 'border-primary bg-primary/5' : 'border-input bg-muted/40'} ${disabled ? 'opacity-50' : ''}`}
      >
        <FileIcon size={compact ? 28 : 36} weight="duotone" className="text-muted-foreground" aria-hidden="true" />
        {uploading ? (
          <div className="grid w-full max-w-xs gap-2" role="status" aria-live="polite">
            <span className="text-sm font-semibold">{t('uploading', { percent: progress })}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <span className="text-sm text-muted-foreground max-sm:sr-only">{t('dropHint')}</span>
            <label
              htmlFor={id}
              className={`inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 font-semibold transition-colors duration-150 ${
                disabled ? 'pointer-events-none' : 'cursor-pointer hover:bg-muted'
              } focus-within:ring-3 focus-within:ring-ring/50`}
            >
              <UploadSimple size={18} aria-hidden="true" />
              {label}
              <input
                ref={input}
                id={id}
                type="file"
                accept={acceptAttribute(purpose)}
                disabled={disabled || uploading}
                aria-describedby={`${id}-hint`}
                className="sr-only"
                onChange={(event) => void handle(event.target.files?.[0])}
              />
            </label>
          </>
        )}
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint ? `${hint} ` : ''}
          {t('formats', { formats, maxMb: maxUploadMb(purpose) })}
        </span>
      </div>
      {problem ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <WarningCircle size={18} weight="fill" aria-hidden="true" />
          {problem}
        </p>
      ) : null}
      {done ? (
        <p className="flex items-center gap-1.5 text-sm font-medium [overflow-wrap:anywhere]">
          <CheckCircle size={18} weight="fill" className="shrink-0 text-success" aria-hidden="true" />
          {done.name} · {formatFileSize(done.size, locale)}
        </p>
      ) : null}
    </div>
  );
}
