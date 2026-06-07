import { describe, expect, it } from 'vitest';

import type { GenerateResult } from '../domain/provider.js';
import type { TestCase } from '../domain/testcase.js';
import { createGrader } from './registry.js';
import { GraderError } from './errors.js';

function out(text: string, extra: Partial<GenerateResult> = {}): GenerateResult {
  return { text, tokensIn: 1, tokensOut: 1, latencyMs: 1, costUsd: 0, ...extra };
}

const testCase: TestCase = { id: 't', prompt: 'p', graders: [] };

function grade(spec: Parameters<typeof createGrader>[0], text: string) {
  const grader = createGrader(spec);
  return grader.grade({ testCase, output: out(text), provider: { name: 'p', model: 'm' } });
}

function gradeOutput(spec: Parameters<typeof createGrader>[0], output: GenerateResult) {
  return createGrader(spec).grade({ testCase, output, provider: { name: 'p', model: 'm' } });
}

describe('deterministic graders', () => {
  it('non-empty', async () => {
    expect((await grade({ type: 'non-empty' }, 'hi')).passed).toBe(true);
    expect((await grade({ type: 'non-empty' }, '   ')).passed).toBe(false);
  });

  it('max-length', async () => {
    expect((await grade({ type: 'max-length', chars: 5 }, 'hi')).passed).toBe(true);
    expect((await grade({ type: 'max-length', chars: 1 }, 'hello')).passed).toBe(false);
  });

  it('equals respects trim + caseInsensitive', async () => {
    expect(
      (
        await grade(
          { type: 'equals', value: 'Paris', caseInsensitive: true, trim: true },
          '  paris ',
        )
      ).passed,
    ).toBe(true);
    expect((await grade({ type: 'equals', value: 'Paris' }, 'paris')).passed).toBe(false);
  });

  it('contains', async () => {
    expect((await grade({ type: 'contains', value: 'Tokyo' }, 'In Tokyo today')).passed).toBe(true);
    expect(
      (await grade({ type: 'contains', value: 'tokyo', caseInsensitive: true }, 'TOKYO')).passed,
    ).toBe(true);
  });

  it('regex', async () => {
    expect((await grade({ type: 'regex', pattern: '^\\d+$' }, '123')).passed).toBe(true);
    expect((await grade({ type: 'regex', pattern: '^\\d+$' }, '12a')).passed).toBe(false);
  });

  it('is-valid-json', async () => {
    expect((await grade({ type: 'is-valid-json' }, '{"a":1}')).passed).toBe(true);
    expect((await grade({ type: 'is-valid-json' }, 'not json')).passed).toBe(false);
  });

  it('json-schema validates type + required', async () => {
    const schema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } };
    expect((await grade({ type: 'json-schema', schema }, '{"name":"x"}')).passed).toBe(true);
    const bad = await grade({ type: 'json-schema', schema }, '{"age":3}');
    expect(bad.passed).toBe(false);
    expect(bad.detail).toMatch(/required/);
  });
});

describe('benchmark graders', () => {
  it('latency-budget passes under budget, fails over with partial score', async () => {
    const ok = await gradeOutput(
      { type: 'latency-budget', p95Ms: 1000 },
      out('x', { latencyMs: 500 }),
    );
    expect(ok.passed).toBe(true);
    expect(ok.score).toBe(1);
    const slow = await gradeOutput(
      { type: 'latency-budget', maxMs: 1000 },
      out('x', { latencyMs: 2000 }),
    );
    expect(slow.passed).toBe(false);
    expect(slow.score).toBeCloseTo(0.5, 5);
  });

  it('cost-budget compares computed USD cost', async () => {
    const ok = await gradeOutput(
      { type: 'cost-budget', maxUsd: 0.01 },
      out('x', { costUsd: 0.004 }),
    );
    expect(ok.passed).toBe(true);
    const over = await gradeOutput(
      { type: 'cost-budget', maxUsd: 0.001 },
      out('x', { costUsd: 0.004 }),
    );
    expect(over.passed).toBe(false);
  });
});

describe('grader registry guards', () => {
  it('judge graders require a configured judge model', () => {
    expect(() => createGrader({ type: 'judge-quality', threshold: 0.7 })).toThrowError(GraderError);
    expect(() => createGrader({ type: 'judge-faithfulness', threshold: 0.7 })).toThrowError(
      /judge/,
    );
  });
});
