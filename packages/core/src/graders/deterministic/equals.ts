import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';

type Spec = Extract<GraderSpec, { type: 'equals' }>;

export function equalsGrader(spec: Spec): Grader {
  const id = 'equals';
  const normalize = (s: string): string => {
    let out = spec.trim ? s.trim() : s;
    if (spec.caseInsensitive) out = out.toLowerCase();
    return out;
  };
  return {
    id,
    family: 'deterministic',
    grade({ output }) {
      const passed = normalize(output.text) === normalize(spec.value);
      return {
        graderId: id,
        family: 'deterministic',
        score: passed ? 1 : 0,
        passed,
        detail: passed ? 'output equals expected value' : 'output does not equal expected value',
      };
    },
  };
}
