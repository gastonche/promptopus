import { errMessage } from '../util.js';
import type { GraderSpec } from '../config/schema.js';
import type { Grader } from '../domain/grader.js';
import type { GenerateOptions, Provider } from '../domain/provider.js';
import type { Report, RunResult } from '../domain/result.js';
import type { EvalSuite, TestCase } from '../domain/testcase.js';
import { createGrader as defaultCreateGrader, type GraderDeps } from '../graders/registry.js';
import { buildJudgeClient } from '../graders/judge/judge-client.js';
import { ProviderError } from '../providers/errors.js';
import { buildReport } from './aggregate.js';
import { mapPool } from './pool.js';
import { withRetry, type RetryOptions } from './retry.js';

export type RunEvent =
  | { type: 'start'; total: number }
  | { type: 'cell'; caseId: string; providerName: string; status: 'ok' | 'error'; error?: string }
  | { type: 'retry'; caseId: string; providerName: string; attempt: number; delayMs: number }
  | { type: 'done' };

export interface RunSuiteOptions {
  providers: Provider[];
  createGrader?: (spec: GraderSpec, deps: GraderDeps) => Grader;
  concurrency?: number;
  retry?: RetryOptions;
  onEvent?: (event: RunEvent) => void;
  now?: () => string;
}

const BUILTIN_NON_JUDGE = new Set([
  'non-empty',
  'equals',
  'contains',
  'regex',
  'max-length',
  'is-valid-json',
  'json-schema',
  'latency-budget',
  'cost-budget',
]);

function mayUseJudge(spec: GraderSpec): boolean {
  if (spec.type === 'judge-faithfulness' || spec.type === 'judge-quality') return true;
  return !BUILTIN_NON_JUDGE.has(spec.type);
}

interface Cell {
  testCase: TestCase;
  provider: Provider;
}

function genOptions(testCase: TestCase, suite: EvalSuite): GenerateOptions {
  const opts: GenerateOptions = {};
  if (testCase.systemPrompt !== undefined) opts.systemPrompt = testCase.systemPrompt;
  if (suite.defaults?.temperature !== undefined) opts.temperature = suite.defaults.temperature;
  if (suite.defaults?.maxTokens !== undefined) opts.maxTokens = suite.defaults.maxTokens;
  return opts;
}

async function runCell(
  cell: Cell,
  suite: EvalSuite,
  gradersByCase: Map<string, Grader[]>,
  retry: RetryOptions | undefined,
  onEvent: ((event: RunEvent) => void) | undefined,
): Promise<RunResult> {
  const { testCase, provider } = cell;
  try {
    const output = await withRetry(
      () => provider.generate(testCase.prompt, genOptions(testCase, suite)),
      {
        ...retry,
        onRetry: ({ attempt, delayMs }) =>
          onEvent?.({
            type: 'retry',
            caseId: testCase.id,
            providerName: provider.name,
            attempt,
            delayMs,
          }),
      },
    );
    const graders = gradersByCase.get(testCase.id) ?? [];
    const graderResults = [];
    for (const grader of graders) {
      try {
        graderResults.push(
          await grader.grade({
            testCase,
            output,
            provider: { name: provider.name, model: provider.model },
          }),
        );
      } catch (err) {
        graderResults.push({
          graderId: grader.id,
          family: grader.family,
          score: 0,
          passed: false,
          detail: `grader error: ${errMessage(err)}`,
        });
      }
    }
    return {
      caseId: testCase.id,
      providerName: provider.name,
      status: 'ok',
      output,
      graderResults,
    };
  } catch (err) {
    const kind = err instanceof ProviderError ? err.kind : 'unknown';
    return {
      caseId: testCase.id,
      providerName: provider.name,
      status: 'error',
      graderResults: [],
      error: { message: errMessage(err), kind },
    };
  }
}

export async function runSuite(suite: EvalSuite, options: RunSuiteOptions): Promise<Report> {
  const createGrader = options.createGrader ?? defaultCreateGrader;
  const concurrency = options.concurrency ?? 4;
  const now = options.now ?? ((): string => new Date().toISOString());

  const usesJudge = suite.cases.some((c) => c.graders.some(mayUseJudge));
  const deps: GraderDeps = {};
  if (usesJudge && suite.judge) deps.judge = buildJudgeClient(suite.judge);

  const gradersByCase = new Map<string, Grader[]>();
  for (const c of suite.cases) {
    gradersByCase.set(
      c.id,
      c.graders.map((spec) => createGrader(spec, deps)),
    );
  }

  const cells: Cell[] = [];
  for (const testCase of suite.cases) {
    for (const provider of options.providers) cells.push({ testCase, provider });
  }

  options.onEvent?.({ type: 'start', total: cells.length });

  const results = await mapPool(cells, concurrency, async (cell) => {
    const result = await runCell(cell, suite, gradersByCase, options.retry, options.onEvent);
    const event: RunEvent = {
      type: 'cell',
      caseId: cell.testCase.id,
      providerName: cell.provider.name,
      status: result.status,
    };
    if (result.error) event.error = result.error.message;
    options.onEvent?.(event);
    return result;
  });

  options.onEvent?.({ type: 'done' });
  return buildReport(suite, options.providers, results, now());
}
