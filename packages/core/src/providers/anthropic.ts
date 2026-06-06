import type { GenerateOptions, GenerateResult, Provider } from '../domain/provider.js';
import { parseRetryAfter, ProviderError } from './errors.js';
import { computeCostUsd } from './pricing.js';
import { estimateTokens } from './tokens.js';

export interface AnthropicProviderConfig {
  name: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

interface MessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = '2023-06-01';
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

export class AnthropicProvider implements Provider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly temperature: number | undefined;
  private readonly maxTokens: number | undefined;
  private readonly timeoutMs: number;

  constructor(config: AnthropicProviderConfig) {
    this.name = config.name;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens ?? opts?.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    };
    const systemPrompt = opts?.systemPrompt;
    if (systemPrompt) body['system'] = systemPrompt;
    const temperature = this.temperature ?? opts?.temperature;
    if (temperature !== undefined) body['temperature'] = temperature;

    const start = performance.now();
    const data = await this.post(body);
    const latencyMs = Math.round(performance.now() - start);

    const text = (data.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');
    const tokensIn = data.usage?.input_tokens ?? estimateTokens(`${systemPrompt ?? ''}\n${prompt}`);
    const tokensOut = data.usage?.output_tokens ?? estimateTokens(text);
    const costUsd = computeCostUsd(this.model, tokensIn, tokensOut);

    return { text, tokensIn, tokensOut, latencyMs, costUsd };
  }

  private async post(body: Record<string, unknown>): Promise<MessagesResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      throw new ProviderError(
        aborted ? `request timed out after ${this.timeoutMs}ms` : `network error: ${(err as Error).message}`,
        { kind: aborted ? 'timeout' : 'network', retryable: true, cause: err },
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
      throw new ProviderError(`HTTP ${response.status} from ${this.name}: ${detail.slice(0, 300)}`, {
        kind: 'http',
        status: response.status,
        retryable: RETRYABLE_STATUS.has(response.status),
        ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
      });
    }

    try {
      return (await response.json()) as MessagesResponse;
    } catch (err) {
      throw new ProviderError(`could not parse response from ${this.name}`, {
        kind: 'parse',
        cause: err,
      });
    }
  }
}
