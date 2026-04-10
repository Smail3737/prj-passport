import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAiApiRequestListener } from './ai-api-server.mjs';

const DEFAULT_PORT = 4173;

function resolveWebPort() {
  const raw = process.env.WEB_PORT || process.env.PORT;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0 && parsed < 65536) {
    return Math.floor(parsed);
  }
  return DEFAULT_PORT;
}

function resolveDistDir() {
  const configured = process.env.WEB_DIST_DIR || 'dist';
  return path.resolve(process.cwd(), configured);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.ico':
      return 'image/x-icon';
    case '.map':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function isSafePath(baseDir, targetPath) {
  const normalizedBase = path.resolve(baseDir);
  const normalizedTarget = path.resolve(targetPath);
  return (
    normalizedTarget === normalizedBase ||
    normalizedTarget.startsWith(`${normalizedBase}${path.sep}`)
  );
}

function serveFile(response, filePath) {
  response.statusCode = 200;
  response.setHeader('Content-Type', getContentType(filePath));
  createReadStream(filePath).pipe(response);
}

function createWebAppServer() {
  const distDir = resolveDistDir();
  const aiApiListener = createAiApiRequestListener();

  return createServer(async (request, response) => {
    try {
      if (!request.url) {
        response.statusCode = 404;
        response.end('Not Found');
        return;
      }

      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === '/health' || pathname.startsWith('/api/')) {
        return aiApiListener(request, response);
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.statusCode = 405;
        response.end('Method Not Allowed');
        return;
      }

      if (!existsSync(distDir)) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end(`Build output not found at "${distDir}". Run "npm run web:build" first.`);
        return;
      }

      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const requestedFilePath = path.join(distDir, relativePath);
      const fallbackIndexPath = path.join(distDir, 'index.html');

      if (!isSafePath(distDir, requestedFilePath)) {
        response.statusCode = 400;
        response.end('Bad Request');
        return;
      }

      if (existsSync(requestedFilePath) && statSync(requestedFilePath).isFile()) {
        return serveFile(response, requestedFilePath);
      }

      if (existsSync(fallbackIndexPath) && statSync(fallbackIndexPath).isFile()) {
        return serveFile(response, fallbackIndexPath);
      }

      response.statusCode = 404;
      response.end('Not Found');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error';
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(`Server error: ${message}`);
    }
  });
}

export function startWebAppServer(options = {}) {
  const port = Number.isFinite(options.port) ? Number(options.port) : resolveWebPort();
  const logger = typeof options.logger === 'function' ? options.logger : console.log;
  const server = createWebAppServer();

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      logger(`Project Passport (React) web server is running on http://localhost:${actualPort}`);
      resolve({ server, port: actualPort });
    });
  });
}

const isDirectRun =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  startWebAppServer().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    // eslint-disable-next-line no-console
    console.error(`Failed to start web app server: ${message}`);
    process.exit(1);
  });
}
