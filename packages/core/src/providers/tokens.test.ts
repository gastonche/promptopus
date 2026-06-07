import { describe, expect, it } from 'vitest';

import { estimateTokens } from './tokens.js';

describe('estimateTokens', () => {
  it('estimates ~chars/4 with a floor of 1 for non-empty text', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(40))).toBe(10);
  });
});
