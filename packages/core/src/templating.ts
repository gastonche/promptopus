const TEMPLATE_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}/g;

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export type TemplateVars = Record<string, string | number | boolean>;

export function interpolate(template: string, vars: TemplateVars = {}): string {
  return template.replace(TEMPLATE_PATTERN, (_match, rawName: string) => {
    const name = rawName.trim();
    if (!(name in vars)) {
      const known = Object.keys(vars);
      const hint = known.length ? ` (available: ${known.join(', ')})` : ' (no variables supplied)';
      throw new TemplateError(`unknown template variable "{{${name}}}"${hint}`);
    }
    return String(vars[name]);
  });
}

export function referencedVars(template: string): string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(TEMPLATE_PATTERN)) {
    const name = match[1]?.trim();
    if (name) names.add(name);
  }
  return [...names];
}
