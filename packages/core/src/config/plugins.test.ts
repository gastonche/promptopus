import { describe, expect, it } from 'vitest';

import type { GenerateResult, Provider } from '../domain/provider.js';
import { createGraderRegistry } from '../graders/registry.js';
import { createProviderRegistry } from '../providers/registry.js';
import { runSuite } from '../runner/runner.js';
import { parseSuiteConfig, resolveSuite } from './load.js';
import { defineConfig } from './plugins.js';

const YAML = `
name: Plugin suite
providers:
  - { name: shout, kind: shouty, model: x }
cases:
  - id: a
    prompt: "hello world"
    graders:
      - { type: non-empty }
      - { type: word-count, max: 1 }
`;

describe('extensible registries', () => {
  it('runs with a custom provider kind and custom grader type', async () => {
    const providerRegistry = createProviderRegistry().register('shouty', (spec) => {
      const p: Provider = {
        name: spec.name,
        model: spec.model ?? 'x',
        generate(prompt): Promise<GenerateResult> {
          return Promise.resolve({
            text: prompt.toUpperCase(),
            tokensIn: 1,
            tokensOut: 1,
            latencyMs: 1,
            costUsd: 0,
          });
        },
      };
      return p;
    });

    const graderRegistry = createGraderRegistry().register('word-count', (spec) => {
      const max = Number(spec['max']);
      return {
        id: `word-count(${max})`,
        family: 'deterministic',
        grade({ output }) {
          const n = output.text.trim().split(/\s+/).filter(Boolean).length;
          return {
            graderId: `word-count(${max})`,
            family: 'deterministic',
            score: n <= max ? 1 : 0,
            passed: n <= max,
            detail: `${n}/${max} words`,
          };
        },
      };
    });

    const suite = resolveSuite(parseSuiteConfig(YAML));
    const providers = suite.providers.map((s) => providerRegistry.create(s));
    const report = await runSuite(suite, {
      providers,
      createGrader: (spec, deps) => graderRegistry.create(spec, deps),
      now: () => '2026-01-01T00:00:00.000Z',
    });

    expect(report.results[0]?.output?.text).toBe('HELLO WORLD');
    const wc = report.results[0]?.graderResults.find((g) => g.graderId.startsWith('word-count'));
    expect(wc?.passed).toBe(false); // 2 words > max 1
  });

  it('throws a clear error for an unregistered kind/type', () => {
    expect(() => createProviderRegistry().create({ kind: 'nope', name: 'n' })).toThrow(
      /unknown provider kind "nope"/,
    );
    expect(() => createGraderRegistry().create({ type: 'nope' })).toThrow(
      /unknown grader type "nope"/,
    );
  });

  it('defineConfig is an identity helper', () => {
    const cfg = defineConfig({ providers: {}, graders: {} });
    expect(cfg).toEqual({ providers: {}, graders: {} });
  });
});
