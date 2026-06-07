import { errMessage } from '../util.js';
import { readFileSync } from 'node:fs';
import { parse as parseYaml, YAMLParseError } from 'yaml';

import type { EvalSuite, TestCase } from '../domain/testcase.js';
import { interpolate, TemplateError } from '../templating.js';
import { formatPath, fromZodError, PromptopusConfigError } from './errors.js';
import {
  BUILTIN_GRADER_TYPES,
  BUILTIN_PROVIDER_KINDS,
  BuiltinGraderSpecSchema,
  BuiltinProviderSpecSchema,
  SuiteConfigSchema,
  type SuiteConfig,
} from './schema.js';

export function loadSuiteConfig(path: string): SuiteConfig {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new PromptopusConfigError(`Suite file not found: ${path}`);
    }
    throw new PromptopusConfigError(`Could not read suite file ${path}: ${errMessage(err)}`);
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
    throw new PromptopusConfigError(`Could not parse YAML in ${source}: ${errMessage(err)}`);
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
  return validateBuiltins(result.data, source);
}

function validateBuiltins(config: SuiteConfig, source: string): SuiteConfig {
  const issues: string[] = [];

  const checkProvider = (spec: { kind: string }, path: (string | number)[]): unknown => {
    if (!(BUILTIN_PROVIDER_KINDS as readonly string[]).includes(spec.kind)) return spec;
    const parsed = BuiltinProviderSpecSchema.safeParse(spec);
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      issues.push(`${formatPath([...path, ...issue.path])}: ${issue.message}`);
    }
    return spec;
  };

  const checkGrader = (spec: { type: string }, path: (string | number)[]): unknown => {
    if (!(BUILTIN_GRADER_TYPES as readonly string[]).includes(spec.type)) return spec;
    const parsed = BuiltinGraderSpecSchema.safeParse(spec);
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      issues.push(`${formatPath([...path, ...issue.path])}: ${issue.message}`);
    }
    return spec;
  };

  const providers = config.providers.map((p, i) => checkProvider(p, ['providers', i]));
  const defaultsGraders = config.defaults?.graders?.map((g, i) =>
    checkGrader(g, ['defaults', 'graders', i]),
  );
  const cases = config.cases.map((c, ci) => ({
    ...c,
    graders: c.graders?.map((g, gi) => checkGrader(g, ['cases', ci, 'graders', gi])),
  }));

  if (issues.length > 0) {
    issues.sort((a, b) => a.localeCompare(b));
    const message =
      `Invalid suite config (${source}) — ${issues.length} issue${issues.length === 1 ? '' : 's'}:\n` +
      issues.map((line) => `  • ${line}`).join('\n');
    throw new PromptopusConfigError(message, issues);
  }

  return {
    ...config,
    providers,
    defaults: config.defaults ? { ...config.defaults, graders: defaultsGraders } : config.defaults,
    cases,
  } as SuiteConfig;
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

  const suite: EvalSuite = {
    name: config.name,
    providers: config.providers as EvalSuite['providers'],
    cases,
  };
  if (config.description !== undefined) suite.description = config.description;
  if (config.judge !== undefined) suite.judge = config.judge;
  if (config.defaults !== undefined) suite.defaults = config.defaults;
  return suite;
}

export function loadSuite(path: string): EvalSuite {
  return resolveSuite(loadSuiteConfig(path));
}
