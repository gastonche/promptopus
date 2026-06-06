---
title: Graders
description: Every grader type across the three families, with parameters and examples.
section: Writing evals
order: 3
---

A grader scores one output and returns `{ score (0–1), passed, detail }`. Graders are tagged objects
discriminated by `type`. They come in three families; the `family` is inferred from the type.

> Tip: put shared graders in `defaults.graders` and override per case only where needed. See
> [Configuration](/docs/configuration).

## Deterministic family

Fast, free, no API calls. Ideal as structural gates.

### `non-empty`

Passes if the output (trimmed) isn't empty.

```yaml
- { type: non-empty }
```

### `max-length`

Passes if `output.text.length` ≤ `chars`.

```yaml
- { type: max-length, chars: 900 }
```

| Param | Type | Required |
| --- | --- | --- |
| `chars` | positive integer | yes |

### `equals`

Exact match against `value`.

```yaml
- { type: equals, value: "Paris", caseInsensitive: true, trim: true }
```

| Param | Type | Default |
| --- | --- | --- |
| `value` | string | — |
| `caseInsensitive` | boolean | false |
| `trim` | boolean | false |

### `contains`

Passes if the output contains `value` as a substring.

```yaml
- { type: contains, value: "Tokyo", caseInsensitive: true }
```

### `regex`

Passes if the pattern matches. The pattern is compiled at load time — an invalid regex is a friendly
config error.

```yaml
- { type: regex, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }
- { type: regex, pattern: "error", flags: "i" }
```

| Param | Type | Notes |
| --- | --- | --- |
| `pattern` | string | JS regex source. Escape backslashes in YAML. |
| `flags` | string? | e.g. `i`, `m`, `s`. |

> **Asserting absence.** `regex` is a positive match, so to require that markdown is *absent* use a
> negative-lookahead pattern, e.g. `^(?![\s\S]*(?:^\s*[-*+]\s|^#))[\s\S]+$` with flag `m`.

### `is-valid-json`

Passes if the (trimmed) output parses as JSON.

```yaml
- { type: is-valid-json }
```

### `json-schema`

Parses the output as JSON and validates it against an inline schema. Supports a common JSON-Schema
subset: `type` (incl. `integer`), `required`, `properties`, `items`, `enum`, `minLength`/`maxLength`,
`minimum`/`maximum`.

```yaml
- type: json-schema
  schema:
    type: object
    required: [answer, confidence]
    properties:
      answer: { type: string, minLength: 1 }
      confidence: { type: number, minimum: 0, maximum: 1 }
```

The `detail` lists the first few validation errors when it fails.

## LLM-as-judge family

These call the configured `judge` model. They require a top-level `judge:` block (the loader enforces
this). Judge failures — a network error or malformed JSON — **degrade gracefully** to a failing result
with a clear `detail`, never crashing the run. See [LLM-as-judge](/docs/llm-judge) for depth.

### `judge-faithfulness`

Asks the judge whether the output stays faithful to the case's `source` — no facts absent from or
contradicting the source. Requires the case to set `source`.

```yaml
- { type: judge-faithfulness, threshold: 0.7 }
```

| Param | Type | Default |
| --- | --- | --- |
| `threshold` | number 0–1 | 0.7 |

`passed` is `score ≥ threshold`. If a case has no `source`, the grader fails with an explanatory detail.

### `judge-quality`

A general quality rubric. Pass a custom `rubric` to steer scoring; the case's `reference` (if present)
is shown to the judge as a strong answer.

```yaml
- type: judge-quality
  threshold: 0.7
  rubric: >-
    Score 0.0–1.0. Deduct for wordiness, meta-references ("this article"),
    missing main points, or markdown. Reserve 1.0 for a flawless answer.
```

| Param | Type | Default |
| --- | --- | --- |
| `rubric` | string? | a built-in general rubric |
| `threshold` | number 0–1 | 0.7 |

## Cost + latency family

These grade the metrics every call already produces — no extra API calls.

### `latency-budget`

Passes if the call's latency is within budget. Provide `maxMs` and/or `p95Ms` (at least one). When over
budget, the score degrades proportionally (`budget / latency`) rather than snapping to 0.

```yaml
- { type: latency-budget, p95Ms: 6000 }
- { type: latency-budget, maxMs: 4000 }
```

> The per-call grader checks each call against the budget; the **report** separately aggregates true
> p50/p95 latency across the suite (see [Dashboard](/docs/dashboard)).

### `cost-budget`

Passes if the call's computed USD cost is within `maxUsd`.

```yaml
- { type: cost-budget, maxUsd: 0.002 }
```

| Param | Type | Required |
| --- | --- | --- |
| `maxUsd` | positive number | yes |

## How scores roll up

For each provider, the report computes **mean score per family** and an overall **pass rate** (the
fraction of grader checks that passed across all of that provider's cells). The dashboard shows these
side by side. A grader's `detail` string is preserved per cell for drill-down.

Next: [LLM-as-judge](/docs/llm-judge).
