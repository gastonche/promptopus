import { ProviderError } from '../providers/errors.js';

export interface RetryInfo {
  attempt: number;
  delayMs: number;
  error: unknown;
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  isRetryable?: (err: unknown) => boolean;
  onRetry?: (info: RetryInfo) => void;
}

function defaultIsRetryable(err: unknown): boolean {
  return err instanceof ProviderError && err.retryable;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 8_000;
  const jitter = opts.jitter ?? 0.25;
  const sleep = opts.sleep ?? defaultSleep;
  const random = opts.random ?? Math.random;
  const isRetryable = opts.isRetryable ?? defaultIsRetryable;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries || !isRetryable(err)) throw err;

      let delay = Math.min(max, base * 2 ** (attempt - 1));
      delay += delay * jitter * random();
      const retryAfter = err instanceof ProviderError ? err.retryAfterMs : undefined;
      if (retryAfter !== undefined) delay = Math.max(delay, retryAfter);
      delay = Math.round(delay);

      opts.onRetry?.({ attempt, delayMs: delay, error: err });
      await sleep(delay);
    }
  }
}
