import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseRetryAfter, ProviderError } from './errors.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('parseRetryAfter', () => {
  it('parses delta-seconds into milliseconds', () => {
    expect(parseRetryAfter('5')).toBe(5000);
    expect(parseRetryAfter('0')).toBe(0);
  });

  it('parses an HTTP date relative to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    expect(parseRetryAfter('Thu, 01 Jan 2026 00:00:10 GMT')).toBe(10000);
  });

  it('clamps past dates to 0', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:10Z'));
    expect(parseRetryAfter('Thu, 01 Jan 2026 00:00:00 GMT')).toBe(0);
  });

  it('returns undefined for garbage and null', () => {
    expect(parseRetryAfter('not-a-date')).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
  });
});

describe('ProviderError', () => {
  it('carries kind/status/retryable/retryAfterMs metadata', () => {
    const e = new ProviderError('rate limited', {
      kind: 'http',
      status: 429,
      retryable: true,
      retryAfterMs: 1000,
    });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ProviderError');
    expect(e.kind).toBe('http');
    expect(e.status).toBe(429);
    expect(e.retryable).toBe(true);
    expect(e.retryAfterMs).toBe(1000);
  });

  it('defaults to a non-retryable http error', () => {
    const e = new ProviderError('x');
    expect(e.kind).toBe('http');
    expect(e.retryable).toBe(false);
    expect(e.status).toBeUndefined();
  });
});
