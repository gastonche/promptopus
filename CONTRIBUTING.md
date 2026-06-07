# Contributing to Promptopus

Thanks for taking a look. This is a small, strict TypeScript monorepo — the bar is clean abstractions
and no `any` in core logic.

## Setup

```bash
npm install
npm run build      # turbo builds the promptopus package then apps/dashboard
npm run typecheck  # strict tsc across all packages
npm test           # vitest (core)
```

Requires Node ≥ 20. Provider keys are read from the environment; copy `.env.example` to `.env` and fill
in what you need. **Never commit `.env`** (it is gitignored).

## Repo layout

```
packages/core/         promptopus (packages/core) — domain, config, providers, graders, runner, CLI
  src/domain/          Provider / Grader / TestCase / RunResult / Report interfaces
  src/config/          zod schema + loader (friendly errors)
  src/providers/       provider implementations + registry + pricing
  src/graders/         deterministic / judge / benchmark families + registry
  src/runner/          runner, concurrency pool, retry/backoff, aggregation
  src/cli/             commander CLI (init / run / view) + dashboard server
apps/dashboard/        Vite + React + Tailwind static dashboard
suites/                eval definitions (YAML)
docs/                  findings writeup + dashboard screenshot
brand/                 logo + palette
```

## Conventions

- **TypeScript strict**, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
  No `any` in core logic.
- **Comments are minimal or absent** — let names and types carry the meaning.
- **Config is the source of truth for types** — domain types are inferred from the zod schema in
  `config/schema.ts`, so validation and types can't drift.
- **Add a test** for new graders, providers, and runner behavior (`*.test.ts`, run by vitest).

## Adding a provider or grader

Both are one-interface changes — see the "Adding a provider" and "Adding a grader" sections in the
[README](README.md). In short:

- **Provider:** implement `Provider`, add a `kind` to the `ProviderSpec` zod union, a `case` in
  `providers/registry.ts`, and a `pricing.ts` row.
- **Grader:** implement `Grader`, add a variant to the `GraderSpec` zod union, and a `case` in
  `graders/registry.ts`.

## Before opening a PR

```bash
npm run build && npm run typecheck && npm test
```

All three must pass. Keep commits focused and message them in the imperative mood.
