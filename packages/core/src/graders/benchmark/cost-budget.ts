import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';

type Spec = Extract<GraderSpec, { type: 'cost-budget' }>;

export function costBudgetGrader(spec: Spec): Grader {
  const id = `cost-budget($${spec.maxUsd})`;
  return {
    id,
    family: 'benchmark',
    grade({ output }) {
      const cost = output.costUsd;
      const passed = cost <= spec.maxUsd;
      const score = passed ? 1 : cost === 0 ? 1 : Math.max(0, spec.maxUsd / cost);
      return {
        graderId: id,
        family: 'benchmark',
        score,
        passed,
        detail: `$${cost.toFixed(5)} vs $${spec.maxUsd} budget`,
      };
    },
  };
}
