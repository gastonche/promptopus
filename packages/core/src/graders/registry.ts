import type { GraderSpec } from '../config/schema.js';
import type { Grader } from '../domain/grader.js';
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

export function createGrader(spec: GraderSpec, deps: GraderDeps = {}): Grader {
  switch (spec.type) {
    case 'non-empty':
      return nonEmptyGrader();
    case 'max-length':
      return maxLengthGrader(spec);
    case 'equals':
      return equalsGrader(spec);
    case 'contains':
      return containsGrader(spec);
    case 'regex':
      return regexGrader(spec);
    case 'is-valid-json':
      return isValidJsonGrader();
    case 'json-schema':
      return jsonSchemaGrader(spec);
    case 'latency-budget':
      return latencyBudgetGrader(spec);
    case 'cost-budget':
      return costBudgetGrader(spec);
    case 'judge-faithfulness':
      return faithfulnessGrader(spec, deps.judge);
    case 'judge-quality':
      return qualityGrader(spec, deps.judge);
  }
}
