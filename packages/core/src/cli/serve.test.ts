import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { serveDashboard } from './serve.js';

let dir: string;
let server: Server;
let base: string;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'pop-serve-'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>dash</title>');
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'assets', 'app.css'), 'body{}');
  const reportPath = join(dir, 'report.json');
  writeFileSync(reportPath, '{"suiteName":"x"}');

  server = serveDashboard({ reportPath, distDir: dir, port: 0, open: false });
  await new Promise((resolve) => server.once('listening', resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  base = `http://localhost:${addr.port}`;
});

afterEach(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

async function get(path: string): Promise<{ status: number; body: string; ct: string | null }> {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.text(), ct: res.headers.get('content-type') };
}

describe('serveDashboard', () => {
  it('serves index.html at /', async () => {
    const r = await get('/');
    expect(r.status).toBe(200);
    expect(r.body).toContain('dash');
    expect(r.ct).toContain('text/html');
  });

  it('serves the chosen report at /report.json', async () => {
    const r = await get('/report.json');
    expect(r.status).toBe(200);
    expect(r.body).toContain('suiteName');
    expect(r.ct).toContain('application/json');
  });

  it('serves a nested static asset with the right content-type', async () => {
    const r = await get('/assets/app.css');
    expect(r.status).toBe(200);
    expect(r.ct).toContain('text/css');
  });

  it('falls back to index.html for unknown extensionless routes (SPA)', async () => {
    const r = await get('/some/deep/route');
    expect(r.status).toBe(200);
    expect(r.body).toContain('dash');
  });

  it('404s a missing file that has an extension', async () => {
    const r = await get('/missing.css');
    expect(r.status).toBe(404);
  });
});
