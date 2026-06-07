import { errMessage } from '../../util.js';
import type { Grader } from '../../domain/grader.js';

export function isValidJsonGrader(): Grader {
  return {
    id: 'is-valid-json',
    family: 'deterministic',
    grade({ output }) {
      try {
        JSON.parse(output.text.trim());
        return {
          graderId: 'is-valid-json',
          family: 'deterministic',
          score: 1,
          passed: true,
          detail: 'output parses as JSON',
        };
      } catch (err) {
        return {
          graderId: 'is-valid-json',
          family: 'deterministic',
          score: 0,
          passed: false,
          detail: `not valid JSON: ${errMessage(err)}`,
        };
      }
    },
  };
}
