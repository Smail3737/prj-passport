import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { startAiApiServer } from '../ai-api-server.mjs';

function createMockRemoteAiServer({ responses }) {
  const queue = Array.isArray(responses) ? [...responses] : [];
  const requests = [];

  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://localhost');

    if (request.method === 'POST' && url.pathname === '/') {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(chunk);
      }

      const rawBody = Buffer.concat(chunks).toString('utf8');
      const parsedBody = rawBody ? JSON.parse(rawBody) : {};
      requests.push(parsedBody);

      const nextResponse = queue.length > 0 ? queue.shift() : null;
      if (!nextResponse) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end('No queued response for remote AI root endpoint');
        return;
      }

      const statusCode =
        typeof nextResponse.status === 'number' && Number.isFinite(nextResponse.status)
          ? Math.floor(nextResponse.status)
          : 200;
      const body = typeof nextResponse.body === 'string' ? nextResponse.body : '';

      response.statusCode = statusCode;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(body);
      return;
    }

    response.statusCode = 404;
    response.end('Not Found');
  });

  return { server, requests };
}

async function listenEphemeral(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve ephemeral port');
  }
  return address.port;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

test('AI API endpoints preserve contracts for runtime/models/analyze/generate', async () => {
  const mockRemoteAi = createMockRemoteAiServer({
    responses: [
      {
        status: 200,
        body: JSON.stringify({
          updates: [
            { fieldId: 'projectName', value: 'Atlas CRM', confidence: 1, evidence: 'Atlas CRM' },
            { fieldId: 'mainStack', value: 'React', confidence: 1, evidence: 'React' },
            { fieldId: 'platform', value: 'Mobile', confidence: 1, evidence: 'Mobile' },
          ],
        }),
      },
      {
        status: 200,
        body: 'Executive Summary\n- Keep API contract parity.\n- Keep UI workflow unchanged.',
      },
    ],
  });

  const mockPort = await listenEphemeral(mockRemoteAi.server);

  const previousEnv = {
    REMOTE_AI_BASE_URL: process.env.REMOTE_AI_BASE_URL,
    AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS,
  };

  process.env.REMOTE_AI_BASE_URL = `http://127.0.0.1:${mockPort}`;
  process.env.AI_REQUEST_TIMEOUT_MS = '12000';

  let apiServer = null;

  try {
    const started = await startAiApiServer({
      port: 0,
      logger: () => {},
    });
    apiServer = started.server;
    const apiBase = `http://127.0.0.1:${started.port}`;

    const health = await fetch(`${apiBase}/health`).then((response) => response.json());
    assert.equal(health.ok, true);

    const runtime = await fetch(`${apiBase}/api/ai/runtime`).then((response) => response.json());
    assert.equal(runtime.provider, 'pollinations');
    assert.equal(runtime.model, 'auto');
    assert.equal(runtime.endpoint, `http://127.0.0.1:${mockPort}/`);

    const models = await fetch(`${apiBase}/api/ai/models`).then((response) => response.json());
    assert.equal(models.provider, 'pollinations');
    assert.deepEqual(models.models, ['auto']);

    const analyzeResult = await fetch(`${apiBase}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Project name: Atlas CRM. Stack: React. Platform: Web.',
        currentFields: {},
        fields: [
          { id: 'projectName', label: 'Project Name', type: 'text' },
          { id: 'mainStack', label: 'Main Stack', type: 'select', options: ['React', 'Next.js'] },
          { id: 'platform', label: 'Platform', type: 'select', options: ['Web', 'Desktop'] },
        ],
      }),
    }).then((response) => response.json());
    assert.equal(analyzeResult.model, 'pollinations/auto');
    assert.deepEqual(analyzeResult.updates, {
      projectName: 'Atlas CRM',
      mainStack: 'React',
    });

    const generated = await fetch(`${apiBase}/api/ai/generate-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        basePrompt: 'Prepare proposal output.',
        templateId: 'lead-proposal',
        projectName: 'Atlas CRM',
        passportEntity: 'Lead',
        passportFields: {
          client: 'Atlas',
        },
        fieldContext: [{ id: 'leadSummary', label: 'Request Summary', value: 'Need migration parity.' }],
        mainStack: 'React',
        platform: 'Web',
        hostingDeployment: 'Vercel',
      }),
    }).then((response) => response.json());

    assert.equal(generated.model, 'pollinations/auto');
    assert.match(
      generated.prompt,
      /^Hi Atlas! We have carefully reviewed your request and are ready to offer the following terms\./
    );
    assert.equal(generated.prompt.includes('Executive Summary'), false);

    assert.ok(mockRemoteAi.requests.length >= 2);
  } finally {
    await closeServer(mockRemoteAi.server);

    if (apiServer) {
      await closeServer(apiServer);
    }

    process.env.REMOTE_AI_BASE_URL = previousEnv.REMOTE_AI_BASE_URL;
    process.env.AI_REQUEST_TIMEOUT_MS = previousEnv.AI_REQUEST_TIMEOUT_MS;
  }
});
