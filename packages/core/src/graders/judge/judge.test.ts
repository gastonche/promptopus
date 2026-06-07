import { describe, expect, it } from 'vitest';

import type { GenerateResult, Provider } from '../../domain/provider.js';
import type { TestCase } from '../../domain/testcase.js';
import { MockProvider } from '../../providers/mock.js';
import { createGrader } from '../registry.js';
import { JudgeClient, JudgeError, parseVerdict } from './judge-client.js';

const testCase: TestCase = {
  id: 't',
  prompt: 'Summarize the source.',
  source: 'The Eiffel Tower is in Paris and opened in 1889.',
  graders: [],
};

function out(text: string): GenerateResult {
  return { text, tokensIn: 1, tokensOut: 1, latencyMs: 1, costUsd: 0 };
}

function judgeReturning(text: string): JudgeClient {
  return new JudgeClient(new MockProvider({ name: 'judge', model: 'mock', text }));
}

describe('parseVerdict', () => {
  it('parses clean JSON', () => {
    expect(parseVerdict('{"score":0.8,"reasoning":"ok"}')).toEqual({ score: 0.8, reasoning: 'ok' });
  });

  it('extracts JSON from prose and code fences', () => {
    expect(parseVerdict('Here is my verdict:\n```json\n{"score": 0.5}\n```').score).toBe(0.5);
  });

  it('clamps out-of-range scores', () => {
    expect(parseVerdict('{"score": 1.7}').score).toBe(1);
  });

  it('throws JudgeError on non-JSON', () => {
    expect(() => parseVerdict('I think it is fine.')).toThrowError(JudgeError);
  });
});

describe('judge graders', () => {
  it('judge-quality scores and applies the threshold', async () => {
    const grader = createGrader(
      { type: 'judge-quality', threshold: 0.7 },
      { judge: judgeReturning('{"score":0.9,"reasoning":"clear and correct"}') },
    );
    const result = await grader.grade({
      testCase,
      output: out('Paris, 1889.'),
      provider: { name: 'p', model: 'm' },
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(0.9);
    expect(result.family).toBe('judge');
  });

  it('judge-faithfulness fails when no source is provided', async () => {
    const grader = createGrader(
      { type: 'judge-faithfulness', threshold: 0.7 },
      { judge: judgeReturning('{"score":1}') },
    );
    const noSource: TestCase = { id: 'n', prompt: 'p', graders: [] };
    const result = await grader.grade({
      testCase: noSource,
      output: out('x'),
      provider: { name: 'p', model: 'm' },
    });
    expect(result.passed).toBe(false);
    expect(result.detail).toMatch(/no source/);
  });

  it('degrades gracefully when the judge call fails', async () => {
    const flaky: Provider = {
      name: 'judge',
      model: 'm',
      generate: () => Promise.reject(new Error('judge offline')),
    };
    const grader = createGrader(
      { type: 'judge-quality', threshold: 0.7 },
      { judge: new JudgeClient(flaky) },
    );
    const result = await grader.grade({
      testCase,
      output: out('x'),
      provider: { name: 'p', model: 'm' },
    });
    expect(result.passed).toBe(false);
    expect(result.detail).toMatch(/judge failed/);
  });

  it('degrades gracefully when the judge returns malformed output', async () => {
    const grader = createGrader(
      { type: 'judge-quality', threshold: 0.7 },
      { judge: judgeReturning('totally not json') },
    );
    const result = await grader.grade({
      testCase,
      output: out('x'),
      provider: { name: 'p', model: 'm' },
    });
    expect(result.passed).toBe(false);
    expect(result.detail).toMatch(/judge failed/);
  });
});
