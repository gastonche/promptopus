# ReadAloud TL;DR Summarizer — Eval Findings

> Evidence report produced by **Promptopus**, a config-driven LLM evaluation harness.
> Suite: [`suites/readaloud-summarizer.yaml`](../suites/readaloud-summarizer.yaml) ·
> Raw report: [`results/results.json`](../results/results.json) · Run date: 2026-06-06.

## Question

ReadAloud's "TL;DR" feature summarizes an article into 3–5 sentences of plain prose, and ships an
**open 8-billion-parameter model on Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`). Is
that cheap open model actually good enough, or is ReadAloud leaving quality on the table by not
using a frontier small model?

This eval pits **Llama-3.1-8B (Workers AI)** against **gpt-4o-mini (OpenAI)** — the obvious frontier
small-model alternative — using ReadAloud's *exact* production system prompt and output constraints
(3–5 sentences, plain prose, no markdown, `max_tokens: 512`), across five article excerpts spanning
encyclopedic, scientific, news, and narrative styles. Summaries are graded by an independent judge
(`gpt-4o`) plus deterministic and cost/latency checks.

The three grader families:

- **Deterministic** — non-empty, under a length cap, and plain prose (a regex rejects bullets/markdown).
- **LLM-as-judge** (judge: `gpt-4o`) — **faithfulness** (does the summary invent facts not in the
  source?) and a **quality** rubric (concise, covers the main points, no meta-references).
- **Cost + latency** — per-call USD and latency against budgets.

![Promptopus dashboard — ReadAloud summarizer comparison](./dashboard-screenshot.png)

## Results

| Metric | gpt-4o-mini (OpenAI) | llama-3.1-8b (Workers AI) |
| --- | --- | --- |
| Pass rate | 100% | 100% |
| Faithfulness (judge) | 0.96 | **1.00** |
| Quality (judge, family mean) | 0.96 | **0.99** |
| Deterministic | 1.00 | 1.00 |
| **Total cost** (5 cases) | $0.00048 | **$0.00024** |
| Cost / call | $0.0001 | **$0.00005** |
| **Latency p50** | **1998 ms** | 5685 ms |
| **Latency p95** | **2436 ms** | 6880 ms |
| Tokens in / out | 1165 / 501 | 1293 / 469 |
| Errors | 0 | 0 |

## Verdict: ReadAloud's open-8B choice is the right call

**The cheap open model wins on the axes that matter for this feature.** Llama-3.1-8B **matched — even
slightly edged — gpt-4o-mini on quality and faithfulness** while costing **half as much**. The single
most telling cell: on the *black-holes* case, gpt-4o-mini's faithfulness dropped to **0.80** because
the judge caught an unsupported embellishment, while Llama-8B stayed **1.00** on the same source.
Across all five cases Llama never hallucinated; gpt-4o-mini slipped once.

**The price Llama pays is latency.** It ran **~2.8× slower at p95** (6.9 s vs 2.4 s) and was far more
variable (1.4 s–6.9 s vs a tight 1.6 s–2.4 s for gpt-4o-mini). Both stayed inside the 8 s budget and
passed every grader, so for an **opt-in, asynchronous** TL;DR that the user then plays back via
text-to-speech, that latency is acceptable — and it buys a 2× cost saving with no quality loss.

**Recommendation: ReadAloud should stay on the 8B Workers AI model.** It is as faithful, as good, and
half the cost of the frontier small model. The only reason to switch would be a latency-sensitive,
interactive surface — which the TL;DR feature is not.

## Honest caveats

- **Judge ceiling / rubric tuning.** An early run with a looser rubric scored everything 1.00 (the
  judge saturated). Tightening the quality rubric to use the full 0–1 range produced the spread above.
  Faithfulness on clean factual excerpts is still an easy task; a harder corpus (long, contradictory,
  or adversarial sources) would separate models more.
- **Self-judging bias.** The judge (`gpt-4o`) shares a family with one candidate (`gpt-4o-mini`).
  Models tend to favor their own style, so if anything the gpt-4o-mini numbers are *generously*
  estimated — which only strengthens the "the 8B model is enough" conclusion.
- **Anthropic was dropped mid-run.** The suite also defines a `claude-haiku-4-5` candidate. During the
  full three-way run the Anthropic account **ran out of credits**, so those cells errored. Promptopus
  recorded the failures as error results and the run continued (partial-run resilience), and the
  committed report excludes Anthropic via `--providers`. Re-add it once credits are available.

## Reproduce

```bash
cp .env.example .env     # add OPENAI_API_KEY, CLOUDFLARE_API_TOKEN, CF_AI_BASE_URL (and ANTHROPIC_API_KEY for the 3-way)
npm install && npm run build
node packages/core/dist/cli/index.js run \
  suites/readaloud-summarizer.yaml --providers gpt-4o-mini,llama-8b --out results/results.json
node packages/core/dist/cli/index.js view results/results.json
```

A single-vendor variant ([`suites/readaloud-summarizer.openai.yaml`](../suites/readaloud-summarizer.openai.yaml))
compares gpt-4o-mini vs gpt-4o (small vs large within one vendor) if you want that angle.
