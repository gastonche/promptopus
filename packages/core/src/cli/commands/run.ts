import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Command } from 'commander';

import { PromptopusConfigError } from '../../config/errors.js';
import { loadSuite } from '../../config/load.js';
import type { Provider } from '../../domain/provider.js';
import { GraderError } from '../../graders/errors.js';
import { createProvider } from '../../providers/registry.js';
import { ProviderError } from '../../providers/errors.js';
import { runSuite } from '../../runner/runner.js';
import { renderSummaryTable } from '../summary-table.js';
import { note, style, symbols } from '../ui.js';

interface RunOptions {
  out: string;
  providers?: string;
  maxConcurrency: string;
  retries: string;
}

export function registerRun(program: Command): void {
  program
    .command('run')
    .description('Run a suite against its providers and write a JSON report')
    .argument('<suite>', 'path to the suite YAML')
    .option('-o, --out <file>', 'where to write the JSON report', 'results.json')
    .option('-p, --providers <list>', 'comma-separated subset of provider names to run')
    .option('-c, --max-concurrency <n>', 'max concurrent provider calls', '4')
    .option('-r, --retries <n>', 'retries per call on rate-limit/5xx errors', '2')
    .action(async (suitePath: string, opts: RunOptions) => {
      let suite;
      try {
        suite = loadSuite(suitePath);
      } catch (err) {
        if (err instanceof PromptopusConfigError) {
          note(`${symbols.fail} ${err.message}`);
          process.exitCode = 1;
          return;
        }
        throw err;
      }

      let specs = suite.providers;
      if (opts.providers) {
        const wanted = opts.providers.split(',').map((s) => s.trim()).filter(Boolean);
        const known = new Set(suite.providers.map((p) => p.name));
        const unknown = wanted.filter((w) => !known.has(w));
        if (unknown.length) {
          note(`${symbols.fail} ${style.red(`unknown provider(s): ${unknown.join(', ')}`)}`);
          note(`  available: ${suite.providers.map((p) => p.name).join(', ')}`);
          process.exitCode = 1;
          return;
        }
        specs = suite.providers.filter((p) => wanted.includes(p.name));
      }

      const providers: Provider[] = [];
      const buildErrors: string[] = [];
      for (const spec of specs) {
        try {
          providers.push(createProvider(spec));
        } catch (err) {
          if (err instanceof ProviderError) buildErrors.push(`${spec.name}: ${err.message}`);
          else throw err;
        }
      }
      if (buildErrors.length) {
        note(`${symbols.fail} ${style.red('cannot start run:')}`);
        for (const line of buildErrors) note(`  ${symbols.bullet} ${line}`);
        process.exitCode = 1;
        return;
      }

      const concurrency = Number.parseInt(opts.maxConcurrency, 10) || 4;
      const retries = Number.parseInt(opts.retries, 10);

      note(`${symbols.octopus} ${style.bold('Promptopus')} — ${style.purple(suite.name)}`);
      note(`  ${suite.cases.length} cases × ${providers.length} providers, concurrency ${concurrency}`);
      note('');

      let completed = 0;
      let total = 0;
      let report;
      try {
        report = await runSuite(suite, {
          providers,
          concurrency,
          retry: { retries: Number.isFinite(retries) ? retries : 2 },
          onEvent: (event) => {
            if (event.type === 'start') {
              total = event.total;
            } else if (event.type === 'retry') {
              note(
                `  ${style.yellow(`↻ retry ${event.attempt}`)} ${event.caseId} ${style.dim('×')} ${event.providerName} ${style.dim(`(in ${event.delayMs}ms)`)}`,
              );
            } else if (event.type === 'cell') {
              completed += 1;
              const mark = event.status === 'ok' ? symbols.ok : symbols.fail;
              const suffix = event.status === 'error' ? style.red(` — ${event.error ?? 'error'}`) : '';
              note(
                `  ${style.dim(`[${completed}/${total}]`)} ${mark} ${event.caseId} ${style.dim('×')} ${event.providerName}${suffix}`,
              );
            }
          },
        });
      } catch (err) {
        if (err instanceof GraderError || err instanceof ProviderError) {
          note(`${symbols.fail} ${style.red(err.message)}`);
          process.exitCode = 1;
          return;
        }
        throw err;
      }

      const outPath = resolve(process.cwd(), opts.out);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

      process.stdout.write(`\n${renderSummaryTable(report)}\n`);

      const errorCount = report.providers.reduce((a, p) => a + p.errorCount, 0);
      note('');
      if (errorCount > 0) {
        note(`${symbols.warn} ${style.yellow(`${errorCount} cell(s) errored`)} (captured in the report)`);
      }
      note(
        `${symbols.octopus} report written to ${style.purple(opts.out)} — view it with ${style.cyan(`promptopus view ${opts.out}`)}`,
      );
    });
}
