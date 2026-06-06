---
title: Configuration
description: The complete suite YAML reference — every field, validated by zod.
section: Writing evals
order: 1
---

A suite is a single YAML file, validated against a strict schema. Unknown keys and bad values fail
with precise, path-pointed errors (e.g. `cases[2].graders[1].chars: Number must be greater than 0`) —
never a stack trace.

## Top-level shape

```yaml
name: My Eval                 # required
description: Optional summary  # optional
judge:                         # optional — required if any judge-* grader is used
  provider: openai
  model: gpt-4o
providers:                     # required, at least one
  - { name: gpt, kind: openai, model: gpt-4o-mini }
defaults:                      # optional — shared systemPrompt / params / graders
  maxTokens: 512
  graders:
    - { type: non-empty }
cases:                         # required, at least one
  - id: case-1
    prompt: "What is the capital of {{country}}?"
    vars: { country: France }
    graders:
      - { type: contains, value: Paris, caseInsensitive: true }
```

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Suite name (shown in the report and dashboard). |
| `description` | string? | Free text. |
| `providers` | ProviderSpec[] | At least one. Names must be unique. See [Providers](/docs/providers). |
| `judge` | JudgeConfig? | The model used by `judge-*` graders. Required if any case uses one. |
| `defaults` | object? | Shared `systemPrompt`, `temperature`, `maxTokens`, and `graders`. |
| `cases` | TestCase[] | At least one. Ids must be unique. |

## `defaults`

Applied to every case unless the case overrides them.

```yaml
defaults:
  systemPrompt: "You are a terse assistant."
  temperature: 0.3
  maxTokens: 512
  graders:
    - { type: non-empty }
    - { type: max-length, chars: 900 }
```

- `graders` here are the **fallback** grader list: a case with no `graders` of its own inherits them.
  (A case that defines its own `graders` replaces the defaults — they are not merged item-by-item.)
- `temperature` / `maxTokens` are passed to providers as generation options; a provider's own
  `temperature` / `maxTokens` (if set on the provider spec) take precedence.

## `cases`

```yaml
cases:
  - id: eiffel-tower            # required, unique
    description: Fact-dense.    # optional
    vars:                       # optional template variables
      title: The Eiffel Tower
    prompt: "Title: {{title}}\n\n{{source}}"   # required
    systemPrompt: "..."         # optional, overrides defaults.systemPrompt
    reference: "A 330m tower…"  # optional reference / expected output
    source: "The Eiffel Tower…" # optional grounding text (for faithfulness)
    graders:                    # optional — falls back to defaults.graders
      - { type: judge-faithfulness, threshold: 0.7 }
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique within the suite; keys results in the report. |
| `prompt` | string | Sent to each provider. Supports `{{var}}` interpolation. |
| `vars` | record? | string / number / boolean values for interpolation. |
| `systemPrompt` | string? | Overrides `defaults.systemPrompt`. Also interpolated. |
| `reference` | string? | A reference answer; available to judges and as `{{reference}}`. |
| `source` | string? | Source text the output should stay faithful to; available as `{{source}}`. |
| `graders` | GraderSpec[]? | If omitted, `defaults.graders` apply. |

## Template variables

Prompts and system prompts support `{{name}}` interpolation. Available variables are:

- everything in the case's `vars`,
- the built-ins `{{source}}` and `{{reference}}` (when the case sets those fields).

```yaml
- id: summarize
  source: "Long article text…"
  prompt: "Summarize: {{source}}"   # the source feeds both the prompt and the faithfulness grader
```

Referencing an undefined variable is a configuration error, caught before any API call:

```
Case "summarize": unknown template variable "{{titel}}" (available: source)
```

## Graders

Each grader is a tagged object discriminated by `type`. The full catalogue — every type and its
parameters — is in [Graders](/docs/graders). A quick taste:

```yaml
graders:
  - { type: non-empty }
  - { type: max-length, chars: 900 }
  - { type: contains, value: Paris, caseInsensitive: true }
  - { type: regex, pattern: "^\\d{4}$" }
  - { type: is-valid-json }
  - { type: json-schema, schema: { type: object, required: [answer] } }
  - { type: judge-faithfulness, threshold: 0.7 }
  - { type: judge-quality, threshold: 0.7, rubric: "Reward concise answers." }
  - { type: latency-budget, p95Ms: 6000 }
  - { type: cost-budget, maxUsd: 0.002 }
```

## Validation rules

The loader enforces, with friendly messages:

- **Unique provider names** and **unique case ids**.
- Every case resolves to **at least one grader** (its own or via `defaults.graders`).
- A **`judge` block is required** whenever any `judge-faithfulness` / `judge-quality` grader is used.
- Unknown keys are rejected (`.strict()`), so typos are caught (`providers[0].modle`).

## Validating without running

`promptopus run` loads and validates before contacting any provider, so a malformed suite fails fast.
You can also see the resolved plan; an invalid suite prints all issues at once and exits non-zero.

Next: [Providers](/docs/providers).
