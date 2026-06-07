---
title: Providers
description: Configure OpenAI, Anthropic, OpenAI-compatible (Workers AI / local), and mock providers.
section: Writing evals
order: 2
---

A provider is one `(vendor, model)` pair. You list them under `providers:` and reference them by
`name`. Promptopus ships four kinds, all behind the same `Provider` interface.

## Common fields

| Field                    | Applies to                       | Notes                                               |
| ------------------------ | -------------------------------- | --------------------------------------------------- |
| `name`                   | all                              | Unique id; the report's column header.              |
| `model`                  | all                              | Vendor model id.                                    |
| `kind`                   | all                              | `openai` · `anthropic` · `openai-compat` · `mock`.  |
| `temperature`            | openai, anthropic, openai-compat | 0–2; overrides `defaults.temperature`.              |
| `maxTokens`              | openai, anthropic, openai-compat | Output cap; overrides `defaults.maxTokens`.         |
| `apiKeyEnv`              | openai, anthropic, openai-compat | Env var holding the key (per-vendor default below). |
| `baseUrl` / `baseUrlEnv` | openai, openai-compat            | Override the API base URL (literal or via env var). |

Keys are read from the environment at runtime (auto-loaded from `.env`). A missing key is a **clear
startup error** before any request is made.

## `openai`

```yaml
- name: gpt-4o-mini
  kind: openai
  model: gpt-4o-mini
  # apiKeyEnv: OPENAI_API_KEY   # default
  # baseUrl: https://api.openai.com/v1   # default
```

Uses the Chat Completions API. Default key env: `OPENAI_API_KEY`. Reads `usage` for token counts and
computes cost from the [pricing table](#pricing).

## `anthropic`

```yaml
- name: haiku
  kind: anthropic
  model: claude-haiku-4-5
  # apiKeyEnv: ANTHROPIC_API_KEY   # default
```

Uses the Messages API (`anthropic-version: 2023-06-01`). Default key env: `ANTHROPIC_API_KEY`.
`max_tokens` is required by Anthropic, so Promptopus defaults it to 1024 if neither the provider nor
`defaults.maxTokens` sets it. `529 Overloaded` is treated as retryable.

## `openai-compat`

Any endpoint that speaks the OpenAI Chat Completions API: a local server (Ollama, vLLM, LM Studio) or
**Cloudflare Workers AI** via its OpenAI-compatible gateway. A base URL is **required**.

```yaml
- name: llama-3.1-8b
  kind: openai-compat
  model: 'workers-ai/@cf/meta/llama-3.1-8b-instruct'
  baseUrlEnv: CF_AI_BASE_URL
  apiKeyEnv: CLOUDFLARE_API_TOKEN
```

```bash
# .env
CF_AI_BASE_URL=https://gateway.ai.cloudflare.com/v1/<account-id>/<gateway>/compat
CLOUDFLARE_API_TOKEN=...
```

- The provider appends `/chat/completions` to the base URL.
- `apiKeyEnv` is **optional** for `openai-compat` — omit it for keyless local servers. When set, the
  value is sent as a bearer token.
- Cloudflare's gateway routes by a provider-prefixed model name, e.g.
  `workers-ai/@cf/meta/llama-3.1-8b-instruct`.

### Local example (Ollama)

```yaml
- name: local-llama
  kind: openai-compat
  model: llama3.1
  baseUrl: http://localhost:11434/v1
```

## `mock`

A deterministic, keyless provider — invaluable for testing a suite's structure, CI of the harness
itself, and zero-cost demos.

```yaml
- name: mock-a
  kind: mock
  model: mock # optional, defaults to "mock"
  text: 'A fixed response.' # optional; if omitted, echoes the prompt
```

If `text` is set it's always returned; otherwise the prompt is echoed back. Cost is always `$0`; tokens
and latency are estimated deterministically.

## Pricing

Cost is computed centrally from a per-model table (`packages/core/src/providers/pricing.ts`) as
`(tokensIn × inPerMTok + tokensOut × outPerMTok) / 1e6`. Models in the table (the common OpenAI,
Anthropic, and Workers AI Llama models) get accurate USD; an unknown model reports `costUsd: 0`. To
price a new model, add a row:

```ts
export const PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inPerMTok: 0.15, outPerMTok: 0.6 },
  // add yours here
};
```

## Choosing a subset at run time

A suite can define many providers; run only some with `--providers`:

```bash
promptopus run suite.yaml --providers gpt-4o-mini,llama-3.1-8b
```

Next: [Graders](/docs/graders).
