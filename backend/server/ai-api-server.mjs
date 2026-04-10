import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAiController } from './controllers/ai-controller.mjs';
import { createStateController } from './controllers/state-controller.mjs';
import { routeAiRequest } from './routes/ai-routes.mjs';
import { notFound, sendJson, setCorsHeaders } from './utils/http-utils.mjs';

const DEFAULT_PORT = 8787;

function resolvePort() {
  const raw = process.env.AI_API_PORT || process.env.PORT;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0 && parsed < 65536) {
    return Math.floor(parsed);
  }
  return DEFAULT_PORT;
}

export function createAiApiRequestListener() {
  const controller = {
    ...createAiController(),
    ...createStateController(),
  };

  return async (request, response) => {
    try {
      if (!request.url) {
        return notFound(response);
      }

      const url = new URL(request.url, 'http://localhost');

      if (request.method === 'OPTIONS') {
        setCorsHeaders(response);
        response.statusCode = 204;
        response.end();
        return;
      }

      const handled = await routeAiRequest(request, response, url, controller);
      if (!handled) {
        return notFound(response);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error';
      return sendJson(response, 500, { error: message });
    }
  };
}

export function createAiApiServer() {
  return createServer(createAiApiRequestListener());
}

export function startAiApiServer(options = {}) {
  const port = Number.isFinite(options.port) ? Number(options.port) : resolvePort();
  const logger = typeof options.logger === 'function' ? options.logger : console.log;
  const server = createAiApiServer();

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      logger(`Project Passport (React) AI API server is running on http://localhost:${actualPort}`);
      resolve({
        server,
        port: actualPort,
      });
    });
  });
}

const isDirectRun =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  startAiApiServer().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    // eslint-disable-next-line no-console
    console.error(`Failed to start AI API server: ${message}`);
    process.exit(1);
  });
}
