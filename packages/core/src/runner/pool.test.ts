import { describe, expect, it } from 'vitest';

import { mapPool } from './pool.js';

describe('mapPool', () => {
  it('preserves order regardless of completion timing', async () => {
    const out = await mapPool([1, 2, 3, 4], 2, async (x) => {
      await new Promise((r) => setTimeout(r, (5 - x) * 3));
      return x * 10;
    });
    expect(out).toEqual([10, 20, 30, 40]);
  });

  it('never exceeds the concurrency cap', async () => {
    let inFlight = 0;
    let peak = 0;
    await mapPool(
      Array.from({ length: 12 }, (_, i) => i),
      3,
      async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 4));
        inFlight -= 1;
      },
    );
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it('handles empty input and a cap larger than the input', async () => {
    expect(await mapPool([], 4, async (x) => x)).toEqual([]);
    expect(await mapPool([1, 2], 10, async (x) => x + 1)).toEqual([2, 3]);
  });
});
