import type { GraderSpec } from '../../config/schema.js';
import type { Grader, GraderResult } from '../../domain/grader.js';
import { GraderError } from '../errors.js';
import type { JudgeClient } from './judge-client.js';
import { faithfulnessPrompt } from './prompts.js';

type Spec = Extract<GraderSpec, { type: 'judge-faithfulness' }>;

export function faithfulnessGrader(spec: Spec, judge: JudgeClient | undefined): Grader {
  if (!judge) {
    throw new GraderError('judge-faithfulness requires a configured judge model');
  }
  const id = `judge-faithfulness(>=${spec.threshold})`;
  return {
    id,
    family: 'judge',
    async grade({ testCase, output }): Promise<GraderResult> {
      if (!testCase.source) {
        return {
          graderId: id,
          family: 'judge',
          score: 0,
          passed: false,
          detail: 'no source text provided — faithfulness cannot be judged',
        };
      }
      try {
        const verdict = await judge.evaluate(faithfulnessPrompt(testCase.source, output.text));
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
