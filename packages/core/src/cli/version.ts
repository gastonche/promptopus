import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface PackageJson {
  version: string;
}

function resolveVersion(): string {
  for (const candidate of ['../../package.json', '../../../package.json']) {
    try {
      return (require(candidate) as PackageJson).version;
    } catch {
      // try next candidate
    }
  }
  return '0.0.0-dev';
}

export const VERSION: string = resolveVersion();
