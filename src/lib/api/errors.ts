import { isApiErrorCode, type ApiErrorCode, type ValidationIssue } from '@juandavidfuentes/indomitox-shared';

/** Error de la API con su código estable (los textos salen de i18n `errors.<code>`). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Errores de validación por campo (`details` de VALIDATION_ERROR). */
  get issues(): ValidationIssue[] {
    return this.code === 'VALIDATION_ERROR' && Array.isArray(this.details) ? (this.details as ValidationIssue[]) : [];
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => null)) as { code?: string; message?: string; details?: unknown } | null;
    const code = body?.code && isApiErrorCode(body.code) ? body.code : res.status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
    return new ApiError(res.status, code, body?.message ?? res.statusText, body?.details);
  }

  static network(cause: unknown): ApiError {
    const error = new ApiError(0, 'NETWORK_ERROR', 'No hay conexión con la API');
    error.cause = cause;
    return error;
  }
}

/** Código traducible de cualquier error (los que no son de la API quedan como INTERNAL_ERROR). */
export function errorCode(error: unknown): ApiErrorCode {
  return error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
}
