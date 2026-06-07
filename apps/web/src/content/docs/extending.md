---
title: Extending
description: Add providers and graders in your own code — no fork required — via a config file or the library API.
section: Going further
order: 1
---

The `Provider` and `Grader` interfaces are the extension points. You can add either **in your own
project** — without forking Promptopus — in two ways:

1. A **`promptopus.config.mjs`** plugin file the CLI auto-loads.
2. The **programmatic library API** (`import … from 'promptopus'`).

## Plugins via `promptopus.config.mjs`

Drop a `promptopus.config.mjs` (or `.js`) next to your suite. The CLI discovers it automatically (or
pass `--config <path>`). It maps custom provider `kind`s and grader `type`s to factory functions:

```js
// promptopus.config.mjs
import { defineConfig, computeCostUsd } from 'promptopus';

export default defineConfig({
  providers: {
    // referenced in YAML as: kind: cohere
    cohere: (spec) => ({
      name: spec.name,
      model: spec.model,
      async generate(prompt, opts) {
        const start = performance.now();
        const res = await fetch('https://api.cohere.com/v2/chat', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env[spec.apiKeyEnv ?? 'COHERE_API_KEY']}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ model: spec.model, messages: [{ role: 'user', content: prompt }] }),
        });
        const data = await res.json();
        const text = data.message.content[0].text;
        const tokensIn = data.usage.tokens.input;
        const tokensOut = data.usage.tokens.output;
        return {
          text,
          tokensIn,
          tokensOut,
          latencyMs: Math.round(performance.now() - start),
          costUsd: computeCostUsd(spec.model, tokensIn, tokensOut),
        };
      },
    }),
  },

  graders: {
    // referenced in YAML as: type: word-count
    'word-count': (spec) => ({
      id: `word-count(${spec.max})`,
      family: 'deterministic',
      grade: ({ output }) => {
        const n = output.text.trim().split(/\s+/).filter(Boolean).length;
        const passed = n <= spec.max;
        return {
          graderId: `word-count(${spec.max})`,
          family: 'deterministic',
          score: passed ? 1 : 0,
          passed,
          detail: `${n}/${spec.max} words`,
        };
      },
    }),
  },
});
```

Now use them in any suite — Promptopus validates built-in types strictly but lets custom `kind`/`type`
through to your factories:

```yaml
providers:
  - { name: cohere-cmd, kind: cohere, model: command-r, apiKeyEnv: COHERE_API_KEY }
cases:
  - id: c1
    prompt: "Summarize: {{source}}"
    source: "…"
    graders:
      - { type: non-empty }
      - { type: word-count, max: 60 }   # your custom grader
```

```bash
promptopus run my.suite.yaml          # config auto-loaded
# → • plugins: promptopus.config.mjs
```

### The factory contracts

- **Provider factory:** `(spec) => Provider`. `spec` is the YAML object (`kind`, `name`, `model`, and
  any extra fields you add). Return an object implementing
  `generate(prompt, opts) → { text, tokensIn, tokensOut, latencyMs, costUsd }`.
- **Grader factory:** `(spec, deps) => Grader`. Return `{ id, family, grade(ctx) }` where `grade`
  returns `{ graderId, family, score (0–1), passed, detail }`. `deps.judge` is the judge client when a
  judge is configured — use it to build LLM-as-judge graders of your own.

Throw a `ProviderError` with `retryable: true` for transient failures so the runner's backoff applies.

## Programmatic (library) API

For full control, drive the harness from code. Everything is exported from `promptopus`:

```ts
import {
  loadSuite,
  runSuite,
  createProviderRegistry,
  createGraderRegistry,
} from 'promptopus';

const suite = loadSuite('my.suite.yaml');

const providers = createProviderRegistry().register('cohere', cohereFactory);
const graders = createGraderRegistry().register('word-count', wordCountFactory);

const report = await runSuite(suite, {
  providers: suite.providers.map((s) => providers.create(s)),
  createGrader: (spec, deps) => graders.create(spec, deps),
});

// report is the same JSON the CLI writes and the dashboard reads
```

Useful exports: `runSuite`, `buildReport`, `loadSuite` / `parseSuiteConfig` / `resolveSuite`,
`createProviderRegistry` / `ProviderRegistry`, `createGraderRegistry` / `GraderRegistry`,
`OpenAIProvider` / `AnthropicProvider` / `MockProvider`, `computeCostUsd`, `ProviderError`, and all the
domain types (`Provider`, `Grader`, `Report`, …).

## Contributing a built-in

If your provider or grader is broadly useful, add it to the package itself: implement the interface in
`packages/core/src/providers/` or `src/graders/`, register it in the built-in registry
(`createProviderRegistry` / `createGraderRegistry`), add a strict zod variant for nice validation, and a
pricing row for providers. See [CONTRIBUTING](https://github.com/shizle/promptopus/blob/main/CONTRIBUTING.md).

Next: [The ReadAloud dogfood](/docs/dogfood).
