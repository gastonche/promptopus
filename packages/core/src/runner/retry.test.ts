import { describe, expect, it, vi } from 'vitest';

import { ProviderError } from '../providers/errors.js';
import { withRetry } from './retry.js';

const noSleep = (): Promise<void> => Promise.resolve();
const retryable = (): ProviderError => new ProviderError('429', { retryable: true });

describe('withRetry', () => {
  it('retries a retryable error then succeeds', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(retryable())
      .mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { sleep: noSleep, random: () => 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry budget and rethrows', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(retryable());
    await expect(withRetry(fn, { retries: 2, sleep: noSleep, random: () => 0 })).rejects.toThrow('429');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable error', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new ProviderError('401', { retryable: false }));
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('401');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('honors Retry-After when longer than the backoff', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ProviderError('429', { retryable: true, retryAfterMs: 5_000 }))
      .mockResolvedValueOnce('ok');
    const delays: number[] = [];
    await withRetry(fn, {
      sleep: noSleep,
      random: () => 0,
      baseDelayMs: 100,
      onRetry: ({ delayMs }) => delays.push(delayMs),
    });
    expect(delays[0]).toBe(5_000);
  });
});
