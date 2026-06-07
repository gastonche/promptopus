---
title: At scale
description: Known limitations and what a production deployment would add.
section: Going further
order: 3
---

Promptopus is a focused, honest core. This page is candid about its current limits and what a
production-grade deployment would build on top.

## Known limitations

- **No response caching yet.** Identical `(provider, model, prompt, params)` calls re-hit the API on
  every run.
- **Judge cost isn't folded into per-provider cost.** Judge calls have their own cost; the report's
  cost metrics reflect the _candidate_ model only.
- **`json-schema` supports a common subset** (type, required, properties, items, enum, min/max) — not
  the full JSON Schema spec. Swap in Ajv if you need the rest.
- **LLM-as-judge is only as good as the judge.** Rubric saturation and self-judging bias are real;
  treat judge scores as directional. See [LLM-as-judge](/docs/llm-judge).

## What I'd add at scale

### Caching

A content-addressed cache keyed on `(provider, model, prompt, params)` so re-runs and CI are near-free,
with a `--no-cache` escape hatch. Most of a suite is unchanged between runs; only re-call what moved.

### Dataset versioning

Hash the suite and its source texts so each report is tied to an exact dataset version. Then a diff
between two reports is meaningful — you know the inputs were identical and only the model changed.

### CI integration

`promptopus run` with a `--fail-on` threshold (minimum pass rate, or a maximum regression delta vs a
baseline report) as a required status check. Upload the report as a build artifact and comment the
summary table on the PR.

### Regression tracking across model versions

Store reports over time and chart pass-rate / cost / faithfulness as vendors ship new model snapshots.
A silent quality drop when `gpt-4o-mini` updates should set off an alarm, not a surprise in production.

### Judge robustness

Move from absolute scoring toward **pairwise comparison** (which output is better, A or B), use
**multiple judges** with an agreement threshold, and keep a small **human-labeled held-out set** to
calibrate the judge periodically.

## Architecture that makes this feasible

Because every scoring strategy is a `Grader` and every model is a `Provider`, these additions are
mostly orthogonal: caching wraps the provider call, dataset versioning hashes the resolved suite, and
CI thresholds read the existing report. The core doesn't need to change shape to support them — which
is the point of keeping the interfaces small.

Back to the [Introduction](/docs/introduction).
