import { readRequestJson, sendJson } from '../utils/http-utils.mjs';
import { loadPassportStateFromDb, savePassportStateToDb } from '../services/state-service.mjs';

function normalizeIncomingState(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload is required');
  }

  const projects = Array.isArray(payload.projects) ? payload.projects : [];
  const selectedProjectId =
    typeof payload.selectedProjectId === 'string' && payload.selectedProjectId.trim().length > 0
      ? payload.selectedProjectId.trim()
      : null;

  return {
    projects,
    selectedProjectId,
  };
}

export function createStateController() {
  return {
    async handleLoadState(_request, response) {
      const state = await loadPassportStateFromDb();
      return sendJson(response, 200, state);
    },

    async handleSaveState(request, response) {
      const payload = await readRequestJson(request);
      const normalized = normalizeIncomingState(payload);
      const result = await savePassportStateToDb(normalized);
      return sendJson(response, 200, result);
    },
  };
}
