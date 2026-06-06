import { describe, expect, it } from 'vitest';

import { parseSuiteConfig, resolveSuite } from '../config/load.js';
import type { GenerateResult, Provider } from '../domain/provider.js';
import { MockProvider } from '../providers/mock.js';
import { runSuite } from './runner.js';

const YAML = `
name: T
providers:
  - { name: mock, kind: mock, model: mock }
cases:
  - id: a
    prompt: "hello Paris"
    graders:
      - { type: non-empty }
      - { type: contains, value: Paris }
  - id: b
    prompt: "short"
    graders:
      - { type: max-length, chars: 2 }
`;

function suite() {
  return resolveSuite(parseSuiteConfig(YAML));
}

describe('runSuite', () => {
  it('runs the case × provider matrix and aggregates a report', async () => {
    const provider = new MockProvider({ name: 'mock', model: 'mock' });
    const report = await runSuite(suite(), {
      providers: [provider],
      now: () => '2026-01-01T00:00:00.000Z',
    });

    expect(report.results).toHaveLength(2);
    expect(report.providers).toHaveLength(1);
    const p = report.providers[0]!;
    // case a: 2/2 pass, case b: 0/1 (echo "short" is 5 > 2) -> 2/3
    expect(p.passRate).toBeCloseTo(2 / 3, 5);
    expect(p.errorCount).toBe(0);
    expect(report.generatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('captures provider errors as error results without crashing', async () => {
    const boom: Provider = {
      name: 'mock',
      model: 'mock',
      generate(): Promise<GenerateResult> {
        return Promise.reject(new Error('kaboom'));
      },
    };
    const report = await runSuite(suite(), { providers: [boom] });
    expect(report.results.every((r) => r.status === 'error')).toBe(true);
    expect(report.providers[0]!.errorCount).toBe(2);
    expect(report.results[0]!.error?.message).toBe('kaboom');
  });

  it('emits progress events', async () => {
    const events: string[] = [];
    await runSuite(suite(), {
      providers: [new MockProvider({ name: 'mock', model: 'mock' })],
      onEvent: (e) => events.push(e.type),
    });
    expect(events[0]).toBe('start');
    expect(events.at(-1)).toBe('done');
    expect(events.filter((e) => e === 'cell')).toHaveLength(2);
  });
});
