import type { ProviderSummary } from '../types';
import { buildMatrix, type MatrixCell } from '../lib/metrics';

function cellClass(cell: MatrixCell): string {
  if (cell.best) return 'bg-pass/10 text-pass font-semibold';
  if (cell.worst) return 'bg-fail/10 text-fail font-semibold';
  return 'text-ink/80';
}

export function ComparisonMatrix({ providers }: { providers: ProviderSummary[] }) {
  const rows = buildMatrix(providers);

  return (
    <div className="overflow-hidden rounded-2xl border border-pop-300/50 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-pop-700 text-white">
              <th className="px-4 py-3 text-left font-semibold">Metric</th>
              {providers.map((p) => (
                <th key={p.providerName} className="px-4 py-3 text-left font-semibold">
                  <div>{p.providerName}</div>
                  <div className="text-xs font-normal text-pop-300">{p.model}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-surface/60'}>
                <td className="px-4 py-2.5 align-top">
                  <div className="font-medium text-ink">{row.label}</div>
                  <div className="text-xs text-ink/40">{row.hint}</div>
                </td>
                {row.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-2.5 tabular-nums rounded ${cellClass(cell)}`}
                  >
                    {cell.display}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 border-t border-pop-300/40 px-4 py-2 text-xs text-ink/50">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-pass/40" /> best in row
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-fail/40" /> worst in row
        </span>
      </div>
    </div>
  );
}
