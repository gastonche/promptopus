import { describe, expect, it } from 'vitest';

import { computeCostUsd, hasPricing } from './pricing.js';

describe('computeCostUsd', () => {
  it('computes USD from the per-model table (hand-checked)', () => {
    // gpt-4o-mini: $0.15 / MTok in, $0.60 / MTok out.
    const expected = (1000 * 0.15 + 500 * 0.6) / 1_000_000;
    expect(expected).toBeCloseTo(0.00045, 10);
    expect(computeCostUsd('gpt-4o-mini', 1000, 500)).toBeCloseTo(expected, 12);
  });

  it('returns 0 for an unknown model', () => {
    expect(computeCostUsd('does-not-exist', 1000, 1000)).toBe(0);
  });

  it('hasPricing reflects table membership', () => {
    expect(hasPricing('gpt-4o-mini')).toBe(true);
    expect(hasPricing('does-not-exist')).toBe(false);
  });
});
