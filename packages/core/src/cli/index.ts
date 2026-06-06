#!/usr/bin/env node
import { Command } from 'commander';

import { loadDotEnv } from './env.js';
import { registerInit } from './commands/init.js';
import { registerRun } from './commands/run.js';
import { registerView } from './commands/view.js';
import { note, style, symbols } from './ui.js';
import { VERSION } from './version.js';

function buildProgram(): Command {
  const program = new Command();
  program
    .name('promptopus')
    .description(`${symbols.octopus} Promptopus — a config-driven LLM evaluation harness`)
    .version(VERSION, '-v, --version', 'print the Promptopus version')
    .showHelpAfterError('(add --help for usage)');

  registerInit(program);
  registerRun(program);
  registerView(program);
  return program;
}

async function main(): Promise<void> {
  loadDotEnv();
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  note(`${symbols.fail} ${style.red('Unexpected error:')} ${message}`);
  process.exitCode = 1;
});
