---
title: The ReadAloud benchmark
description: A 10-model, 12-grader benchmark of a real product's TL;DR feature — and what it found.
section: Going further
order: 2
---

Promptopus is dogfooded against a real feature: the **TL;DR summarizer** of ReadAloud, which ships an
open 8B model on Cloudflare Workers AI. Two product questions: **is the 8B the right pick — or would a
bigger / frontier model be better — and are reasoning models worth a look?**

So this is a real benchmark: **10 models**, **6 article excerpts**, a **12-grader battery**, using
ReadAloud's exact production prompt (3–5 sentences, no markdown, `max_tokens: 512`).

## Setup

**Models** — `gpt-4o-mini` (OpenAI) plus a Workers AI ladder via the Cloudflare AI Gateway: Llama
3.2-3B → 3.1-8B → 3.1-70B → 3.3-70B, Llama-4-Scout-17B, Mistral-24B, Qwen2.5-Coder-32B, Gemma-3-12B, and the
**QwQ-32B reasoning model**.

**Graders (12):**

- **Simple deterministic** — `non-empty`, `max-length`, `regex` (no markdown).
- **LLM-as-judge** (`gpt-4o`) — `judge-faithfulness`, `judge-quality`.
- **Cost + latency** — `latency-budget`, `cost-budget`.
- **Custom** (in `promptopus.config.mjs`, no fork) — `sentence-count`, `no-meta-reference`,
  `no-reasoning-leak`, `number-fidelity`, `compression`.

## Results

| Model             | Pass    | Judge    | Cost (6) | p95      |
| ----------------- | ------- | -------- | -------- | -------- |
| **llama-3.1-8b**  | **99%** | **1.00** | $0.0003  | 3220 ms  |
| mistral-24b       | 99%     | 0.98     | $0.0008  | 4576 ms  |
| gemma-3-12b       | 97%     | 1.00     | $0.0008  | 1665 ms  |
| llama-4-scout     | 97%     | 0.98     | $0.0009  | 1944 ms  |
| qwen2.5-coder-32b | 96%     | 0.98     | $0.0015  | 3682 ms  |
| llama-3.1-70b     | 96%     | 1.00     | $0.0018  | 4738 ms  |
| llama-3.2-3b      | 94%     | 0.91     | $0.0002  | 1370 ms  |
| gpt-4o-mini       | 92%     | 1.00     | $0.0006  | 3859 ms  |
| llama-3.3-70b     | 92%     | 0.93     | $0.0021  | 4185 ms  |
| **qwq-32b**       | **39%** | 0.77     | $0.0033  | 15837 ms |

## Verdict

**The 8B open model is the right call — and bigger is not better.**

- **`llama-3.1-8b` is the sweet spot** — 99% pass, perfect faithfulness _and_ quality, ~$0.0003, sub-second
  median latency. It ties or beats the frontier `gpt-4o-mini` and every larger model.
- **Scaling up hurt** — the largest model, `llama-3.3-70b`, scored 92% (same as `gpt-4o-mini`) at ~7× the
  cost. More parameters mostly bought verbosity.
- **Reasoning models are the wrong tool** — `qwq-32b` cratered at **39%**. Its output is pure
  chain-of-thought (_"Okay, the user wants a summary… Let me read through…"_), caught at once by length,
  sentence-count, `no-reasoning-leak`, `number-fidelity`, judged quality, **and** a 15.8s p95.

## What the custom graders added

The built-ins said "most models are fine"; the custom graders found the story. **`compression`** revealed
that the "smartest" models (`gpt-4o-mini`, `llama-3.3-70b`) are the _least concise_; **`no-reasoning-leak`**
isolated QwQ's failure; **`number-fidelity`** confirmed every production model grounded all numbers on the
Apollo-11 stress case. A few task-specific graders, written in your own code, turn "looks fine" into a
ranked decision. See [Extending](/docs/extending).

## Caveats

- **Judge ceiling / self-judging** — `gpt-4o` judges, and shares a family with `gpt-4o-mini`; the rubric
  was tightened to avoid saturation. Treat judge scores as directional.
- **Workers AI pricing is approximate** — the _ordering_ by size is the signal, not exact cents.
- **Grok** needs an xAI key stored in your CF gateway (BYOK) to route through the compat endpoint.

## Reproduce

```bash
cp .env.example .env   # OPENAI_API_KEY + Cloudflare Workers AI vars
npm install && npm run build
promptopus run suites/readaloud-benchmark.yaml \
  --out results/benchmark.json --max-concurrency 6
promptopus view results/benchmark.json
```

The custom graders load automatically from `promptopus.config.mjs`.

Next: [What I'd do at scale](/docs/whats-next).
