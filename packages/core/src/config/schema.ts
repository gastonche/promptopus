import { z } from 'zod';

const providerBase = {
  name: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  apiKeyEnv: z.string().min(1).optional(),
};

const baseUrlFields = {
  baseUrl: z.string().url().optional(),
  baseUrlEnv: z.string().min(1).optional(),
};

export const BUILTIN_PROVIDER_KINDS = ['openai', 'anthropic', 'openai-compat', 'mock'] as const;

export const BuiltinProviderSpecSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('openai'), ...providerBase, ...baseUrlFields }).strict(),
  z.object({ kind: z.literal('anthropic'), ...providerBase }).strict(),
  z.object({ kind: z.literal('openai-compat'), ...providerBase, ...baseUrlFields }).strict(),
  z
    .object({
      kind: z.literal('mock'),
      name: z.string().min(1),
      model: z.string().min(1).default('mock'),
      text: z.string().optional(),
    })
    .strict(),
]);

export const ProviderSpecSchema = z
  .object({ kind: z.string().min(1), name: z.string().min(1), model: z.string().min(1).optional() })
  .passthrough();

export const BUILTIN_GRADER_TYPES = [
  'non-empty',
  'equals',
  'contains',
  'regex',
  'max-length',
  'is-valid-json',
  'json-schema',
  'judge-faithfulness',
  'judge-quality',
  'latency-budget',
  'cost-budget',
] as const;

export const BuiltinGraderSpecSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('non-empty') }).strict(),
  z
    .object({
      type: z.literal('equals'),
      value: z.string(),
      caseInsensitive: z.boolean().optional(),
      trim: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('contains'),
      value: z.string(),
      caseInsensitive: z.boolean().optional(),
    })
    .strict(),
  z
    .object({ type: z.literal('regex'), pattern: z.string(), flags: z.string().optional() })
    .strict(),
  z.object({ type: z.literal('max-length'), chars: z.number().int().positive() }).strict(),
  z.object({ type: z.literal('is-valid-json') }).strict(),
  z.object({ type: z.literal('json-schema'), schema: z.record(z.unknown()) }).strict(),
  z
    .object({
      type: z.literal('judge-faithfulness'),
      threshold: z.number().min(0).max(1).default(0.7),
    })
    .strict(),
  z
    .object({
      type: z.literal('judge-quality'),
      rubric: z.string().optional(),
      threshold: z.number().min(0).max(1).default(0.7),
    })
    .strict(),
  z
    .object({
      type: z.literal('latency-budget'),
      p95Ms: z.number().positive().optional(),
      maxMs: z.number().positive().optional(),
    })
    .strict(),
  z.object({ type: z.literal('cost-budget'), maxUsd: z.number().positive() }).strict(),
]);

export const GraderSpecSchema = z.object({ type: z.string().min(1) }).passthrough();

export const CaseConfigSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().optional(),
    vars: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    prompt: z.string().min(1),
    systemPrompt: z.string().optional(),
    reference: z.string().optional(),
    source: z.string().optional(),
    graders: z.array(GraderSpecSchema).optional(),
  })
  .strict();

export const SuiteDefaultsSchema = z
  .object({
    systemPrompt: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
    graders: z.array(GraderSpecSchema).optional(),
  })
  .strict();

export const JudgeConfigSchema = z
  .object({
    provider: z.enum(['openai', 'anthropic', 'openai-compat', 'mock']),
    model: z.string().min(1),
    apiKeyEnv: z.string().min(1).optional(),
    baseUrl: z.string().url().optional(),
    baseUrlEnv: z.string().min(1).optional(),
    text: z.string().optional(),
  })
  .strict();

export const SuiteConfigSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    providers: z.array(ProviderSpecSchema).min(1, 'at least one provider is required'),
    judge: JudgeConfigSchema.optional(),
    defaults: SuiteDefaultsSchema.optional(),
    cases: z.array(CaseConfigSchema).min(1, 'at least one case is required'),
  })
  .strict()
  .superRefine((suite, ctx) => {
    const providerNames = new Set<string>();
    suite.providers.forEach((p, i) => {
      if (providerNames.has(p.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['providers', i, 'name'],
          message: `duplicate provider name "${p.name}" (provider names must be unique)`,
        });
      }
      providerNames.add(p.name);
    });

    const caseIds = new Set<string>();
    suite.cases.forEach((c, i) => {
      if (caseIds.has(c.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cases', i, 'id'],
          message: `duplicate case id "${c.id}" (case ids must be unique)`,
        });
      }
      caseIds.add(c.id);
    });

    const hasDefaultGraders = (suite.defaults?.graders?.length ?? 0) > 0;
    suite.cases.forEach((c, i) => {
      const hasOwnGraders = (c.graders?.length ?? 0) > 0;
      if (!hasOwnGraders && !hasDefaultGraders) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cases', i, 'graders'],
          message: `case "${c.id}" has no graders — define them here or in defaults.graders`,
        });
      }
    });

    const usesJudge = [
      ...(suite.defaults?.graders ?? []),
      ...suite.cases.flatMap((c) => c.graders ?? []),
    ].some((g) => g.type === 'judge-faithfulness' || g.type === 'judge-quality');
    if (usesJudge && !suite.judge) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['judge'],
        message:
          'a judge model is required because a judge-* grader is used — add a top-level `judge:` block',
      });
    }
  });

export type BuiltinProviderSpec = z.infer<typeof BuiltinProviderSpecSchema>;
export type CustomProviderSpec = {
  kind: string;
  name: string;
  model?: string;
  [key: string]: unknown;
};
export type ProviderSpec = BuiltinProviderSpec | CustomProviderSpec;
export type ProviderKind = string;

export type BuiltinGraderSpec = z.infer<typeof BuiltinGraderSpecSchema>;
export type CustomGraderSpec = { type: string; [key: string]: unknown };
export type GraderSpec = BuiltinGraderSpec | CustomGraderSpec;
export type GraderType = string;
export type CaseConfig = z.infer<typeof CaseConfigSchema>;
export type SuiteDefaults = z.infer<typeof SuiteDefaultsSchema>;
export type JudgeConfig = z.infer<typeof JudgeConfigSchema>;
export type SuiteConfig = z.infer<typeof SuiteConfigSchema>;
