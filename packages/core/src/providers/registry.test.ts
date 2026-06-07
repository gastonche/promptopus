import { afterEach, describe, expect, it } from 'vitest';

import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { ProviderError } from './errors.js';
import { createProvider } from './registry.js';

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe('createProvider', () => {
  it('builds an Anthropic provider when the key is present', () => {
    process.env['ANTHROPIC_API_KEY'] = 'x';
    const p = createProvider({ kind: 'anthropic', name: 'h', model: 'claude-3-5-haiku-latest' });
    expect(p).toBeInstanceOf(AnthropicProvider);
  });

  it('throws a missing_key ProviderError when the key is absent', () => {
    delete process.env['ANTHROPIC_API_KEY'];
    try {
      createProvider({ kind: 'anthropic', name: 'h', model: 'm' });
      throw new Error('expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('missing_key');
    }
  });

  it('requires a base URL for openai-compat', () => {
    expect(() => createProvider({ kind: 'openai-compat', name: 'c', model: 'm' })).toThrowError(
      /base URL/,
    );
  });

  it('builds openai-compat with an explicit baseUrl (no key needed)', () => {
    const p = createProvider({
      kind: 'openai-compat',
      name: 'c',
      model: 'm',
      baseUrl: 'http://localhost:1234/v1',
    });
    expect(p).toBeInstanceOf(OpenAIProvider);
  });
});
