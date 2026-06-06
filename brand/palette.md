# Promptopus palette

Purple-forward, with two functional accents for pass/fail. These values are the
single source of truth — the dashboard wires them into Tailwind theme tokens so
the UI, score highlighting, and charts all draw from here.

| Token              | Hex       | Role                                            |
| ------------------ | --------- | ----------------------------------------------- |
| `purple-900` ink   | `#1E1B2E` | Text on light surfaces, eyes, deep contrast     |
| `purple-700` primary | `#6D28D9` | Primary brand, headings, primary buttons        |
| `purple-600`       | `#7C3AED` | Hover / gradient mid                            |
| `purple-500` accent | `#A855F7` | Accent, links, "opus" in the wordmark           |
| `purple-300` highlight | `#C4B5FD` | Highlights, focus rings, gradient top         |
| `surface`          | `#F5F3FF` | App background / surface                         |

## Functional (status) colors

| Token  | Hex       | Role                          |
| ------ | --------- | ----------------------------- |
| `pass` | `#16A34A` | Passed graders, best-in-row   |
| `fail` | `#DC2626` | Failed graders, worst-in-row  |
| `warn` | `#D97706` | Near-threshold / cautions     |

## Logo

- `logo-mark.svg` — square octopus glyph (favicon, app header).
- `logo.svg` — mark + "Promptopus" wordmark + tagline (README banner).

The five tentacles read as "one body, many arms into many models" — the core
idea of a multi-provider eval harness.
