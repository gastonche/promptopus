# 🐙 Promptopus

**A config-driven LLM evaluation harness — CLI + dashboard.** Define an eval in YAML, run it against
many models, score every output with three grader families (deterministic, LLM-as-judge, cost/latency),
and compare models side by side.

📖 **Docs & landing:** https://promptopus.pages.dev

## Install

```bash
npm i -g promptopus     # global CLI
# or run without installing:
npx promptopus init
```

You can also add it as a library dependency: `npm i promptopus`.

## Quick start

```bash
promptopus init                       # scaffold an example suite
promptopus run my.suite.yaml          # run it, write results.json, print a table
promptopus view results.json          # open the comparison dashboard
```

Provider keys are read from the environment (auto-loaded from `.env`): `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, and Cloudflare Workers AI vars for `openai-compat`. A keyless `mock` provider lets
you run with zero keys.

## Three grader families

- **Deterministic** — `equals`, `contains`, `regex`, `is-valid-json`, `json-schema`, `max-length`, `non-empty`.
- **LLM-as-judge** — `judge-faithfulness` and `judge-quality`, scored by a configurable judge model.
- **Cost + latency** — `latency-budget`, `cost-budget`, over the tokens/USD/latency every call reports.

## Extend in your own code

Add a provider or grader **without forking the package** — a `promptopus.config.mjs` in your project:

```js
import { defineConfig } from 'promptopus';

export default defineConfig({
  providers: {
    myvendor: (spec) => ({
      name: spec.name,
      model: spec.model,
      async generate(prompt) {
        /* call your API */
        return { text, tokensIn, tokensOut, latencyMs, costUsd };
      },
    }),
  },
  graders: {
    'word-count': (spec) => ({
      id: 'word-count',
      family: 'deterministic',
      grade: ({ output }) => {
        const n = output.text.trim().split(/\s+/).length;
        return {
          graderId: 'word-count',
          family: 'deterministic',
          score: n <= spec.max ? 1 : 0,
          passed: n <= spec.max,
          detail: `${n} words`,
        };
      },
    }),
  },
});
```

Then reference `kind: myvendor` / `type: word-count` in your suite. The CLI auto-loads the config.

For programmatic use, import `runSuite`, `createProviderRegistry`, `createGraderRegistry`,
`buildReport`, and the provider/grader building blocks directly from `promptopus`.

## License

MIT
