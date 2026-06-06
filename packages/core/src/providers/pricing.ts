export interface ModelPricing {
  inPerMTok: number;
  outPerMTok: number;
}

export const PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inPerMTok: 0.15, outPerMTok: 0.6 },
  'gpt-4o': { inPerMTok: 2.5, outPerMTok: 10 },
  'gpt-4.1-mini': { inPerMTok: 0.4, outPerMTok: 1.6 },
  'claude-3-5-haiku-latest': { inPerMTok: 0.8, outPerMTok: 4 },
  'claude-3-5-sonnet-latest': { inPerMTok: 3, outPerMTok: 15 },
  'claude-3-7-sonnet-latest': { inPerMTok: 3, outPerMTok: 15 },
  'claude-haiku-4-5': { inPerMTok: 1, outPerMTok: 5 },
  'claude-sonnet-4-5': { inPerMTok: 3, outPerMTok: 15 },
  '@cf/meta/llama-3.1-8b-instruct': { inPerMTok: 0.045, outPerMTok: 0.384 },
  '@cf/meta/llama-3.3-70b-instruct': { inPerMTok: 0.293, outPerMTok: 2.253 },
  'workers-ai/@cf/meta/llama-3.1-8b-instruct': { inPerMTok: 0.045, outPerMTok: 0.384 },
  'workers-ai/@cf/meta/llama-3.3-70b-instruct': { inPerMTok: 0.293, outPerMTok: 2.253 },
};

export function computeCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const price = PRICING[model];
  if (!price) return 0;
  return (tokensIn * price.inPerMTok + tokensOut * price.outPerMTok) / 1_000_000;
}

export function hasPricing(model: string): boolean {
  return model in PRICING;
}
