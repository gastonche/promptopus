import type { GraderResult, Report } from '../types';
import { familyOf } from '../lib/metrics';

const FAMILY_STYLE: Record<string, string> = {
  deterministic: 'bg-pop-600/10 text-pop-700',
  judge: 'bg-pop-500/15 text-pop-600',
  benchmark: 'bg-warn/10 text-warn',
};

function FamilyChip({ graderId }: { graderId: string }) {
  const family = familyOf(graderId);
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${FAMILY_STYLE[family]}`}
    >
      {family}
    </span>
  );
}

function GraderRow({ result }: { result: GraderResult }) {
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span className={`mt-0.5 text-sm ${result.passed ? 'text-pass' : 'text-fail'}`}>
        {result.passed ? '✓' : '✗'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <FamilyChip graderId={result.graderId} />
          <span className="truncate font-mono text-xs text-ink/70">{result.graderId}</span>
          <span className="ml-auto tabular-nums text-xs font-semibold text-ink/60">
            {result.score.toFixed(2)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink/50">{result.detail}</p>
      </div>
    </li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink/40">{label}</div>
      <div className="tabular-nums text-sm font-semibold text-ink/80">{value}</div>
    </div>
  );
}

export function CaseDrilldown({ report, caseId }: { report: Report; caseId: string }) {
  const cells = report.results.filter((r) => r.caseId === caseId);
  const ordered = report.providers
    .map((p) => cells.find((c) => c.providerName === p.providerName))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ordered.map((cell) => (
        <div
          key={cell.providerName}
          className="flex flex-col rounded-2xl border border-pop-300/50 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-pop-300/40 px-4 py-2.5">
            <span className="font-semibold text-pop-700">{cell.providerName}</span>
            {cell.status === 'error' && (
              <span className="rounded-full bg-fail/10 px-2 py-0.5 text-xs font-semibold text-fail">
                error
              </span>
            )}
          </div>

          {cell.status === 'error' ? (
            <div className="m-4 rounded-lg bg-fail/5 p-3 text-sm text-fail">
              {cell.error?.message ?? 'generation failed'}
            </div>
          ) : (
            <>
              <pre className="mx-4 mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-xs leading-relaxed text-ink/80">
                {cell.output?.text}
              </pre>

              <ul className="divide-y divide-pop-300/30 px-4 py-2">
                {cell.graderResults.map((g, i) => (
                  <GraderRow key={i} result={g} />
                ))}
              </ul>

              {cell.output && (
                <div className="mt-auto grid grid-cols-3 gap-2 px-4 pb-4 pt-1">
                  <Metric label="Latency" value={`${cell.output.latencyMs} ms`} />
                  <Metric label="Cost" value={`$${cell.output.costUsd.toFixed(5)}`} />
                  <Metric
                    label="Tokens"
                    value={`${cell.output.tokensIn}/${cell.output.tokensOut}`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
