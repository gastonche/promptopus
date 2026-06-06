import type { GenerateOptions, GenerateResult, Provider } from '../domain/provider.js';
import { estimateTokens } from './tokens.js';

export interface MockProviderConfig {
  name: string;
  model: string;
  text?: string;
}

export class MockProvider implements Provider {
  readonly name: string;
  readonly model: string;
  private readonly text: string | undefined;

  constructor(config: MockProviderConfig) {
    this.name = config.name;
    this.model = config.model;
    this.text = config.text;
  }

  generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult> {
    const text = this.text ?? prompt;
    const systemPrompt = opts?.systemPrompt ?? '';
    const tokensIn = estimateTokens(`${systemPrompt}\n${prompt}`);
    const tokensOut = estimateTokens(text);
    const latencyMs = 4 + (text.length % 17);
    return Promise.resolve({ text, tokensIn, tokensOut, latencyMs, costUsd: 0 });
  }
}
