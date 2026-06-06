import type { GraderSpec } from '../../config/schema.js';
import type { Grader, GraderResult } from '../../domain/grader.js';
import { GraderError } from '../errors.js';
import type { JudgeClient } from './judge-client.js';
import { qualityPrompt } from './prompts.js';

type Spec = Extract<GraderSpec, { type: 'judge-quality' }>;

export function qualityGrader(spec: Spec, judge: JudgeClient | undefined): Grader {
  if (!judge) {
    throw new GraderError('judge-quality requires a configured judge model');
  }
  const id = `judge-quality(>=${spec.threshold})`;
  return {
    id,
    family: 'judge',
    async grade({ testCase, output }): Promise<GraderResult> {
      try {
        const verdict = await judge.evaluate(
          qualityPrompt(testCase.prompt, output.text, spec.rubric, testCase.reference),
        );
        return {
          graderId: id,
          family: 'judge',
          score: verdict.score,
          passed: verdict.score >= spec.threshold,
          detail: verdict.reasoning || `score ${verdict.score.toFixed(2)}`,
        };
      } catch (err) {
        return {
          graderId: id,
          family: 'judge',
          score: 0,
          passed: false,
          detail: `judge failed: ${(err as Error).message}`,
        };
      }
    },
  };
}
