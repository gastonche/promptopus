export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costUsd: number;
}

export interface Provider {
  readonly name: string;
  readonly model: string;
  generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult>;
}
