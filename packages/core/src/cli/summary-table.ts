import type { ProviderSummary, Report } from '../domain/result.js';
import { style } from './ui.js';

type Direction = 'high' | 'low' | 'none';

interface Row {
  label: string;
  better: Direction;
  values: Array<{ display: string; numeric: number | null }>;
}

function fmtScore(v: number | null): { display: string; numeric: number | null } {
  return v === null ? { display: '—', numeric: null } : { display: v.toFixed(2), numeric: v };
}

function buildRows(providers: ProviderSummary[]): Row[] {
  return [
    {
      label: 'Pass rate',
      better: 'high',
      values: providers.map((p) => ({ display: `${Math.round(p.passRate * 100)}%`, numeric: p.passRate })),
    },
    {
      label: 'Score · deterministic',
      better: 'high',
      values: providers.map((p) => fmtScore(p.meanScoreByFamily.deterministic)),
    },
    {
      label: 'Score · judge',
      better: 'high',
      values: providers.map((p) => fmtScore(p.meanScoreByFamily.judge)),
    },
    {
      label: 'Score · benchmark',
      better: 'high',
      values: providers.map((p) => fmtScore(p.meanScoreByFamily.benchmark)),
    },
    {
      label: 'Cost · total',
      better: 'low',
      values: providers.map((p) => ({ display: `$${p.cost.totalUsd.toFixed(4)}`, numeric: p.cost.totalUsd })),
    },
    {
      label: 'Cost · mean/call',
      better: 'low',
      values: providers.map((p) => ({ display: `$${p.cost.meanUsd.toFixed(4)}`, numeric: p.cost.meanUsd })),
    },
    {
      label: 'Latency · p50',
      better: 'low',
      values: providers.map((p) => ({ display: `${Math.round(p.latency.p50Ms)}ms`, numeric: p.latency.p50Ms })),
    },
    {
      label: 'Latency · p95',
      better: 'low',
      values: providers.map((p) => ({ display: `${Math.round(p.latency.p95Ms)}ms`, numeric: p.latency.p95Ms })),
    },
    {
      label: 'Errors',
      better: 'low',
      values: providers.map((p) => ({ display: String(p.errorCount), numeric: p.errorCount })),
    },
  ];
}

function bestWorstIndices(row: Row): { best: Set<number>; worst: Set<number> } {
  const best = new Set<number>();
  const worst = new Set<number>();
  if (row.better === 'none') return { best, worst };
  const nums = row.values.map((v) => v.numeric).filter((n): n is number => n !== null);
  if (nums.length < 2) return { best, worst };
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  if (max === min) return { best, worst };
  const bestVal = row.better === 'high' ? max : min;
  const worstVal = row.better === 'high' ? min : max;
  row.values.forEach((v, i) => {
    if (v.numeric === bestVal) best.add(i);
    else if (v.numeric === worstVal) worst.add(i);
  });
  return { best, worst };
}

function pad(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - text.length));
}

export function renderSummaryTable(report: Report): string {
  const providers = report.providers;
  const rows = buildRows(providers);

  const labelWidth = Math.max('Metric'.length, ...rows.map((r) => r.label.length));
  const colWidths = providers.map((p, i) =>
    Math.max(p.providerName.length, ...rows.map((r) => r.values[i]?.display.length ?? 0)),
  );

  const lines: string[] = [];
  const header =
    pad('Metric', labelWidth) +
    '  ' +
    providers.map((p, i) => style.bold(pad(p.providerName, colWidths[i] as number))).join('  ');
  lines.push(header);
  lines.push(
    style.dim('-'.repeat(labelWidth) + '  ' + colWidths.map((w) => '-'.repeat(w)).join('  ')),
  );

  for (const row of rows) {
    const { best, worst } = bestWorstIndices(row);
    const cells = row.values.map((v, i) => {
      const padded = pad(v.display, colWidths[i] as number);
      if (best.has(i)) return style.green(padded);
      if (worst.has(i)) return style.red(padded);
      return padded;
    });
    lines.push(pad(row.label, labelWidth) + '  ' + cells.join('  '));
  }

  return lines.join('\n');
}
