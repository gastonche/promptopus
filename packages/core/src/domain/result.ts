import type { GraderFamily, GraderResult } from './grader.js';
import type { GenerateResult } from './provider.js';

export interface RunResult {
  caseId: string;
  providerName: string;
  status: 'ok' | 'error';
  output?: GenerateResult;
  graderResults: GraderResult[];
  error?: { message: string; kind: string };
}

export interface ProviderSummary {
  providerName: string;
  model: string;
  caseCount: number;
  errorCount: number;
  passRate: number;
  meanScoreByFamily: Record<GraderFamily, number | null>;
  cost: { totalUsd: number; meanUsd: number };
  latency: { p50Ms: number; p95Ms: number; meanMs: number };
  tokens: { totalIn: number; totalOut: number };
}

export interface ReportCase {
  id: string;
  prompt: string;
  description?: string;
  source?: string;
  reference?: string;
}

export interface Report {
  suiteName: string;
  generatedAt: string;
  cases: ReportCase[];
  providers: ProviderSummary[];
  results: RunResult[];
  meta: {
    promptopusVersion: string;
    caseCount: number;
    providerCount: number;
  };
}
