import type { GenerateResult, Provider } from './provider.js';
import type { TestCase } from './testcase.js';

export type GraderFamily = 'deterministic' | 'judge' | 'benchmark';

export interface GraderResult {
  graderId: string;
  family: GraderFamily;
  score: number;
  passed: boolean;
  detail: string;
}

export interface GradeContext {
  testCase: TestCase;
  output: GenerateResult;
  provider: Pick<Provider, 'name' | 'model'>;
}

export interface Grader {
  readonly id: string;
  readonly family: GraderFamily;
  grade(ctx: GradeContext): Promise<GraderResult> | GraderResult;
}
