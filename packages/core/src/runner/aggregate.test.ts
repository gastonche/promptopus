import { describe, expect, it } from 'vitest';

import type { GraderResult } from '../domain/grader.js';
import type { RunResult } from '../domain/result.js';
import type { EvalSuite } from '../domain/testcase.js';
import { buildReport } from './aggregate.js';

const grade = (family: GraderResult['family'], passed: boolean, score: number): GraderResult => ({
  graderId: `${family}-${score}`,
  family,
  passed,
  score,
  detail: '',
});

function okCell(
  caseId: string,
  provider: string,
  m: { tin: number; tout: number; ms: number; cost: number; graders: GraderResult[] },
): RunResult {
  return {
    caseId,
    providerName: provider,
    status: 'ok',
    output: { text: 't', tokensIn: m.tin, tokensOut: m.tout, latencyMs: m.ms, costUsd: m.cost },
    graderResults: m.graders,
  };
}

const suite = (ids: string[]): EvalSuite => ({
  name: 's',
  providers: [],
  cases: ids.map((id) => ({ id, prompt: 'p', graders: [] })),
});

describe('buildReport', () => {
  it('aggregates pass rate, per-family means, cost, latency, and tokens', () => {
    const results: RunResult[] = [
      okCell('a', 'p1', {
        tin: 10,
        tout: 5,
        ms: 100,
        cost: 0.001,
        graders: [grade('deterministic', true, 1), grade('judge', true, 0.8)],
      }),
      okCell('b', 'p1', {
        tin: 20,
        tout: 10,
        ms: 300,
        cost: 0.003,
        graders: [grade('deterministic', false, 0), grade('judge', true, 1)],
      }),
    ];
    const report = buildReport(suite(['a', 'b']), [{ name: 'p1', model: 'm' }], results, 'now');
    const p = report.providers[0]!;
    expect(p.caseCount).toBe(2);
    expect(p.errorCount).toBe(0);
    expect(p.passRate).toBeCloseTo(3 / 4, 5);
    expect(p.meanScoreByFamily.deterministic).toBeCloseTo(0.5, 5);
    expect(p.meanScoreByFamily.judge).toBeCloseTo(0.9, 5);
    expect(p.meanScoreByFamily.benchmark).toBeNull();
    expect(p.cost.totalUsd).toBeCloseTo(0.004, 6);
    expect(p.cost.meanUsd).toBeCloseTo(0.002, 6);
    expect(p.tokens).toEqual({ totalIn: 30, totalOut: 15 });
    expect(p.latency.p50Ms).toBe(100);
    expect(p.latency.p95Ms).toBe(300);
  });

  it('handles an all-error provider without dividing by zero', () => {
    const results: RunResult[] = [
      {
        caseId: 'a',
        providerName: 'p1',
        status: 'error',
        graderResults: [],
        error: { message: 'boom', kind: 'http' },
      },
    ];
    const report = buildReport(suite(['a']), [{ name: 'p1', model: 'm' }], results, 'now');
    const p = report.providers[0]!;
    expect(p.errorCount).toBe(1);
    expect(p.passRate).toBe(0);
    expect(p.meanScoreByFamily.deterministic).toBeNull();
    expect(p.cost.totalUsd).toBe(0);
    expect(p.cost.meanUsd).toBe(0);
    expect(p.latency.p50Ms).toBe(0);
  });

  it('records the report metadata', () => {
    const report = buildReport(suite(['a']), [{ name: 'p1', model: 'm' }], [], '2026-01-01');
    expect(report.suiteName).toBe('s');
    expect(report.generatedAt).toBe('2026-01-01');
    expect(report.meta.caseCount).toBe(1);
    expect(report.meta.providerCount).toBe(1);
    expect(report.cases[0]).toMatchObject({ id: 'a', prompt: 'p' });
  });
});
