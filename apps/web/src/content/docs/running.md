---
title: Running evals
description: Concurrency, retry/backoff, error handling, and the report artifact.
section: Writing evals
order: 5
---

`promptopus run` executes the `case × provider` matrix. This page covers how it behaves under load and
failure, and what it writes out.

## The basics

```bash
promptopus run <suite.yaml> [options]
```

It loads and validates the suite, constructs the selected providers (failing fast on missing keys),
builds the graders for each case, then runs every cell — printing live progress and a summary table,
and writing a JSON report.

## Concurrency

Cells run through a concurrency pool. Control it with `--max-concurrency` (default `4`):

```bash
promptopus run suite.yaml --max-concurrency 8
```

Higher concurrency finishes faster but is more likely to hit provider rate limits — which Promptopus
handles for you (below). Start at the default and raise it if your provider tier allows.

## Retry & backoff

Provider calls are wrapped in rate-limit-aware retry. On a **retryable** error — HTTP `429`, `5xx`,
network errors, or timeouts — Promptopus retries with exponential backoff plus jitter, and **honors the
`Retry-After` header** when present.

```bash
promptopus run suite.yaml --retries 3   # default 2
```

Non-retryable errors (e.g. `401 Unauthorized`, `400 Bad Request`) are **not** retried — they fail the
cell immediately. Retries are surfaced in the live progress as `↻ retry N`.

## Partial-run resilience

A failed cell never crashes the run. The error is captured as a `RunResult` with
`status: 'error'` and the run continues with the rest of the matrix:

```
[6/15] ✗ black-holes × haiku — HTTP 400: Your credit balance is too low…
...
! 2 cell(s) errored (captured in the report)
```

The report records every error (`error.message`, `error.kind`), and the dashboard shows error cells
distinctly. This means one provider going down mid-run still yields a usable report for the rest.

## Selecting providers

Run a subset of the suite's providers:

```bash
promptopus run suite.yaml --providers gpt-4o-mini,llama-3.1-8b
```

Unknown names are rejected with the available list.

## The output report

`--out` (default `results.json`) writes the [Report](/docs/core-concepts#runresult--report). The parent
directory is created if needed.

```bash
promptopus run suite.yaml --out results/run-2026-06-07.json
```

The report contains, per provider: pass rate, mean score per grader family, total/mean cost, p50/p95/mean
latency, token totals, and error count — plus every raw cell for drill-down. Feed it to the
[dashboard](/docs/dashboard) or diff it in CI.

## The summary table

After a run, a table is printed to stdout with best-in-row (green) and worst-in-row (red) highlighting:

```
Metric                 gpt-4o-mini  llama-3.1-8b  qwq-32b
---------------------  -----------  ------------  -------
Pass rate              92%          99%           39%
Score · judge          1.00         1.00          0.77
Cost · total           $0.0006      $0.0003       $0.0033
Latency · p95          3859ms       3220ms        15837ms
```

## Environment & keys

Keys are read from the environment, auto-loaded from a `.env` in the working directory. A missing key
for a selected provider is a clear startup error listing exactly what to set — before any request is
made. See [Getting started](/docs/getting-started#adding-real-providers).

Next: [CLI reference](/docs/cli).
