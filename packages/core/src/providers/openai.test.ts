import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProviderError } from './errors.js';
import { OpenAIProvider } from './openai.js';
import { computeCostUsd } from './pricing.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAIProvider', () => {
  it('parses content, tokens, and computes cost', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        choices: [{ message: { content: 'Paris' } }],
        usage: { prompt_tokens: 12, completion_tokens: 3 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenAIProvider({ name: 'gpt', model: 'gpt-4o-mini', apiKey: 'k' });
    const result = await provider.generate('Capital of France?', { systemPrompt: 'be terse' });

    expect(result.text).toBe('Paris');
    expect(result.tokensIn).toBe(12);
    expect(result.tokensOut).toBe(3);
    expect(result.costUsd).toBeCloseTo(computeCostUsd('gpt-4o-mini', 12, 3), 10);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string);
    expect(sent.messages[0]).toEqual({ role: 'system', content: 'be terse' });
    expect(sent.messages[1]).toEqual({ role: 'user', content: 'Capital of France?' });
  });

  it('throws a retryable ProviderError on HTTP 429', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'rate limited' }, 429)));
    const provider = new OpenAIProvider({ name: 'gpt', model: 'gpt-4o-mini', apiKey: 'k' });
    await expect(provider.generate('hi')).rejects.toMatchObject({
      name: 'ProviderError',
      status: 429,
      retryable: true,
    });
  });

  it('marks 4xx (non-429) as non-retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'bad key' }, 401)));
    const provider = new OpenAIProvider({ name: 'gpt', model: 'gpt-4o-mini', apiKey: 'k' });
    await expect(provider.generate('hi')).rejects.toSatisfy(
      (e: unknown) => e instanceof ProviderError && e.retryable === false && e.status === 401,
    );
  });
});
