import { describe, expect, it } from 'vitest';

import type { GenerateResult } from '../../domain/provider.js';
import type { TestCase } from '../../domain/testcase.js';
import { regexGrader } from './regex.js';

const out = (text: string): GenerateResult => ({
  text,
  tokensIn: 1,
  tokensOut: 1,
  latencyMs: 1,
  costUsd: 0,
});
const tc: TestCase = { id: 't', prompt: 'p', graders: [] };
const ctx = (text: string) => ({
  testCase: tc,
  output: out(text),
  provider: { name: 'p', model: 'm' },
});

describe('regexGrader', () => {
  it('is deterministic when one instance is reused across providers (no global-flag state leak)', async () => {
    // The runner reuses a single grader instance for every provider's output of a case.
    // A `g`-flagged RegExp would advance lastIndex between .test calls — this guards that.
    const g = regexGrader({ type: 'regex', pattern: 'foo', flags: 'g' });
    expect((await g.grade(ctx('foo bar'))).passed).toBe(true);
    expect((await g.grade(ctx('nope'))).passed).toBe(false);
    expect((await g.grade(ctx('foo bar'))).passed).toBe(true);
    expect((await g.grade(ctx('foo bar'))).passed).toBe(true);
  });

  it('honors flags and rejects an invalid pattern at construction', async () => {
    const i = regexGrader({ type: 'regex', pattern: 'ERROR', flags: 'i' });
    expect((await i.grade(ctx('an error occurred'))).passed).toBe(true);
    expect(() => regexGrader({ type: 'regex', pattern: '(' })).toThrow(/invalid regex/);
  });
});
