# Results

Committed evaluation artifacts produced by Promptopus.

- **[`benchmark.json`](./benchmark.json)** — the canonical dogfood report: the 10-model, 12-grader
  ReadAloud TL;DR benchmark. This is what the dashboard sample and the
  [findings writeup](../docs/readaloud-eval.md) are built from.

Regenerate it with:

```bash
promptopus run suites/readaloud-benchmark.yaml --out results/benchmark.json --max-concurrency 6
promptopus view results/benchmark.json
```

Reports are plain JSON (the `Report` shape from the `promptopus` package), so any tool can read them.
