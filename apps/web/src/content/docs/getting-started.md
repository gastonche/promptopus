---
title: Getting started
description: Install Promptopus, scaffold a suite, and run your first eval — keys optional.
section: Getting started
order: 2
---

You can run your first eval **without any API keys** thanks to the built-in `mock` provider, then add
real providers when you're ready.

## Requirements

- **Node.js ≥ 20**
- npm (or pnpm/yarn)

## Install

Run it instantly with `npx` — no install needed:

```bash
npx promptopus init
```

Or install the CLI globally:

```bash
npm i -g promptopus
promptopus --help
```

The bin is `promptopus`, with a short alias `pop`. You can also add it as a library dependency
(`npm i promptopus`) to build evals programmatically — see [Extending](/docs/extending).

## 1. Scaffold a suite

```bash
promptopus init
```

This writes `promptopus.suite.yaml` — a complete, valid example that exercises all three grader
families. Use `--stdout` to print instead of writing a file, and `--force` to overwrite.

## 2. Run it

The scaffolded suite references real providers. To run **with zero keys**, point it at a `mock`
provider — here's a minimal suite you can paste into `quickstart.yaml`:

```yaml
name: Quickstart
providers:
  - { name: mock-a, kind: mock, model: mock }
  - { name: mock-b, kind: mock, model: mock, text: 'Paris is the capital of France.' }
cases:
  - id: mentions-paris
    prompt: 'The capital of France is Paris.'
    graders:
      - { type: non-empty }
      - { type: contains, value: Paris, caseInsensitive: true }
```

```bash
promptopus run quickstart.yaml --out results.json
```

You'll see live progress and a summary table:

```
🐙 Promptopus — Quickstart (mock, zero keys)
  3 cases × 2 providers, concurrency 4

  [1/6] ✓ mentions-paris × mock-a
  ...
Metric                 mock-a   mock-b
---------------------  -------  -------
Pass rate              86%      57%
Score · deterministic  0.86     0.57
```

The full report is written to `results.json`.

## 3. View the dashboard

```bash
promptopus view results.json
```

This serves a static dashboard (and opens your browser) with a comparison matrix and per-case
drill-down. See [Dashboard](/docs/dashboard).

## Adding real providers

Provider credentials are read from environment variables, auto-loaded from a `.env` file in the
directory you run from. Create one with what you need:

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
# For Cloudflare Workers AI via its OpenAI-compatible gateway:
CF_AI_BASE_URL=https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/compat
CLOUDFLARE_API_TOKEN=...
```

> **Never commit `.env`.** It's gitignored by default. Keys are read at runtime and never written into
> the report.

Now point a suite at real models (see [Providers](/docs/providers)) and run:

```bash
promptopus run my.suite.yaml --out results.json
promptopus view results.json
```

## Next

- [Core concepts](/docs/core-concepts) — the data model behind a run.
- [Configuration](/docs/configuration) — the complete suite YAML reference.
- [Extending](/docs/extending) — add a provider or grader in your own code.
