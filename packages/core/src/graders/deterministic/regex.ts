import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';
import { errMessage } from '../../util.js';
import { GraderError } from '../errors.js';

type Spec = Extract<GraderSpec, { type: 'regex' }>;

export function regexGrader(spec: Spec): Grader {
  // Strip the global/sticky flags: this grader only uses `.test`, and a stateful
  // RegExp (lastIndex advancing between calls) would make grading order-dependent
  // when the same instance is reused across providers.
  const flags = (spec.flags ?? '').replace(/[gy]/g, '');
  let pattern: RegExp;
  try {
    pattern = new RegExp(spec.pattern, flags);
  } catch (err) {
    throw new GraderError(`invalid regex /${spec.pattern}/${spec.flags ?? ''}: ${errMessage(err)}`);
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
