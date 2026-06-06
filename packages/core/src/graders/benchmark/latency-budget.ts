import type { GraderSpec } from '../../config/schema.js';
import type { Grader } from '../../domain/grader.js';
import { GraderError } from '../errors.js';

type Spec = Extract<GraderSpec, { type: 'latency-budget' }>;

export function latencyBudgetGrader(spec: Spec): Grader {
  const budget = spec.maxMs ?? spec.p95Ms;
  if (budget === undefined) {
    throw new GraderError('latency-budget needs maxMs or p95Ms');
  }
  const id = `latency-budget(${budget}ms)`;
  return {
    id,
    family: 'benchmark',
    grade({ output }) {
      const ms = output.latencyMs;
      const passed = ms <= budget;
      return {
        graderId: id,
        family: 'benchmark',
        score: passed ? 1 : Math.max(0, budget / ms),
        passed,
        detail: `${ms}ms vs ${budget}ms budget`,
      };
    },
  };
}
