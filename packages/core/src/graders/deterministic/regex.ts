import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';
import { GraderError } from '../errors.js';

type Spec = Extract<GraderSpec, { type: 'regex' }>;

export function regexGrader(spec: Spec): Grader {
  let pattern: RegExp;
  try {
    pattern = new RegExp(spec.pattern, spec.flags);
  } catch (err) {
    throw new GraderError(`invalid regex /${spec.pattern}/${spec.flags ?? ''}: ${(err as Error).message}`);
  }
  const id = `regex(/${spec.pattern}/${spec.flags ?? ''})`;
  return {
    id,
    family: 'deterministic',
    grade({ output }) {
      const passed = pattern.test(output.text);
      return {
        graderId: id,
        family: 'deterministic',
        score: passed ? 1 : 0,
        passed,
        detail: passed ? 'pattern matched' : 'pattern did not match',
      };
    },
  };
}
