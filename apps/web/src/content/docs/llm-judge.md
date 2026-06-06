---
title: LLM-as-judge
description: Configure the judge model, write good rubrics, and understand graceful failure.
section: Writing evals
order: 4
---

The judge graders (`judge-faithfulness`, `judge-quality`) send the candidate's output to a **judge
model** and parse a structured score. This page covers how to configure and get the most from them.

## Configuring the judge

Add a top-level `judge:` block. It's required whenever any case uses a `judge-*` grader.

```yaml
judge:
  provider: openai          # openai | anthropic | openai-compat | mock
  model: gpt-4o
  # apiKeyEnv / baseUrl / baseUrlEnv as needed (same as providers)
```

| Field | Type | Notes |
| --- | --- | --- |
| `provider` | enum | `openai` · `anthropic` · `openai-compat` · `mock`. |
| `model` | string | The judge model id. |
| `apiKeyEnv` | string? | Override the key env var. |
| `baseUrl` / `baseUrlEnv` | string? | For `openai-compat` judges. |
| `text` | string? | For `mock` judges only — a canned JSON verdict (see below). |

The judge is built **lazily**: it's only constructed (and only requires a key) if a judge grader is
actually used in the run.

## How scoring works

For each judged cell, Promptopus sends a rubric prompt and instructs the model to reply with JSON. It
then:

1. Extracts the JSON object (tolerating code fences and surrounding prose).
2. Validates it with a schema: `{ score: number, reasoning?: string }`.
3. Clamps `score` into `[0, 1]`.
4. Sets `passed = score ≥ threshold` and stores the reasoning as the grader `detail`.

## Writing good rubrics

The default `judge-quality` rubric is general. For meaningful separation between models, pass an
explicit rubric that uses the **full 0–1 range** with concrete deductions:

```yaml
- type: judge-quality
  threshold: 0.7
  rubric: >-
    Score a TL;DR summary using the FULL 0.0-1.0 range; do NOT default to 1.0.
    Start at 1.0 and deduct: -0.1 if longer than 5 sentences or wordy;
    -0.15 for any meta-reference ("this article"); -0.15 if it omits a main
    point; -0.2 for bullet points or markdown. Reserve 1.0 for a flawless
    3-5 sentence summary.
```

> **The judge ceiling effect is real.** A loose rubric makes a capable judge score everything 1.00,
> erasing all signal. If your judge column is all 1.00, tighten the rubric.

## Faithfulness vs quality

- **`judge-faithfulness`** grounds the output against the case `source`. Use it to catch
  hallucinations — facts the model invented that aren't in the provided text.
- **`judge-quality`** scores subjective quality against your rubric (and optionally a `reference`).

They're complementary: faithfulness asks "is it *true to the source*?", quality asks "is it *good*?"

## Graceful failure

A judge call can fail — a rate limit, a timeout, or a model that returns prose instead of JSON.
Promptopus never crashes the run on a judge failure. Instead the grader returns:

```json
{ "graderId": "judge-quality(>=0.7)", "family": "judge",
  "score": 0, "passed": false, "detail": "judge failed: judge response contained no JSON object" }
```

The cell still records the candidate's output and its deterministic/benchmark graders; only the judge
check is marked failed. This keeps a flaky judge from poisoning an entire run — though you should treat
a run with many judge failures as suspect.

## Bias and cost caveats

- **Self-judging bias.** If the judge model is the same family as a candidate, it tends to favor that
  candidate's style. Prefer a judge from a *different* family than your candidates when you can, and
  note the caveat when you can't.
- **Judge cost is separate.** Judge API calls have their own cost; the report's cost metrics reflect
  the **candidate** model only, not the judge.

## Testing without spending: the mock judge

For CI or offline demos, use a `mock` judge with a canned verdict:

```yaml
judge:
  provider: mock
  model: mock-judge
  text: '{"score":0.84,"reasoning":"grounded and concise"}'
```

This exercises the entire judge pipeline (prompt build, JSON parse, threshold logic) with zero keys.
A mock judge whose `text` isn't valid JSON is a handy way to test the graceful-failure path.

Next: [Running evals](/docs/running).
