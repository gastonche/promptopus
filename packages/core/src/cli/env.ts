import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

interface WithLoadEnv {
  loadEnvFile?: (path?: string) => void;
}

export function loadDotEnv(cwd: string = process.cwd()): boolean {
  const path = resolve(cwd, '.env');
  if (!existsSync(path)) return false;
  const proc = process as unknown as WithLoadEnv;
  if (typeof proc.loadEnvFile !== 'function') return false;
  try {
    proc.loadEnvFile(path);
    return true;
  } catch {
    return false;
  }
}
