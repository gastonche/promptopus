import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnthropicProvider } from './anthropic.js';
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

describe('AnthropicProvider', () => {
  it('joins text blocks, reads usage, computes cost, sends required fields', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        content: [
          { type: 'text', text: 'Paris' },
          { type: 'text', text: '.' },
        ],
        usage: { input_tokens: 20, output_tokens: 4 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new AnthropicProvider({
      name: 'haiku',
      model: 'claude-3-5-haiku-latest',
      apiKey: 'k',
    });
    const result = await provider.generate('Capital of France?', { systemPrompt: 'be terse' });

    expect(result.text).toBe('Paris.');
    expect(result.tokensIn).toBe(20);
    expect(result.tokensOut).toBe(4);
    expect(result.costUsd).toBeCloseTo(computeCostUsd('claude-3-5-haiku-latest', 20, 4), 10);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/messages$/);
    expect((init.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01');
    const sent = JSON.parse(init.body as string);
    expect(sent.system).toBe('be terse');
    expect(sent.max_tokens).toBeGreaterThan(0);
    expect(sent.messages).toEqual([{ role: 'user', content: 'Capital of France?' }]);
  });

  it('maps 529 (overloaded) to a retryable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'overloaded' }, 529)),
    );
    const provider = new AnthropicProvider({
      name: 'haiku',
      model: 'claude-3-5-haiku-latest',
      apiKey: 'k',
    });
    await expect(provider.generate('hi')).rejects.toMatchObject({ status: 529, retryable: true });
  });
});
