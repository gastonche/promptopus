import type { ProviderSummary } from '../types';

export type Direction = 'high' | 'low' | 'none';

export interface MatrixCell {
  display: string;
  numeric: number | null;
  best: boolean;
  worst: boolean;
}

export interface MatrixRow {
  label: string;
  hint: string;
  cells: MatrixCell[];
}

function score(v: number | null): { display: string; numeric: number | null } {
  return v === null ? { display: '—', numeric: null } : { display: v.toFixed(2), numeric: v };
}

function markBestWorst(
  values: Array<{ display: string; numeric: number | null }>,
  better: Direction,
): MatrixCell[] {
  const nums = values.map((v) => v.numeric).filter((n): n is number => n !== null);
  let bestVal: number | null = null;
  let worstVal: number | null = null;
  if (better !== 'none' && nums.length >= 2) {
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max !== min) {
      bestVal = better === 'high' ? max : min;
      worstVal = better === 'high' ? min : max;
    }
  }
  return values.map((v) => ({
    display: v.display,
    numeric: v.numeric,
    best: v.numeric !== null && v.numeric === bestVal,
    worst: v.numeric !== null && v.numeric === worstVal,
  }));
}

export function buildMatrix(providers: ProviderSummary[]): MatrixRow[] {
  const row = (
    label: string,
    hint: string,
    better: Direction,
    values: Array<{ display: string; numeric: number | null }>,
  ): MatrixRow => ({ label, hint, cells: markBestWorst(values, better) });

  return [
    row(
      'Pass rate',
      'Share of grader checks that passed',
      'high',
      providers.map((p) => ({ display: `${Math.round(p.passRate * 100)}%`, numeric: p.passRate })),
    ),
    row(
      'Deterministic',
      'Mean score · assertion graders',
      'high',
      providers.map((p) => score(p.meanScoreByFamily.deterministic)),
    ),
    row(
      'Judge',
      'Mean score · LLM-as-judge graders',
      'high',
      providers.map((p) => score(p.meanScoreByFamily.judge)),
    ),
    row(
      'Benchmark',
      'Mean score · cost/latency budgets',
      'high',
      providers.map((p) => score(p.meanScoreByFamily.benchmark)),
    ),
    row(
      'Total cost',
      'Summed USD across all cases',
      'low',
      providers.map((p) => ({ display: `$${p.cost.totalUsd.toFixed(4)}`, numeric: p.cost.totalUsd })),
    ),
    row(
      'Cost / call',
      'Mean USD per generation',
      'low',
      providers.map((p) => ({ display: `$${p.cost.meanUsd.toFixed(4)}`, numeric: p.cost.meanUsd })),
    ),
    row(
      'Latency p50',
      'Median call latency',
      'low',
      providers.map((p) => ({ display: `${Math.round(p.latency.p50Ms)} ms`, numeric: p.latency.p50Ms })),
    ),
    row(
      'Latency p95',
      'Tail call latency',
      'low',
      providers.map((p) => ({ display: `${Math.round(p.latency.p95Ms)} ms`, numeric: p.latency.p95Ms })),
    ),
    row(
      'Errors',
      'Cells that failed to generate',
      'low',
      providers.map((p) => ({ display: String(p.errorCount), numeric: p.errorCount })),
    ),
  ];
}

export function familyOf(graderId: string): 'deterministic' | 'judge' | 'benchmark' {
  if (graderId.startsWith('judge-')) return 'judge';
  if (graderId.startsWith('latency-budget') || graderId.startsWith('cost-budget')) return 'benchmark';
  return 'deterministic';
}
