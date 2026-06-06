import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Command } from 'commander';

import { EXAMPLE_SUITE_FILENAME, EXAMPLE_SUITE_YAML } from '../example-suite.js';
import { note, style, symbols } from '../ui.js';

interface InitOptions {
  force?: boolean;
  stdout?: boolean;
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Scaffold an example suite YAML so the tool is usable in seconds')
    .argument('[file]', 'output file path', EXAMPLE_SUITE_FILENAME)
    .option('-f, --force', 'overwrite the file if it already exists')
    .option('--stdout', 'print the example to stdout instead of writing a file')
    .action((file: string, opts: InitOptions) => {
      if (opts.stdout) {
        process.stdout.write(EXAMPLE_SUITE_YAML);
        return;
      }

      const target = resolve(process.cwd(), file);
      if (existsSync(target) && !opts.force) {
        note(`${symbols.fail} ${style.red(`${file} already exists.`)} Use --force to overwrite.`);
        process.exitCode = 1;
        return;
      }

      writeFileSync(target, EXAMPLE_SUITE_YAML, 'utf8');
      note(`${symbols.octopus} ${style.bold('Promptopus')} scaffolded ${style.purple(file)}`);
      note();
      note('Next steps:');
      note(`  ${symbols.bullet} Edit ${style.purple(file)} to define your providers and cases`);
      note(`  ${symbols.bullet} Set provider keys (see ${style.purple('.env.example')})`);
      note(`  ${symbols.bullet} Run it:  ${style.cyan(`promptopus run ${file}`)}`);
    });
}
