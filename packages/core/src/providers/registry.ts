import type { ProviderSpec } from '../config/schema.js';
import type { Provider } from '../domain/provider.js';
import { AnthropicProvider, type AnthropicProviderConfig } from './anthropic.js';
import { ProviderError } from './errors.js';
import { MockProvider } from './mock.js';
import { OpenAIProvider, type OpenAIProviderConfig } from './openai.js';
import { createOpenAICompatProvider } from './openai-compat.js';

function requireKey(env: string, providerName: string): string {
  const value = process.env[env];
  if (!value) {
    throw new ProviderError(`provider "${providerName}" is missing its API key — set ${env}`, {
      kind: 'missing_key',
    });
  }
  return value;
}

export function createProvider(spec: ProviderSpec): Provider {
  switch (spec.kind) {
    case 'mock': {
      const config: { name: string; model: string; text?: string } = {
        name: spec.name,
        model: spec.model,
      };
      if (spec.text !== undefined) config.text = spec.text;
      return new MockProvider(config);
    }

    case 'openai': {
      const config: OpenAIProviderConfig = {
        name: spec.name,
        model: spec.model,
        apiKey: requireKey(spec.apiKeyEnv ?? 'OPENAI_API_KEY', spec.name),
      };
      const baseUrl = spec.baseUrl ?? (spec.baseUrlEnv ? process.env[spec.baseUrlEnv] : undefined);
      if (baseUrl) config.baseUrl = baseUrl;
      if (spec.temperature !== undefined) config.temperature = spec.temperature;
      if (spec.maxTokens !== undefined) config.maxTokens = spec.maxTokens;
      return new OpenAIProvider(config);
    }

    case 'anthropic': {
      const config: AnthropicProviderConfig = {
        name: spec.name,
        model: spec.model,
        apiKey: requireKey(spec.apiKeyEnv ?? 'ANTHROPIC_API_KEY', spec.name),
      };
      if (spec.temperature !== undefined) config.temperature = spec.temperature;
      if (spec.maxTokens !== undefined) config.maxTokens = spec.maxTokens;
      return new AnthropicProvider(config);
    }

    case 'openai-compat': {
      const baseUrl = spec.baseUrl ?? (spec.baseUrlEnv ? process.env[spec.baseUrlEnv] : undefined);
      if (!baseUrl) {
        throw new ProviderError(
          `provider "${spec.name}" (openai-compat) needs a base URL — set baseUrl or point baseUrlEnv at one`,
          { kind: 'missing_key' },
        );
      }
      const config: OpenAIProviderConfig = { name: spec.name, model: spec.model, baseUrl };
      if (spec.apiKeyEnv) config.apiKey = requireKey(spec.apiKeyEnv, spec.name);
      if (spec.temperature !== undefined) config.temperature = spec.temperature;
      if (spec.maxTokens !== undefined) config.maxTokens = spec.maxTokens;
      return createOpenAICompatProvider(config);
    }
  }
}
