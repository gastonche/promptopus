import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';

type Spec = Extract<GraderSpec, { type: 'json-schema' }>;
type Schema = Record<string, unknown>;

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  return typeOf(value) === type;
}

function validate(value: unknown, schema: Schema, path: string, errors: string[]): void {
  const expected = schema['type'];
  if (typeof expected === 'string' && !matchesType(value, expected)) {
    errors.push(`${path || '<root>'}: expected ${expected}, got ${typeOf(value)}`);
    return;
  }

  const enumValues = schema['enum'];
  if (Array.isArray(enumValues) && !enumValues.some((e) => e === value)) {
    errors.push(`${path || '<root>'}: value not in enum`);
  }

  if (typeof value === 'string') {
    const min = schema['minLength'];
    const max = schema['maxLength'];
    if (typeof min === 'number' && value.length < min) errors.push(`${path}: shorter than ${min}`);
    if (typeof max === 'number' && value.length > max) errors.push(`${path}: longer than ${max}`);
  }

  if (typeof value === 'number') {
    const min = schema['minimum'];
    const max = schema['maximum'];
    if (typeof min === 'number' && value < min) errors.push(`${path}: less than ${min}`);
    if (typeof max === 'number' && value > max) errors.push(`${path}: greater than ${max}`);
  }

  if (typeOf(value) === 'object') {
    const obj = value as Record<string, unknown>;
    const required = schema['required'];
    if (Array.isArray(required)) {
      for (const key of required) {
        if (typeof key === 'string' && !(key in obj)) errors.push(`${path}.${key}: required`);
      }
    }
    const properties = schema['properties'];
    if (properties && typeOf(properties) === 'object') {
      for (const [key, sub] of Object.entries(properties as Record<string, unknown>)) {
        if (key in obj && typeOf(sub) === 'object') {
          validate(obj[key], sub as Schema, `${path}.${key}`, errors);
        }
      }
    }
  }

  if (Array.isArray(value)) {
    const items = schema['items'];
    if (items && typeOf(items) === 'object') {
      value.forEach((item, i) => validate(item, items as Schema, `${path}[${i}]`, errors));
    }
  }
}

export function jsonSchemaGrader(spec: Spec): Grader {
  return {
    id: 'json-schema',
    family: 'deterministic',
    grade({ output }) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(output.text.trim());
      } catch (err) {
        return {
          graderId: 'json-schema',
          family: 'deterministic',
          score: 0,
          passed: false,
          detail: `output is not valid JSON: ${(err as Error).message}`,
        };
      }
      const errors: string[] = [];
      validate(parsed, spec.schema, '', errors);
      const passed = errors.length === 0;
      return {
        graderId: 'json-schema',
        family: 'deterministic',
        score: passed ? 1 : 0,
        passed,
        detail: passed ? 'matches schema' : errors.slice(0, 3).join('; '),
      };
    },
  };
}
