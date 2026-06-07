import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../apps/dashboard/dist');
const dest = resolve(here, '../dashboard');

if (!existsSync(src)) {
  console.error(
    'Dashboard build not found at apps/dashboard/dist.\n' +
      'Build it first:  npm run build --workspace @promptopus/dashboard',
  );
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log('Bundled dashboard ->', dest);
