import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { Command } from 'commander';

import { findDashboardDist, serveDashboard } from '../serve.js';
import { note, style, symbols } from '../ui.js';

interface ViewOptions {
  port: string;
  open?: boolean;
}

export function registerView(program: Command): void {
  program
    .command('view')
    .description('Open the dashboard against a results file')
    .argument('[results]', 'path to a results JSON report', 'results.json')
    .option('-p, --port <n>', 'port to serve the dashboard on', '4317')
    .option('--no-open', 'do not open a browser automatically')
    .action((resultsPath: string, opts: ViewOptions) => {
      const reportPath = resolve(process.cwd(), resultsPath);
      if (!existsSync(reportPath)) {
        note(`${symbols.fail} ${style.red(`results file not found: ${resultsPath}`)}`);
        note(`  run a suite first:  ${style.cyan('promptopus run <suite.yaml>')}`);
        process.exitCode = 1;
        return;
      }

      const distDir = findDashboardDist();
      if (!distDir) {
        note(`${symbols.fail} ${style.red('dashboard build not found.')}`);
        note(`  build it once:  ${style.cyan('npm run build --workspace @promptopus/dashboard')}`);
        note(
          `  or set ${style.purple('PROMPTOPUS_DASHBOARD_DIST')} to a built dashboard directory.`,
        );
        process.exitCode = 1;
        return;
      }

      const port = Number.parseInt(opts.port, 10) || 4317;
      serveDashboard({
        reportPath,
        distDir,
        port,
        open: opts.open !== false,
        onListening: (url) => {
          note(`${symbols.octopus} ${style.bold('Promptopus')} dashboard`);
          note(`  serving ${style.purple(resultsPath)} at ${style.cyan(url)}`);
          note(`  press ${style.bold('Ctrl+C')} to stop`);
        },
      });
    });
}
