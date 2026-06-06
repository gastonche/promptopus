export type ProviderErrorKind =
  | 'missing_key'
  | 'http'
  | 'network'
  | 'parse'
  | 'timeout'
  | 'not_implemented';

export interface ProviderErrorOptions {
  kind?: ProviderErrorKind;
  status?: number;
  retryable?: boolean;
  retryAfterMs?: number;
  cause?: unknown;
}

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly retryAfterMs: number | undefined;

  constructor(message: string, opts: ProviderErrorOptions = {}) {
    super(message);
    this.name = 'ProviderError';
    this.kind = opts.kind ?? 'http';
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
    this.retryAfterMs = opts.retryAfterMs;
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}

export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
}
