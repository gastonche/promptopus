import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';

type Spec = Extract<GraderSpec, { type: 'contains' }>;

export function containsGrader(spec: Spec): Grader {
  const id = `contains(${JSON.stringify(spec.value)})`;
  return {
    id,
    family: 'deterministic',
    grade({ output }) {
      const haystack = spec.caseInsensitive ? output.text.toLowerCase() : output.text;
      const needle = spec.caseInsensitive ? spec.value.toLowerCase() : spec.value;
      const passed = haystack.includes(needle);
      return {
        graderId: id,
        family: 'deterministic',
        score: passed ? 1 : 0,
        passed,
        detail: passed ? `found "${spec.value}"` : `"${spec.value}" not found`,
      };
    },
  };
}
