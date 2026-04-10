const ROUTES = [
  { method: 'GET', pathname: '/health', action: 'handleHealth' },
  { method: 'GET', pathname: '/api/ai/runtime', action: 'handleRuntime' },
  { method: 'GET', pathname: '/api/ai/models', action: 'handleModels' },
  { method: 'POST', pathname: '/api/ai/analyze', action: 'handleAnalyze' },
  { method: 'POST', pathname: '/api/ai/generate-prompt', action: 'handleGeneratePrompt' },
  { method: 'GET', pathname: '/api/state', action: 'handleLoadState' },
  { method: 'POST', pathname: '/api/state', action: 'handleSaveState' },
];

export async function routeAiRequest(request, response, url, controller) {
  const route = ROUTES.find((item) => item.method === request.method && item.pathname === url.pathname);
  if (!route) {
    return false;
  }

  const handler = controller[route.action];
  if (typeof handler !== 'function') {
    throw new Error(`Route handler is not configured: ${route.action}`);
  }

  await handler(request, response, url);
  return true;
}
