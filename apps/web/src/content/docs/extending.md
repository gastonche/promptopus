---
title: Extending
description: Add a provider or a grader by implementing one interface.
section: Going further
order: 1
---

The `Provider` and `Grader` interfaces are the extension points. Adding either is a one-interface
change — the runner, report, and dashboard need no modification.

## Add a provider

**1. Implement `Provider`** in `packages/core/src/providers/`:

```ts
import type { GenerateOptions, GenerateResult, Provider } from '../domain/provider.js';
import { ProviderError } from './errors.js';
import { computeCostUsd } from './pricing.js';

export class CohereProvider implements Provider {
  constructor(
    readonly name: string,
    readonly model: string,
    private readonly apiKey: string,
  ) {}

  async generate(prompt: string, opts?: GenerateOptions): Promise<GenerateResult> {
    const start = performance.now();
    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) {
      throw new ProviderError(`HTTP ${res.status}`, { status: res.status, retryable: res.status >= 500 });
    }
    const data = await res.json();
    const text = data.message.content[0].text;
    const tokensIn = data.usage.tokens.input;
    const tokensOut = data.usage.tokens.output;
    return {
      text,
      tokensIn,
      tokensOut,
      latencyMs: Math.round(performance.now() - start),
      costUsd: computeCostUsd(this.model, tokensIn, tokensOut),
    };
  }
}
```

**2. Add a `kind`** to the provider zod union in `config/schema.ts`:

```ts
z.object({ kind: z.literal('cohere'), ...providerBase }).strict(),
```

**3. Register a factory** in `providers/registry.ts`:

```ts
case 'cohere':
  return new CohereProvider(spec.name, spec.model, requireKey(spec.apiKeyEnv ?? 'COHERE_API_KEY', spec.name));
```

**4. Add a pricing row** in `providers/pricing.ts`. Done — the new `kind` is usable in any suite.

> Throw `ProviderError` with `retryable: true` for transient failures (429/5xx/network) so the runner's
> backoff kicks in; mark `retryable: false` for auth/validation errors.

## Add a grader

**1. Implement `Grader`** (sync or async). Each grader is a small factory returning the interface:

```ts
// packages/core/src/graders/deterministic/word-count.ts
import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';

type Spec = Extract<GraderSpec, { type: 'word-count' }>;

export function wordCountGrader(spec: Spec): Grader {
  const id = `word-count(${spec.max})`;
  return {
    id,
    family: 'deterministic',
    grade({ output }) {
      const n = output.text.trim().split(/\s+/).filter(Boolean).length;
      const passed = n <= spec.max;
      return { graderId: id, family: 'deterministic', score: passed ? 1 : 0, passed,
               detail: `${n}/${spec.max} words` };
    },
  };
}
```

**2. Add a variant** to the `GraderSpec` union in `config/schema.ts`:

```ts
z.object({ type: z.literal('word-count'), max: z.number().int().positive() }).strict(),
```

**3. Register** it in `graders/registry.ts`:

```ts
case 'word-count':
  return wordCountGrader(spec);
```

That's it — the runner applies it, the report aggregates it by family, and the dashboard renders it.

## Graders that need a judge

Judge graders receive a `GraderDeps` with a `judge` client. If your grader calls a model, accept the
deps and degrade gracefully on failure (catch and return a failing result), mirroring
`judge/faithfulness.ts`.

## Tests

Add a `*.test.ts` next to your code. Graders are pure and easy to test with a synthetic
`GenerateResult`; providers can be tested by stubbing `fetch`. Run `npm test`.

Next: [The ReadAloud dogfood](/docs/dogfood).
