import type { ZodError, ZodIssue } from 'zod';

export class PromptopusConfigError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'PromptopusConfigError';
    this.issues = issues;
  }
}

export function formatPath(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) return '<root>';
  let out = '';
  for (const seg of path) {
    if (typeof seg === 'number') {
      out += `[${seg}]`;
    } else {
      out += out === '' ? seg : `.${seg}`;
    }
  }
  return out;
}

function formatIssue(issue: ZodIssue): string {
  return `${formatPath(issue.path)}: ${issue.message}`;
}

export function fromZodError(error: ZodError, source: string): PromptopusConfigError {
  const issues = error.issues.map(formatIssue).sort((a, b) => a.localeCompare(b));
  const message =
    `Invalid suite config (${source}) — ${issues.length} ` +
    `issue${issues.length === 1 ? '' : 's'}:\n` +
    issues.map((line) => `  • ${line}`).join('\n');
  return new PromptopusConfigError(message, issues);
}
