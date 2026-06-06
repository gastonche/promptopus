import type {
  GraderSpec,
  JudgeConfig,
  ProviderSpec,
  SuiteDefaults,
} from '../config/schema.js';

export interface TestCase {
  id: string;
  description?: string;
  vars?: Record<string, string | number | boolean>;
  prompt: string;
  systemPrompt?: string;
  reference?: string;
  source?: string;
  graders: GraderSpec[];
}

export interface EvalSuite {
  name: string;
  description?: string;
  providers: ProviderSpec[];
  judge?: JudgeConfig;
  defaults?: SuiteDefaults;
  cases: TestCase[];
}

export type { GraderSpec, ProviderSpec, JudgeConfig, SuiteDefaults };
