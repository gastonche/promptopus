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

Promptopus is a monorepo. Clone it and build the core package:

```bash
git clone <your-fork-url> promptopus
cd promptopus
npm install
npm run build
```

This builds `@promptopus/core` (the CLI) and the dashboard. The CLI bin is `promptopus` (with a short
alias `pop`). From the repo you can invoke it directly:

```bash
node packages/core/dist/cli/index.js --help
```

> The examples below use `promptopus …` for readability. If you haven't linked the bin globally, prefix
> with `node packages/core/dist/cli/index.js`.

## 1. Scaffold a suite

```bash
promptopus init
```

This writes `promptopus.suite.yaml` — a complete, valid example that exercises all three grader
families. Use `--stdout` to print instead of writing a file, and `--force` to overwrite.

## 2. Run it

A zero-key suite using the `mock` provider ships in the repo at `suites/quickstart.yaml`:

```bash
promptopus run suites/quickstart.yaml --out results.json
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
directory you run from. Copy the template and fill in what you need:

```bash
cp .env.example .env
```

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
promptopus run suites/readaloud-summarizer.yaml \
  --providers gpt-4o-mini,llama-8b --out results/results.json
```

## Next

- [Core concepts](/docs/core-concepts) — the data model behind a run.
- [Configuration](/docs/configuration) — the complete suite YAML reference.
