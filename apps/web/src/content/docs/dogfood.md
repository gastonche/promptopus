---
title: The ReadAloud dogfood
description: A real product eval — gpt-4o-mini vs Llama-3.1-8B — and what it found.
section: Going further
order: 2
---

Promptopus is dogfooded against a real feature: the **TL;DR summarizer** of ReadAloud, which ships an
open 8-billion-parameter model (`@cf/meta/llama-3.1-8b-instruct`) on Cloudflare Workers AI. The
question: **is that cheap open model as good as a frontier small model?**

## Setup

The suite (`suites/readaloud-summarizer.yaml`) uses ReadAloud's *exact* production system prompt and
constraints — 3–5 sentences of plain prose, no markdown, `max_tokens: 512` — across five article
excerpts (encyclopedic, scientific, news, narrative). Each summary is graded by all three families:

- **Deterministic** — non-empty, under a length cap, and plain-prose (a regex rejects markdown).
- **LLM-as-judge** (`gpt-4o`) — faithfulness to the source and a tightened quality rubric.
- **Cost + latency** — per-call budgets.

Candidates: **gpt-4o-mini** (OpenAI) vs **llama-3.1-8b** (Cloudflare Workers AI).

## Results

| Metric | gpt-4o-mini | llama-3.1-8b |
| --- | --- | --- |
| Pass rate | 100% | 100% |
| Faithfulness (judge) | 0.96 | **1.00** |
| Quality (judge) | 0.96 | **0.99** |
| Total cost (5 cases) | $0.00048 | **$0.00024** |
| Cost / call | $0.0001 | **$0.00005** |
| Latency p50 | **1998 ms** | 5685 ms |
| Latency p95 | **2436 ms** | 6880 ms |

## Verdict

**The open 8B model matched — even slightly edged — the frontier model on faithfulness and quality, at
half the cost.** The single most telling cell: on the *black-holes* case, gpt-4o-mini's faithfulness
dropped to **0.80** because the judge caught an unsupported embellishment, while Llama stayed **1.00**.
Across all five cases Llama never hallucinated; gpt-4o-mini slipped once.

The price Llama pays is **latency** — about 2.8× slower at p95 (6.9 s vs 2.4 s) and far more variable.
For an opt-in, asynchronous TL;DR that then gets read aloud, that's an acceptable trade for a 2× cost
saving with no quality loss. **ReadAloud's choice of the 8B model is well-justified.**

## What this demonstrates about Promptopus

- **All three families in one report** — structure (deterministic), quality (judge), economics (cost/latency).
- **Cross-vendor** — OpenAI and Cloudflare Workers AI behind one interface.
- **Honest signal** — a tightened rubric surfaced a real faithfulness slip the looser one missed.
- **Resilience** — an early three-way run hit an Anthropic credit outage mid-run; the harness recorded
  the errors and produced a usable report for the rest.

## Caveats (and why they matter)

- **Judge ceiling effect** — a loose rubric scored everything 1.00; tightening it produced the spread
  above. See [LLM-as-judge](/docs/llm-judge).
- **Self-judging bias** — the judge (`gpt-4o`) shares a family with one candidate, so gpt-4o-mini's
  numbers are, if anything, generously estimated — which only strengthens the conclusion.

## Reproduce

```bash
cp .env.example .env   # OPENAI_API_KEY + Cloudflare Workers AI vars
npm install && npm run build
promptopus run suites/readaloud-summarizer.yaml \
  --providers gpt-4o-mini,llama-8b --out results/results.json
promptopus view results/results.json
```

Next: [What I'd do at scale](/docs/whats-next).
