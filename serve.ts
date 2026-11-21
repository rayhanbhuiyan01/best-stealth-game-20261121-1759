// Nightshade — Shadow Courier: a tiny static file server for local play.
// Serves game/ at the root so game/index.html opens at http://localhost:PORT/
// Usage: node serve.ts --port 8123

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function portFromArgs() {
  const args = process.argv.slice(2);
  const at = args.indexOf('--port');
  if (at >= 0 && args[at + 1]) {
    const n = Number(args[at + 1]);
    if (Number.isSafeInteger(n) && n > 0 && n < 65536) return n;
  }
  return 8080;
}

const port = portFromArgs();
const gameDir = join(process.cwd(), 'game');

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const file = normalize(join(gameDir, path));
    if (!file.startsWith(gameDir + sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const bytes = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Nightshade serves game/ at http://localhost:${port}/`);
});
