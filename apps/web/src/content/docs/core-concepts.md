---
title: Core concepts
description: The domain model — Provider, Grader, TestCase, RunResult, and Report.
section: Getting started
order: 3
---

Promptopus has a small, strict domain model. Understanding these five types is enough to use every
feature and to extend the tool.

## Provider

A `Provider` wraps a single `(vendor, model)` pair behind one method.

```ts
interface GenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costUsd: number; // computed centrally from a pricing table
}

interface Provider {
  readonly name: string; // unique id, used in YAML + report columns
  readonly model: string; // vendor model id
  generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult>;
}
```

`name` is how you reference the provider in cases and how it appears as a column in the report. Metrics
are first-class: every call reports tokens, latency, and computed USD cost. See [Providers](/docs/providers).

## Grader

A `Grader` scores one output. All three families implement the same interface, so the runner applies
them uniformly and the dashboard renders them generically.

```ts
type GraderFamily = 'deterministic' | 'judge' | 'benchmark';

interface GraderResult {
  graderId: string;
  family: GraderFamily;
  score: number; // 0..1
  passed: boolean;
  detail: string; // human-readable explanation
}

interface Grader {
  readonly id: string;
  readonly family: GraderFamily;
  grade(ctx: GradeContext): Promise<GraderResult> | GraderResult;
}
```

`grade` may be synchronous (deterministic asserts) or async (a judge that calls a model). See
[Graders](/docs/graders).

## TestCase & EvalSuite

A **case** is one input plus the graders that apply to it. The suite bundles cases with the providers
to run them against and an optional judge model.

```ts
interface TestCase {
  id: string;
  vars?: Record<string, string | number | boolean>;
  prompt: string; // {{var}} interpolation
  systemPrompt?: string;
  reference?: string; // expected/reference output
  source?: string; // grounding text for faithfulness
  graders: GraderSpec[];
}
```

At load time, Promptopus resolves each case: prompts are interpolated and graders are merged with the
suite's `defaults.graders`. The case's `source` and `reference` are also available as built-in template
variables — so one source text can feed both the prompt and the faithfulness grader. See
[Configuration](/docs/configuration).

## RunResult & Report

A `RunResult` is one cell of the matrix — the output, its grader results, and the metrics. A failed
generation is recorded as `status: 'error'` and the run continues.

```ts
interface RunResult {
  caseId: string;
  providerName: string;
  status: 'ok' | 'error';
  output?: GenerateResult;
  graderResults: GraderResult[];
  error?: { message: string; kind: string };
}
```

The `Report` is the aggregate artifact the dashboard consumes:

```ts
interface Report {
  suiteName: string;
  generatedAt: string; // ISO timestamp
  cases: ReportCase[]; // id, prompt, source, reference
  providers: ProviderSummary[]; // one per provider column
  results: RunResult[]; // every raw cell
  meta: { promptopusVersion: string; caseCount: number; providerCount: number };
}
```

Each `ProviderSummary` carries the rollups: `passRate`, `meanScoreByFamily`, `cost` (total + mean),
`latency` (p50/p95/mean), `tokens`, and `errorCount`.

## How a run flows

```
suite.yaml ──validate/resolve──▶ EvalSuite
                                     │
                                     ▼
        ┌────────────── Runner (case × provider) ───────────────┐
        │  for each cell:  Provider.generate → Grader.grade(s)  │
        │  concurrency pool · retry/backoff · error capture     │
        └───────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          aggregate ──▶ Report (JSON)
                                     ├──▶ CLI summary table
                                     └──▶ Dashboard
```

Next: [Configuration](/docs/configuration) — every field you can write in a suite.
