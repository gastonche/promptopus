---
title: CLI reference
description: Every command and flag — init, run, and view.
section: Tooling
order: 1
---

The CLI is exposed as `promptopus` (with a short alias `pop`). Install it globally
(`npm i -g promptopus`) or run it ad-hoc with `npx promptopus …`. A `.env` file in the working
directory is loaded automatically.

```bash
npx promptopus --help
promptopus --version
```

## `promptopus init`

Scaffold an example suite so the tool is usable in seconds.

```bash
promptopus init [file]
```

| Argument / flag | Default                 | Description                                            |
| --------------- | ----------------------- | ------------------------------------------------------ |
| `[file]`        | `promptopus.suite.yaml` | Output path.                                           |
| `-f, --force`   | —                       | Overwrite the file if it exists.                       |
| `--stdout`      | —                       | Print the example to stdout instead of writing a file. |

```bash
promptopus init my-eval.yaml
promptopus init --stdout > my-eval.yaml
```

## `promptopus run`

Run a suite against its providers, write a JSON report, and print a summary table.

```bash
promptopus run <suite> [options]
```

| Flag                        | Default        | Description                                                                                                        |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `<suite>`                   | —              | Path to the suite YAML (required).                                                                                 |
| `-o, --out <file>`          | `results.json` | Where to write the JSON report (parent dir auto-created).                                                          |
| `-p, --providers <list>`    | all            | Comma-separated subset of provider names to run.                                                                   |
| `-c, --max-concurrency <n>` | `4`            | Max concurrent provider calls.                                                                                     |
| `-r, --retries <n>`         | `2`            | Retries per call on rate-limit / 5xx / network errors.                                                             |
| `--config <path>`           | auto           | A `promptopus.config.{mjs,js}` plugin file (auto-discovered in the working dir). See [Extending](/docs/extending). |

```bash
# full run
promptopus run suites/readaloud-summarizer.yaml --out results/results.json

# subset, higher concurrency, more retries
promptopus run suite.yaml -p gpt-4o-mini,llama-8b -c 8 -r 3
```

**Exit behavior.** A configuration error (bad YAML, schema violation, missing key, unknown provider)
exits non-zero with a friendly message and runs nothing. A completed run exits zero even if some cells
errored — those are captured in the report. See [Running evals](/docs/running).

## `promptopus view`

Serve the dashboard against a results file and open it in your browser.

```bash
promptopus view [results]
```

| Argument / flag  | Default        | Description                         |
| ---------------- | -------------- | ----------------------------------- |
| `[results]`      | `results.json` | Path to a JSON report.              |
| `-p, --port <n>` | `4317`         | Port to serve on.                   |
| `--no-open`      | —              | Don't open a browser automatically. |

```bash
promptopus view results/results.json
promptopus view results.json --port 8080 --no-open
```

The server serves the dashboard plus your report at `/report.json`. The dashboard ships **bundled with
the package**, so `view` works out of the box after `npm i promptopus`. See [Dashboard](/docs/dashboard).

## Tips

- Pipe-friendly: status and progress go to **stderr**; the summary table goes to **stdout**, so
  `promptopus run … > table.txt` captures just the table.
- Colors auto-disable when output isn't a TTY or when `NO_COLOR` is set.

Next: [Dashboard](/docs/dashboard).
