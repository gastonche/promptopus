import { z } from 'zod';

import type { JudgeConfig, ProviderSpec } from '../../config/schema.js';
import type { Provider } from '../../domain/provider.js';
import { createProvider } from '../../providers/registry.js';
import { GraderError } from '../errors.js';

export class JudgeError extends GraderError {
  constructor(message: string) {
    super(message);
    this.name = 'JudgeError';
  }
}

export interface JudgeVerdict {
  score: number;
  reasoning: string;
}

const VerdictSchema = z.object({
  score: z.number(),
  reasoning: z.string().optional(),
});

const JUDGE_SYSTEM =
  'You are a meticulous evaluation judge. Reply with a single minified JSON object and nothing else.';

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1] ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new JudgeError('judge response contained no JSON object');
  }
  return candidate.slice(start, end + 1);
}

export function parseVerdict(text: string): JudgeVerdict {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonObject(text));
  } catch (err) {
    if (err instanceof JudgeError) throw err;
    throw new JudgeError(`judge response was not valid JSON: ${(err as Error).message}`);
  }
  const parsed = VerdictSchema.safeParse(raw);
  if (!parsed.success) {
    throw new JudgeError(`judge response missing a numeric "score"`);
  }
  const score = Math.min(1, Math.max(0, parsed.data.score));
  return { score, reasoning: parsed.data.reasoning ?? '' };
}

export class JudgeClient {
  constructor(
    private readonly provider: Provider,
    private readonly maxTokens = 512,
  ) {}

  async evaluate(prompt: string): Promise<JudgeVerdict> {
    const result = await this.provider.generate(prompt, {
      systemPrompt: JUDGE_SYSTEM,
      temperature: 0,
      maxTokens: this.maxTokens,
    });
    return parseVerdict(result.text);
  }
}

function judgeConfigToSpec(judge: JudgeConfig): ProviderSpec {
  switch (judge.provider) {
    case 'mock': {
      const spec: Extract<ProviderSpec, { kind: 'mock' }> = {
        kind: 'mock',
        name: 'judge',
        model: judge.model,
      };
      if (judge.text !== undefined) spec.text = judge.text;
      return spec;
    }
    case 'openai':
    case 'openai-compat': {
      const spec: Extract<ProviderSpec, { kind: 'openai' | 'openai-compat' }> = {
        kind: judge.provider,
        name: 'judge',
        model: judge.model,
      };
      if (judge.apiKeyEnv !== undefined) spec.apiKeyEnv = judge.apiKeyEnv;
      if (judge.baseUrl !== undefined) spec.baseUrl = judge.baseUrl;
      if (judge.baseUrlEnv !== undefined) spec.baseUrlEnv = judge.baseUrlEnv;
      return spec;
    }
    case 'anthropic': {
      const spec: Extract<ProviderSpec, { kind: 'anthropic' }> = {
        kind: 'anthropic',
        name: 'judge',
        model: judge.model,
      };
      if (judge.apiKeyEnv !== undefined) spec.apiKeyEnv = judge.apiKeyEnv;
      return spec;
    }
  }
}

export function buildJudgeClient(judge: JudgeConfig): JudgeClient {
  return new JudgeClient(createProvider(judgeConfigToSpec(judge)));
}
