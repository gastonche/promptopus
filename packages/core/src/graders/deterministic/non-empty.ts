import type { Grader } from '../../domain/grader.js';

export function nonEmptyGrader(): Grader {
  return {
    id: 'non-empty',
    family: 'deterministic',
    grade({ output }) {
      const trimmed = output.text.trim();
      const passed = trimmed.length > 0;
      return {
        graderId: 'non-empty',
        family: 'deterministic',
        score: passed ? 1 : 0,
        passed,
        detail: passed ? `output has ${trimmed.length} chars` : 'output is empty',
      };
    },
  };
}
