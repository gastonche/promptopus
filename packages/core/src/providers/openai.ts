import type { GenerateOptions, GenerateResult, Provider } from '../domain/provider.js';
import { parseRetryAfter, ProviderError } from './errors.js';
import { computeCostUsd } from './pricing.js';
import { estimateTokens } from './tokens.js';

export interface OpenAIProviderConfig {
  name: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_TIMEOUT_MS = 60_000;
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

export class OpenAIProvider implements Provider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly temperature: number | undefined;
  private readonly maxTokens: number | undefined;
  private readonly timeoutMs: number;

  constructor(config: OpenAIProviderConfig) {
    this.name = config.name;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult> {
    const messages: Array<{ role: string; content: string }> = [];
    const systemPrompt = opts?.systemPrompt;
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const body: Record<string, unknown> = { model: this.model, messages };
    const temperature = this.temperature ?? opts?.temperature;
    const maxTokens = this.maxTokens ?? opts?.maxTokens;
    if (temperature !== undefined) body['temperature'] = temperature;
    if (maxTokens !== undefined) body['max_tokens'] = maxTokens;

    const start = performance.now();
    const data = await this.post(body);
    const latencyMs = Math.round(performance.now() - start);

    const text = data.choices?.[0]?.message?.content ?? '';
    const tokensIn = data.usage?.prompt_tokens ?? estimateTokens(`${systemPrompt ?? ''}\n${prompt}`);
    const tokensOut = data.usage?.completion_tokens ?? estimateTokens(text);
    const costUsd = computeCostUsd(this.model, tokensIn, tokensOut);

    return { text, tokensIn, tokensOut, latencyMs, costUsd };
  }

  private async post(body: Record<string, unknown>): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.apiKey) headers['authorization'] = `Bearer ${this.apiKey}`;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
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
      return (await response.json()) as ChatCompletionResponse;
    } catch (err) {
      throw new ProviderError(`could not parse response from ${this.name}`, {
        kind: 'parse',
        cause: err,
      });
    }
  }
}
