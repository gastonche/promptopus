import { readFileSync } from 'node:fs';
import { parse as parseYaml, YAMLParseError } from 'yaml';

import type { EvalSuite, TestCase } from '../domain/testcase.js';
import { interpolate, TemplateError } from '../templating.js';
import { fromZodError, PromptopusConfigError } from './errors.js';
import { SuiteConfigSchema, type SuiteConfig } from './schema.js';

export function loadSuiteConfig(path: string): SuiteConfig {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new PromptopusConfigError(`Suite file not found: ${path}`);
    }
    throw new PromptopusConfigError(`Could not read suite file ${path}: ${(err as Error).message}`);
  }
  return parseSuiteConfig(raw, path);
}

export function parseSuiteConfig(yamlText: string, source = '<inline>'): SuiteConfig {
  let data: unknown;
  try {
    data = parseYaml(yamlText);
  } catch (err) {
    if (err instanceof YAMLParseError) {
      throw new PromptopusConfigError(`YAML syntax error in ${source}: ${err.message}`);
    }
    throw new PromptopusConfigError(`Could not parse YAML in ${source}: ${(err as Error).message}`);
  }

  if (data === null || typeof data !== 'object') {
    throw new PromptopusConfigError(
      `Suite config in ${source} must be a YAML mapping (got ${data === null ? 'empty file' : typeof data}).`,
    );
  }

  const result = SuiteConfigSchema.safeParse(data);
  if (!result.success) {
    throw fromZodError(result.error, source);
  }
  return result.data;
}

export function resolveSuite(config: SuiteConfig): EvalSuite {
  const cases: TestCase[] = config.cases.map((c) => {
    const graders = c.graders ?? config.defaults?.graders ?? [];
    const vars: Record<string, string | number | boolean> = {};
    if (c.source !== undefined) vars['source'] = c.source;
    if (c.reference !== undefined) vars['reference'] = c.reference;
    Object.assign(vars, c.vars ?? {});
    let prompt: string;
    let systemPrompt: string | undefined;
    try {
      prompt = interpolate(c.prompt, vars);
      const rawSystem = c.systemPrompt ?? config.defaults?.systemPrompt;
      systemPrompt = rawSystem === undefined ? undefined : interpolate(rawSystem, vars);
    } catch (err) {
      if (err instanceof TemplateError) {
        throw new PromptopusConfigError(`Case "${c.id}": ${err.message}`);
      }
      throw err;
    }

    const resolved: TestCase = { id: c.id, prompt, graders };
    if (c.description !== undefined) resolved.description = c.description;
    if (c.vars !== undefined) resolved.vars = c.vars;
    if (systemPrompt !== undefined) resolved.systemPrompt = systemPrompt;
    if (c.reference !== undefined) resolved.reference = c.reference;
    if (c.source !== undefined) resolved.source = c.source;
    return resolved;
  });

  const suite: EvalSuite = { name: config.name, providers: config.providers, cases };
  if (config.description !== undefined) suite.description = config.description;
  if (config.judge !== undefined) suite.judge = config.judge;
  if (config.defaults !== undefined) suite.defaults = config.defaults;
  return suite;
}

export function loadSuite(path: string): EvalSuite {
  return resolveSuite(loadSuiteConfig(path));
}
