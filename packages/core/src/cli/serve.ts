import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function findDashboardDist(): string | null {
  if (process.env['PROMPTOPUS_DASHBOARD_DIST']) {
    return process.env['PROMPTOPUS_DASHBOARD_DIST'];
  }
  const here = dirname(fileURLToPath(import.meta.url));

  // Bundled with the published package: <packageRoot>/dashboard (dist/cli -> ../../dashboard).
  const bundled = resolve(here, '../../dashboard');
  if (existsSync(join(bundled, 'index.html'))) return bundled;

  // Dev / monorepo: walk up to apps/dashboard/dist.
  let dir = here;
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(dir, 'apps/dashboard/dist');
    if (existsSync(join(candidate, 'index.html'))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try {
    spawn(cmd, [url], {
      stdio: 'ignore',
      detached: true,
      shell: process.platform === 'win32',
    }).unref();
  } catch {
    // best effort
  }
}

export interface ServeOptions {
  reportPath: string;
  distDir: string;
  port: number;
  open: boolean;
  onListening?: (url: string) => void;
}

export function serveDashboard(opts: ServeOptions): ReturnType<typeof createServer> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/report.json') {
      try {
        const body = readFileSync(opts.reportPath);
        res.writeHead(200, { 'content-type': CONTENT_TYPES['.json'] as string });
        res.end(body);
      } catch {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('report not found');
      }
      return;
    }

    const requested = url.pathname === '/' ? '/index.html' : url.pathname;
    let filePath = normalize(join(opts.distDir, requested));
    const rel = relative(opts.distDir, filePath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (!existsSync(filePath) && !extname(requested)) {
      filePath = join(opts.distDir, 'index.html');
    }
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(readFileSync(filePath));
  });

  server.listen(opts.port, () => {
    const url = `http://localhost:${opts.port}`;
    opts.onListening?.(url);
    if (opts.open) openBrowser(url);
  });

  return server;
}

export function resolveReportPath(path: string): string {
  return resolve(process.cwd(), path);
}
