# Security Policy

## Supported versions

Promptopus is pre-1.0; only the latest published release receives fixes.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

- Preferred: use GitHub's **[Private vulnerability reporting](https://github.com/gastonche/promptopus/security/advisories/new)**.
- Or email **gastonnkh@gmail.com** with details and a reproduction.

You'll get an acknowledgement within a few days. Once a fix is ready, a patch release will be cut and
the advisory published with credit (unless you prefer to remain anonymous).

## Handling of secrets

Promptopus reads provider API keys from environment variables only (auto-loaded from a local `.env`).
Keys are **never** written into the JSON report or any committed artifact, and `.env` is gitignored.
If you find a path where a key could leak into output, please report it via the channels above.
