import { describe, expect, it } from 'vitest';

import { PromptopusConfigError } from './errors.js';
import { parseSuiteConfig, resolveSuite } from './load.js';

const VALID = `
name: Demo
judge:
  provider: anthropic
  model: claude-3-5-sonnet-latest
providers:
  - name: gpt
    kind: openai
    model: gpt-4o-mini
defaults:
  graders:
    - type: non-empty
cases:
  - id: c1
    prompt: "Capital of {{country}}?"
    vars: { country: France }
    graders:
      - type: contains
        value: Paris
      - type: judge-quality
        threshold: 0.8
`;

describe('parseSuiteConfig (happy path)', () => {
  it('parses a valid suite and applies grader defaults (threshold)', () => {
    const cfg = parseSuiteConfig(VALID, 'demo.yaml');
    expect(cfg.name).toBe('Demo');
    expect(cfg.providers).toHaveLength(1);
    const judgeGrader = cfg.cases[0]?.graders?.[1];
    expect(judgeGrader).toMatchObject({ type: 'judge-quality', threshold: 0.8 });
  });
});

describe('resolveSuite', () => {
  it('interpolates prompts and resolves graders', () => {
    const suite = resolveSuite(parseSuiteConfig(VALID));
    expect(suite.cases[0]?.prompt).toBe('Capital of France?');
    expect(suite.cases[0]?.graders).toHaveLength(2);
  });

  it('falls back to defaults.graders when a case omits its own', () => {
    const yaml = `
name: D
providers: [{ name: p, kind: openai, model: gpt-4o-mini }]
defaults:
  graders: [{ type: non-empty }]
cases:
  - id: c1
    prompt: hi
`;
    const suite = resolveSuite(parseSuiteConfig(yaml));
    expect(suite.cases[0]?.graders).toEqual([{ type: 'non-empty' }]);
  });
});

describe('friendly validation errors', () => {
  function expectIssue(yaml: string, pattern: RegExp): void {
    try {
      parseSuiteConfig(yaml, 'bad.yaml');
      throw new Error('expected parseSuiteConfig to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PromptopusConfigError);
      expect((err as PromptopusConfigError).message).toMatch(pattern);
    }
  }

  it('reports an unknown provider kind with a path', () => {
    expectIssue(
      `name: D\nproviders: [{ name: p, kind: gemini, model: m }]\ncases: [{ id: c, prompt: hi, graders: [{ type: non-empty }] }]`,
      /providers\[0\]/,
    );
  });

  it('rejects unknown keys (strict)', () => {
    expectIssue(
      `name: D\nproviders: [{ name: p, kind: openai, model: m, foo: 1 }]\ncases: [{ id: c, prompt: hi, graders: [{ type: non-empty }] }]`,
      /providers\[0\].*foo/,
    );
  });

  it('flags a case with no graders and no defaults', () => {
    expectIssue(
      `name: D\nproviders: [{ name: p, kind: openai, model: m }]\ncases: [{ id: c, prompt: hi }]`,
      /cases\[0\]\.graders/,
    );
  });

  it('requires a judge model when a judge grader is used', () => {
    expectIssue(
      `name: D\nproviders: [{ name: p, kind: openai, model: m }]\ncases: [{ id: c, prompt: hi, graders: [{ type: judge-quality }] }]`,
      /judge: a judge model is required/,
    );
  });

  it('detects duplicate provider names', () => {
    expectIssue(
      `name: D\nproviders: [{ name: p, kind: openai, model: m }, { name: p, kind: anthropic, model: m2 }]\ncases: [{ id: c, prompt: hi, graders: [{ type: non-empty }] }]`,
      /duplicate provider name/,
    );
  });

  it('reports a missing file as a friendly error message', () => {
    expectIssue(`name: D`, /at least one|cases/);
  });
});
