import { useEffect, useMemo, useState } from 'react';

import { ComparisonMatrix } from './components/ComparisonMatrix';
import { CaseDrilldown } from './components/CaseDrilldown';
import { OctopusMark, Wordmark } from './components/Logo';
import type { Report } from './types';

function caseStats(report: Report, caseId: string): { passRate: number; errors: number } {
  const cells = report.results.filter((r) => r.caseId === caseId);
  const checks = cells.flatMap((c) => c.graderResults);
  const passed = checks.filter((c) => c.passed).length;
  return {
    passRate: checks.length === 0 ? 0 : passed / checks.length,
    errors: cells.filter((c) => c.status === 'error').length,
  };
}

function EmptyState({ onFile }: { onFile: (file: File) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <OctopusMark size={72} />
      <h2 className="text-xl font-semibold text-pop-700">No report loaded</h2>
      <p className="max-w-sm text-sm text-ink/50">
        Run <code className="rounded bg-pop-600/10 px-1.5 py-0.5 text-pop-700">promptopus run</code>{' '}
        to produce a{' '}
        <code className="rounded bg-pop-600/10 px-1.5 py-0.5 text-pop-700">results.json</code>, then
        load it here.
      </p>
      <label className="cursor-pointer rounded-lg bg-pop-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pop-600">
        Load results.json
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </label>
    </div>
  );
}

export default function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  useEffect(() => {
    fetch('report.json')
      .then((r) => (r.ok ? (r.json() as Promise<Report>) : Promise.reject(new Error('no report'))))
      .then((data) => {
        setReport(data);
        setSelectedCase(data.cases[0]?.id ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadFile = (file: File) => {
    file.text().then((text) => {
      const data = JSON.parse(text) as Report;
      setReport(data);
      setSelectedCase(data.cases[0]?.id ?? null);
    });
  };

  const activeCase = useMemo(
    () => report?.cases.find((c) => c.id === selectedCase) ?? null,
    [report, selectedCase],
  );

  const containerW = (report?.providers.length ?? 0) > 5 ? 'max-w-[1700px]' : 'max-w-6xl';

  return (
    <div className="min-h-full">
      <header className="border-b border-pop-300/50 bg-white/80 backdrop-blur">
        <div className={`mx-auto flex ${containerW} items-center gap-3 px-6 py-4`}>
          <OctopusMark size={40} />
          <Wordmark />
          {report && (
            <div className="ml-auto text-right text-sm">
              <div className="font-semibold text-ink">{report.suiteName}</div>
              <div className="text-xs text-ink/40">
                {report.meta.caseCount} cases × {report.meta.providerCount} providers ·{' '}
                {new Date(report.generatedAt).toLocaleString()} · v{report.meta.promptopusVersion}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={`mx-auto ${containerW} px-6 py-8`}>
        {!report ? (
          <EmptyState onFile={loadFile} />
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
                Comparison matrix
              </h2>
              <ComparisonMatrix providers={report.providers} />
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
                Cases
              </h2>
              <div className="mb-5 flex flex-wrap gap-2">
                {report.cases.map((c) => {
                  const stats = caseStats(report, c.id);
                  const active = c.id === selectedCase;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCase(c.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        active
                          ? 'border-pop-600 bg-pop-600 text-white'
                          : 'border-pop-300/60 bg-white text-ink/70 hover:border-pop-500'
                      }`}
                    >
                      <span className="font-medium">{c.id}</span>
                      <span
                        className={`tabular-nums text-xs ${active ? 'text-pop-300' : 'text-ink/40'}`}
                      >
                        {Math.round(stats.passRate * 100)}%
                        {stats.errors > 0 ? ` · ${stats.errors}✗` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeCase && (
                <div className="mb-5 rounded-2xl border border-pop-300/50 bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-ink/40">Prompt</div>
                  <pre className="mt-1 whitespace-pre-wrap text-sm text-ink/80">
                    {activeCase.prompt}
                  </pre>
                  {activeCase.source && (
                    <>
                      <div className="mt-3 text-xs uppercase tracking-wide text-ink/40">Source</div>
                      <pre className="mt-1 whitespace-pre-wrap text-sm text-ink/60">
                        {activeCase.source}
                      </pre>
                    </>
                  )}
                  {activeCase.reference && (
                    <>
                      <div className="mt-3 text-xs uppercase tracking-wide text-ink/40">
                        Reference
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap text-sm text-ink/60">
                        {activeCase.reference}
                      </pre>
                    </>
                  )}
                </div>
              )}

              {selectedCase && <CaseDrilldown report={report} caseId={selectedCase} />}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
