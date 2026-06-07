import type { GraderSpec } from '../config/schema.js';
import type { Grader } from '../domain/grader.js';
import { GraderError } from './errors.js';
import { containsGrader } from './deterministic/contains.js';
import { equalsGrader } from './deterministic/equals.js';
import { isValidJsonGrader } from './deterministic/is-valid-json.js';
import { jsonSchemaGrader } from './deterministic/json-schema.js';
import { maxLengthGrader } from './deterministic/max-length.js';
import { nonEmptyGrader } from './deterministic/non-empty.js';
import { regexGrader } from './deterministic/regex.js';
import { costBudgetGrader } from './benchmark/cost-budget.js';
import { latencyBudgetGrader } from './benchmark/latency-budget.js';
import { faithfulnessGrader } from './judge/faithfulness.js';
import { qualityGrader } from './judge/quality.js';
import type { JudgeClient } from './judge/judge-client.js';

export interface GraderDeps {
  judge?: JudgeClient;
}

export interface GraderSpecInput {
  type: string;
  [key: string]: unknown;
}

export type GraderFactory = (spec: GraderSpecInput, deps: GraderDeps) => Grader;

type Spec<T extends GraderSpec['type']> = Extract<GraderSpec, { type: T }>;

export class GraderRegistry {
  private readonly factories = new Map<string, GraderFactory>();

  register(type: string, factory: GraderFactory): this {
    this.factories.set(type, factory);
    return this;
  }

  has(type: string): boolean {
    return this.factories.has(type);
  }

  types(): string[] {
    return [...this.factories.keys()];
  }

  create(spec: GraderSpecInput, deps: GraderDeps = {}): Grader {
    const factory = this.factories.get(spec.type);
    if (!factory) {
      throw new GraderError(
        `unknown grader type "${spec.type}" (known: ${this.types().join(', ')})`,
      );
    }
    return factory(spec, deps);
  }
}

export function createGraderRegistry(): GraderRegistry {
  return new GraderRegistry()
    .register('non-empty', () => nonEmptyGrader())
    .register('max-length', (s) => maxLengthGrader(s as Spec<'max-length'>))
    .register('equals', (s) => equalsGrader(s as Spec<'equals'>))
    .register('contains', (s) => containsGrader(s as Spec<'contains'>))
    .register('regex', (s) => regexGrader(s as Spec<'regex'>))
    .register('is-valid-json', () => isValidJsonGrader())
    .register('json-schema', (s) => jsonSchemaGrader(s as Spec<'json-schema'>))
    .register('latency-budget', (s) => latencyBudgetGrader(s as Spec<'latency-budget'>))
    .register('cost-budget', (s) => costBudgetGrader(s as Spec<'cost-budget'>))
    .register('judge-faithfulness', (s, d) => faithfulnessGrader(s as Spec<'judge-faithfulness'>, d.judge))
    .register('judge-quality', (s, d) => qualityGrader(s as Spec<'judge-quality'>, d.judge));
}

const defaultRegistry = createGraderRegistry();

export function createGrader(spec: GraderSpecInput, deps: GraderDeps = {}): Grader {
  return defaultRegistry.create(spec, deps);
}
