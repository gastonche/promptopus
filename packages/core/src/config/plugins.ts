import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { GraderFactory } from '../graders/registry.js';
import type { ProviderFactory } from '../providers/registry.js';

export interface PromptopusConfig {
  providers?: Record<string, ProviderFactory>;
  graders?: Record<string, GraderFactory>;
}

export function defineConfig(config: PromptopusConfig): PromptopusConfig {
  return config;
}

const CONFIG_NAMES = ['promptopus.config.mjs', 'promptopus.config.js'];

export function findConfigFile(cwd: string = process.cwd()): string | undefined {
  for (const name of CONFIG_NAMES) {
    const candidate = resolve(cwd, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

export async function loadConfigFile(path: string): Promise<PromptopusConfig> {
  const mod: unknown = await import(pathToFileURL(path).href);
  const record = mod as Record<string, unknown>;
  const config = (record['default'] ?? mod) as PromptopusConfig;
  if (typeof config !== 'object' || config === null) {
    throw new Error(`config file ${path} must export a configuration object`);
  }
  return config;
}
