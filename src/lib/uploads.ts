'use client';

import { UPLOAD_RULES, type UploadPurpose, type UploadTicket } from '@juandavidfuentes/indomitox-shared';
import { api } from './api/client';
import { ApiError } from './api/errors';

export type FileProblem = 'typeNotAllowed' | 'tooLarge';

/** Revisión previa en el navegador (la API vuelve a revisar todo al usar el archivo). */
export function checkFile(file: File, purpose: UploadPurpose): FileProblem | null {
  const rules = UPLOAD_RULES[purpose];
  if (!(rules.contentTypes as readonly string[]).includes(file.type)) return 'typeNotAllowed';
  if (file.size > rules.maxBytes) return 'tooLarge';
  return null;
}

/**
 * Sube un archivo directo a S3 con la URL prefirmada de la API y devuelve su `fileId`.
 * Usa XMLHttpRequest porque `fetch` no informa el progreso de la subida.
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const ticket = await api<UploadTicket>('/v1/uploads', {
    method: 'POST',
    body: { purpose, contentType: file.type, size: file.size, fileName: file.name },
  });
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(ticket.method, ticket.url);
    for (const [name, value] of Object.entries(ticket.headers)) request.setRequestHeader(name, value);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new ApiError(request.status, 'UPLOAD_INVALID', `S3 respondió ${request.status}`));
    request.onerror = () => reject(ApiError.network(new Error('Falló la subida a S3')));
    request.send(file);
  });
  onProgress?.(100);
  return ticket.fileId;
}
