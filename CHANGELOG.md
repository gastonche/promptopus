# Changelog

All notable changes to the `promptopus` package are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `regex` grader is now pure: global/sticky flags no longer leak `lastIndex` state across reused
  grader instances (which could make benchmark results order-dependent).
- Dashboard dev server (`promptopus view`) path containment now uses a `path.relative` check instead
  of a prefix match, closing a sibling-prefix traversal edge case.
- Error diagnostics no longer print `undefined` for non-`Error` throws (`errMessage` helper).

### Added

- ESLint (flat config) + Prettier, GitHub Actions CI (build · typecheck · lint · test on Node 20/22),
  Dependabot, and editor/Node version config.
- Expanded test suite (aggregate, concurrency pool, pricing, tokens, Retry-After parsing, the
  dashboard server, and the regex regression).

## [0.1.1] - 2026-06-07

### Fixed

- Corrected the published `repository` / `bugs` URLs to `github.com/gastonche/promptopus`.

### Added

- Exposed `./package.json` via the package `exports` map for tooling that reads it.

## [0.1.0] - 2026-06-06

### Added

- Initial release: config-driven LLM evaluation harness with a `promptopus` CLI (`init` / `run` /
  `view`) and a programmatic API.
- `Provider` interface with OpenAI, Anthropic, OpenAI-compatible (Workers AI / local), and `mock`
  implementations behind a registry.
- Three grader families behind one `Grader` interface — deterministic asserts, LLM-as-judge
  (faithfulness + quality), and cost/latency budgets — plus a plugin system
  (`promptopus.config.mjs`) for custom providers and graders.
- Concurrent runner with rate-limit-aware retry/backoff, per-cell error capture, and a JSON report
  artifact; a static React dashboard bundled with the package and served by `promptopus view`.

[unreleased]: https://github.com/gastonche/promptopus/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/gastonche/promptopus/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gastonche/promptopus/releases/tag/v0.1.0
