import type { GraderFamily } from '../domain/grader.js';
import type { EvalSuite } from '../domain/testcase.js';
import type { ProviderSummary, Report, ReportCase, RunResult } from '../domain/result.js';
import { VERSION } from '../cli/version.js';

export interface ProviderIdentity {
  name: string;
  model: string;
}

const FAMILIES: GraderFamily[] = ['deterministic', 'judge', 'benchmark'];

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(Math.max(rank, 1), sorted.length) - 1;
  return sorted[index] as number;
}

function summarizeProvider(identity: ProviderIdentity, results: RunResult[]): ProviderSummary {
  const own = results.filter((r) => r.providerName === identity.name);
  const ok = own.filter((r) => r.status === 'ok');
  const errorCount = own.length - ok.length;

  const graderResults = ok.flatMap((r) => r.graderResults);
  const passedChecks = graderResults.filter((g) => g.passed).length;
  const passRate = graderResults.length === 0 ? 0 : passedChecks / graderResults.length;

  const meanScoreByFamily = Object.fromEntries(
    FAMILIES.map((family) => {
      const scores = graderResults.filter((g) => g.family === family).map((g) => g.score);
      return [family, scores.length === 0 ? null : mean(scores)];
    }),
  ) as Record<GraderFamily, number | null>;

  const costs = ok.map((r) => r.output?.costUsd ?? 0);
  const latencies = ok.map((r) => r.output?.latencyMs ?? 0);
  const totalUsd = costs.reduce((a, b) => a + b, 0);
  const tokensIn = ok.reduce((a, r) => a + (r.output?.tokensIn ?? 0), 0);
  const tokensOut = ok.reduce((a, r) => a + (r.output?.tokensOut ?? 0), 0);

  return {
    providerName: identity.name,
    model: identity.model,
    caseCount: own.length,
    errorCount,
    passRate,
    meanScoreByFamily,
    cost: { totalUsd, meanUsd: ok.length === 0 ? 0 : totalUsd / ok.length },
    latency: {
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      meanMs: mean(latencies),
    },
    tokens: { totalIn: tokensIn, totalOut: tokensOut },
  };
}

export function buildReport(
  suite: EvalSuite,
  providers: ReadonlyArray<ProviderIdentity>,
  results: RunResult[],
  generatedAt: string,
): Report {
  const cases: ReportCase[] = suite.cases.map((c) => {
    const info: ReportCase = { id: c.id, prompt: c.prompt };
    if (c.description !== undefined) info.description = c.description;
    if (c.source !== undefined) info.source = c.source;
    if (c.reference !== undefined) info.reference = c.reference;
    return info;
  });

  return {
    suiteName: suite.name,
    generatedAt,
    cases,
    providers: providers.map((p) => summarizeProvider(p, results)),
    results,
    meta: {
      promptopusVersion: VERSION,
      caseCount: suite.cases.length,
      providerCount: providers.length,
    },
  };
}
