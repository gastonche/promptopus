import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';

type Spec = Extract<GraderSpec, { type: 'max-length' }>;

export function maxLengthGrader(spec: Spec): Grader {
  const id = `max-length(${spec.chars})`;
  return {
    id,
    family: 'deterministic',
    grade({ output }) {
      const len = output.text.length;
      const passed = len <= spec.chars;
      return {
        graderId: id,
        family: 'deterministic',
        score: passed ? 1 : 0,
        passed,
        detail: `${len}/${spec.chars} chars`,
      };
    },
  };
}
