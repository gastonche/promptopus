# ReadAloud TL;DR Summarizer — Multi-Model Benchmark

> Evidence report produced by **Promptopus**, a config-driven LLM evaluation harness.
> Suite: [`suites/readaloud-benchmark.yaml`](../suites/readaloud-benchmark.yaml) ·
> Custom graders: [`promptopus.config.mjs`](../promptopus.config.mjs) ·
> Raw report: [`results/benchmark.json`](../results/benchmark.json) · Run date: 2026-06-07.

## Question

ReadAloud's "TL;DR" feature turns an article into **3–5 sentences of plain prose** and ships an
open 8-billion-parameter model on Cloudflare Workers AI. Two product questions:

1. **Is the 8B model the right pick** — or would a bigger model, or a frontier small model, be better?
2. **Are newer/reasoning models worth a look?**

So this is a real benchmark: **10 candidate models** scored on **6 article excerpts** by a **12-grader
battery**, using ReadAloud's exact production prompt and constraints (`max_tokens: 512`, no markdown).

## Setup

**Models** — `gpt-4o-mini` (OpenAI, frontier-small) plus a Workers AI ladder routed through the
Cloudflare AI Gateway: Llama 3.2-3B → 3.1-8B → 3.1-70B → 3.3-70B, Llama-4-Scout-17B, Mistral-Small-24B,
Qwen2.5-Coder-32B, Gemma-3-12B, and the **QwQ-32B reasoning model**.

**Graders (12)** spanning all three families plus custom:

- **Simple deterministic** — `non-empty`, `max-length`, `regex` (plain prose, no markdown).
- **LLM-as-judge** (`gpt-4o`) — `judge-faithfulness` and a tightened `judge-quality` rubric.
- **Cost + latency** — `latency-budget`, `cost-budget`.
- **Custom** (defined in `promptopus.config.mjs`, no fork): `sentence-count` (enforce 3–5),
  `no-meta-reference` (forbid "this article…"), `no-reasoning-leak` (catch chain-of-thought),
  `number-fidelity` (every number must appear in the source), `compression` (output must actually shorten the source).

![Promptopus dashboard — 10-model benchmark](./dashboard-screenshot.png)

## Results

Sorted by pass rate (share of all grader checks passed), then cost. 6 cases each, 0 errors.

| Model                         | Pass    | Judge    | Det. | Cost (6 cases) | p50        | p95         |
| ----------------------------- | ------- | -------- | ---- | -------------- | ---------- | ----------- |
| **llama-3.1-8b** (Workers AI) | **99%** | **1.00** | 1.00 | $0.0003        | 849 ms     | 3220 ms     |
| mistral-small-24b             | 99%     | 0.98     | 1.00 | $0.0008        | 2507 ms    | 4576 ms     |
| gemma-3-12b                   | 97%     | 1.00     | 1.00 | $0.0008        | 1394 ms    | **1665 ms** |
| llama-4-scout-17b             | 97%     | 0.98     | 0.99 | $0.0009        | 1709 ms    | 1944 ms     |
| qwen2.5-coder-32b             | 96%     | 0.98     | 1.00 | $0.0015        | 3176 ms    | 3682 ms     |
| llama-3.1-70b                 | 96%     | 1.00     | 0.99 | $0.0018        | 3983 ms    | 4738 ms     |
| llama-3.2-3b                  | 94%     | 0.91     | 1.00 | **$0.0002**    | **749 ms** | 1370 ms     |
| gpt-4o-mini (OpenAI)          | 92%     | 1.00     | 0.98 | $0.0006        | 1960 ms    | 3859 ms     |
| llama-3.3-70b                 | 92%     | 0.93     | 0.97 | $0.0021        | 3146 ms    | 4185 ms     |
| **qwq-32b** (reasoning)       | **39%** | 0.77     | 0.37 | $0.0033        | 11283 ms   | 15837 ms    |

## Verdict

**The 8B open model is the right call — and bigger is not better.**

- **`llama-3.1-8b` is the sweet spot:** 99% pass, perfect faithfulness _and_ quality (1.00 / 1.00),
  at **$0.0003** and a sub-second median latency. It ties or beats every larger model and the frontier
  `gpt-4o-mini`. ReadAloud's production choice is vindicated.
- **Scaling up hurt here:** the **largest** model, `llama-3.3-70b`, scored **92%** — the same as
  `gpt-4o-mini` — at **7× the cost** and **~4× the latency** of the 8B. For a tight, constrained TL;DR,
  more parameters mostly bought verbosity.
- **The frontier-small model didn't win:** `gpt-4o-mini` (92%) trailed five smaller open models, dragged
  down by the custom `compression` grader — it writes thorough but _long_ summaries.
- **Cheapest/fastest:** the 3B (`$0.0002`, 749 ms) is viable when budget rules, but its judged quality
  dips (0.91) — a real quality/cost knob.
- **Reasoning models are the wrong tool:** **`qwq-32b` cratered at 39%.** Its output is literally
  _"Okay, the user wants a summary… Let me read through…"_ — pure chain-of-thought that never delivers a
  clean TL;DR. The battery caught it from every angle at once: too long, wrong sentence count, leaked
  reasoning, hallucinated a number (`2.25` from "two and a quarter hours"), poor judged quality, **and**
  15.8s p95 latency at the highest cost.

## What the custom graders added

The built-in graders said "most models are fine." The **custom** graders found the story:

- **`compression`** was the real differentiator among the good models — it revealed that the
  "smartest" candidates (`gpt-4o-mini`, `llama-3.3-70b`) are the _least concise_.
- **`no-reasoning-leak`** isolated QwQ's failure mode precisely.
- **`number-fidelity`** confirmed every production-grade model grounded all 5–8 numbers on the
  numeric Apollo-11 stress case; only the reasoning model slipped.

This is the point of the exercise: a few task-specific graders, written in your own code, turn "looks
fine" into a ranked, defensible decision.

## Honest caveats

- **Judge ceiling / self-judging.** `gpt-4o` is the judge and shares a family with `gpt-4o-mini`; the
  quality rubric was tightened to avoid saturating at 1.00. Treat judge scores as directional.
- **Workers AI pricing is approximate** (per-model `$/MTok` estimates); the _ordering_ by size is the
  signal, not the exact cents. Judge-call cost is separate from the candidate cost shown.
- **Grok not included.** Routing Grok/OpenAI/Anthropic through the Cloudflare AI Gateway needs those
  keys stored in the gateway (BYOK); add an xAI key and Grok drops straight into the lineup.

## Reproduce

```bash
cp .env.example .env     # OPENAI_API_KEY + Cloudflare Workers AI (CF_AI_BASE_URL, CLOUDFLARE_API_TOKEN)
npm install && npm run build
node packages/core/dist/cli/index.js run \
  suites/readaloud-benchmark.yaml --out results/benchmark.json --max-concurrency 6
node packages/core/dist/cli/index.js view results/benchmark.json
```

The custom graders load automatically from `promptopus.config.mjs` at the repo root.
