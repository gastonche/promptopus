import type { Provider } from '../domain/provider.js';
import { AnthropicProvider, type AnthropicProviderConfig } from './anthropic.js';
import { ProviderError } from './errors.js';
import { MockProvider } from './mock.js';
import { OpenAIProvider, type OpenAIProviderConfig } from './openai.js';
import { createOpenAICompatProvider } from './openai-compat.js';

export interface ProviderSpecInput {
  kind: string;
  name: string;
  model?: string;
  [key: string]: unknown;
}

export type ProviderFactory = (spec: ProviderSpecInput) => Provider;

function requireKey(env: string, providerName: string): string {
  const value = process.env[env];
  if (!value) {
    throw new ProviderError(`provider "${providerName}" is missing its API key — set ${env}`, {
      kind: 'missing_key',
    });
  }
  return value;
}

function str(spec: ProviderSpecInput, key: string): string | undefined {
  const v = spec[key];
  return typeof v === 'string' ? v : undefined;
}

function num(spec: ProviderSpecInput, key: string): number | undefined {
  const v = spec[key];
  return typeof v === 'number' ? v : undefined;
}

function buildMock(spec: ProviderSpecInput): Provider {
  const config: { name: string; model: string; text?: string } = {
    name: spec.name,
    model: spec.model ?? 'mock',
  };
  const text = str(spec, 'text');
  if (text !== undefined) config.text = text;
  return new MockProvider(config);
}

function buildOpenAI(spec: ProviderSpecInput): Provider {
  const config: OpenAIProviderConfig = {
    name: spec.name,
    model: spec.model ?? '',
    apiKey: requireKey(str(spec, 'apiKeyEnv') ?? 'OPENAI_API_KEY', spec.name),
  };
  const baseUrl = str(spec, 'baseUrl') ?? envOf(str(spec, 'baseUrlEnv'));
  if (baseUrl) config.baseUrl = baseUrl;
  const t = num(spec, 'temperature');
  const m = num(spec, 'maxTokens');
  if (t !== undefined) config.temperature = t;
  if (m !== undefined) config.maxTokens = m;
  return new OpenAIProvider(config);
}

function buildAnthropic(spec: ProviderSpecInput): Provider {
  const config: AnthropicProviderConfig = {
    name: spec.name,
    model: spec.model ?? '',
    apiKey: requireKey(str(spec, 'apiKeyEnv') ?? 'ANTHROPIC_API_KEY', spec.name),
  };
  const t = num(spec, 'temperature');
  const m = num(spec, 'maxTokens');
  if (t !== undefined) config.temperature = t;
  if (m !== undefined) config.maxTokens = m;
  return new AnthropicProvider(config);
}

function buildOpenAICompat(spec: ProviderSpecInput): Provider {
  const baseUrl = str(spec, 'baseUrl') ?? envOf(str(spec, 'baseUrlEnv'));
  if (!baseUrl) {
    throw new ProviderError(
      `provider "${spec.name}" (openai-compat) needs a base URL — set baseUrl or point baseUrlEnv at one`,
      { kind: 'missing_key' },
    );
  }
  const config: OpenAIProviderConfig = { name: spec.name, model: spec.model ?? '', baseUrl };
  const apiKeyEnv = str(spec, 'apiKeyEnv');
  if (apiKeyEnv) config.apiKey = requireKey(apiKeyEnv, spec.name);
  const t = num(spec, 'temperature');
  const m = num(spec, 'maxTokens');
  if (t !== undefined) config.temperature = t;
  if (m !== undefined) config.maxTokens = m;
  return createOpenAICompatProvider(config);
}

function envOf(name: string | undefined): string | undefined {
  return name ? process.env[name] : undefined;
}

export class ProviderRegistry {
  private readonly factories = new Map<string, ProviderFactory>();

  register(kind: string, factory: ProviderFactory): this {
    this.factories.set(kind, factory);
    return this;
  }

  has(kind: string): boolean {
    return this.factories.has(kind);
  }

  kinds(): string[] {
    return [...this.factories.keys()];
  }

  create(spec: ProviderSpecInput): Provider {
    const factory = this.factories.get(spec.kind);
    if (!factory) {
      throw new ProviderError(
        `unknown provider kind "${spec.kind}" (known: ${this.kinds().join(', ')})`,
        { kind: 'not_implemented' },
      );
    }
    return factory(spec);
  }
}

export function createProviderRegistry(): ProviderRegistry {
  return new ProviderRegistry()
    .register('mock', buildMock)
    .register('openai', buildOpenAI)
    .register('anthropic', buildAnthropic)
    .register('openai-compat', buildOpenAICompat);
}

const defaultRegistry = createProviderRegistry();

export function createProvider(spec: ProviderSpecInput): Provider {
  return defaultRegistry.create(spec);
}
