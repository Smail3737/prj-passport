import { STORAGE_KEY } from '../config';
import {
  loadPersistedStateFromIndexedDb,
  savePersistedStateToIndexedDb,
} from './indexeddb-state';
import type {
  AiModelListResponse,
  AiRuntimeInfo,
  LlmAnalyzeResponse,
  LlmAnalyzerFieldDefinition,
  LlmGeneratePromptResponse,
  PersistedPassportState,
  PromptTemplateId,
} from '../types';

interface AnalyzeDescriptionRequest {
  description: string;
  currentFields: Record<string, string>;
  fields: LlmAnalyzerFieldDefinition[];
  model?: string;
}

interface GeneratePromptRequest {
  basePrompt: string;
  templateId: PromptTemplateId;
  projectName: string;
  passportEntity?: string;
  passportFields?: Record<string, string>;
  fieldContext?: Array<{ id: string; label: string; value: string }>;
  mainStack: string;
  platform: string;
  hostingDeployment: string;
  model?: string;
}

interface RemoteCompletionOptions {
  jsonMode?: boolean;
  temperature?: number;
}

interface RemoteCompletionResult {
  content: string;
  model: string;
  provider: string;
}

const DEFAULT_REMOTE_AI_BASE_URL = 'https://text.pollinations.ai';
const FRONTEND_REMOTE_MODEL = 'auto';

function buildApiUrl(pathname: string): string {
  const baseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/+$/, '');
  return baseUrl ? `${baseUrl}${pathname}` : pathname;
}

function resolveRemoteAiBaseUrl(): string {
  const raw = (import.meta.env.VITE_REMOTE_AI_BASE_URL as string | undefined) || DEFAULT_REMOTE_AI_BASE_URL;
  return raw.trim().replace(/\/+$/, '') || DEFAULT_REMOTE_AI_BASE_URL;
}

async function requestJson<TResponse>(pathname: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(buildApiUrl(pathname), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || 'Unknown error'}`);
  }

  return (await response.json()) as TResponse;
}

function normalizePersistedState(raw: unknown): PersistedPassportState {
  if (!raw || typeof raw !== 'object') {
    return {
      projects: [],
      selectedProjectId: null,
    };
  }

  const record = raw as PersistedPassportState;
  return {
    projects: Array.isArray(record.projects) ? record.projects : [],
    selectedProjectId: typeof record.selectedProjectId === 'string' ? record.selectedProjectId : null,
  };
}

function readPersistedStateFromLocalStorage(): PersistedPassportState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        projects: [],
        selectedProjectId: null,
      };
    }

    const parsed = JSON.parse(raw) as unknown;
    return normalizePersistedState(parsed);
  } catch {
    return {
      projects: [],
      selectedProjectId: null,
    };
  }
}

function savePersistedStateToLocalStorage(payload: PersistedPassportState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist state to localStorage (possibly quota exceeded):', error);
  }
}

function openTextFileInBrowser(): Promise<{ filePath: string; content: string } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json,.log,.csv,text/*,application/json';
    let settled = false;

    const finalize = (value: { filePath: string; content: string } | null, isError = false): void => {
      if (settled) {
        return;
      }

      settled = true;
      window.removeEventListener('focus', onWindowFocus);

      if (isError) {
        reject(new Error('Failed to read selected file'));
        return;
      }

      resolve(value);
    };

    const onWindowFocus = () => {
      window.setTimeout(() => {
        const file = input.files?.[0];
        if (!file) {
          finalize(null);
        }
      }, 250);
    };

    window.addEventListener('focus', onWindowFocus, { once: true });

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        finalize(null);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        finalize(null, true);
      };
      reader.onload = () => {
        finalize({
          filePath: file.name,
          content: typeof reader.result === 'string' ? reader.result : '',
        });
      };
      reader.readAsText(file);
    };

    input.click();
  });
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new Error('LLM returned empty content');
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('LLM did not return a valid JSON object');
    }

    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function normalizeForMatch(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseConfidence(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number(raw.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function descriptionContainsSnippet(descriptionNormalized: string, snippet: string): boolean {
  const normalizedSnippet = normalizeForMatch(snippet);
  if (!normalizedSnippet) {
    return false;
  }

  return descriptionNormalized.includes(normalizedSnippet);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function matchSelectOption(options: string[], rawValue: string): string | null {
  const exact = options.find((option) => option.toLowerCase() === rawValue.toLowerCase());
  if (exact) {
    return exact;
  }

  const normalizedValue = normalizeForMatch(rawValue);
  if (!normalizedValue) {
    return null;
  }

  const normalizedExact = options.find((option) => normalizeForMatch(option) === normalizedValue);
  if (normalizedExact) {
    return normalizedExact;
  }

  const partialMatches = options.filter((option) => {
    const normalizedOption = normalizeForMatch(option);
    return (
      normalizedOption.length > 0 &&
      (normalizedValue.includes(normalizedOption) || normalizedOption.includes(normalizedValue))
    );
  });

  if (partialMatches.length === 1) {
    return partialMatches[0];
  }

  return null;
}

function toRawUpdateEntries(rawUpdates: unknown): Array<{ fieldId: string; value: string; confidence: number; evidence: string }> {
  if (Array.isArray(rawUpdates)) {
    return rawUpdates
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item as Record<string, unknown>;
        const fieldId = typeof record.fieldId === 'string' ? record.fieldId.trim() : '';
        const value = typeof record.value === 'string' ? record.value.trim() : '';
        const confidence = parseConfidence(record.confidence);
        const evidence =
          typeof record.evidence === 'string'
            ? record.evidence.trim()
            : typeof record.source === 'string'
              ? record.source.trim()
              : '';

        if (!fieldId || !value) {
          return null;
        }

        return {
          fieldId,
          value,
          confidence,
          evidence: evidence || value,
        };
      })
      .filter((item): item is { fieldId: string; value: string; confidence: number; evidence: string } => Boolean(item));
  }

  if (rawUpdates && typeof rawUpdates === 'object') {
    return Object.entries(rawUpdates as Record<string, unknown>)
      .map(([fieldId, value]) => {
        if (typeof value !== 'string') {
          return null;
        }

        const nextFieldId = fieldId.trim();
        const nextValue = value.trim();
        if (!nextFieldId || !nextValue) {
          return null;
        }

        return {
          fieldId: nextFieldId,
          value: nextValue,
          confidence: 1,
          evidence: nextValue,
        };
      })
      .filter((item): item is { fieldId: string; value: string; confidence: number; evidence: string } => Boolean(item));
  }

  return [];
}

function sanitizeLlmUpdates(
  rawUpdates: unknown,
  fieldDefinitions: LlmAnalyzerFieldDefinition[],
  description: string
): Record<string, string> {
  const updates: Record<string, string> = {};
  const fieldMap = new Map(fieldDefinitions.map((field) => [field.id, field]));
  const entries = toRawUpdateEntries(rawUpdates);
  const normalizedDescription = normalizeForMatch(description);

  entries.forEach((entry) => {
    const field = fieldMap.get(entry.fieldId);
    if (!field) {
      return;
    }

    if (entry.confidence < 1) {
      return;
    }

    if (!descriptionContainsSnippet(normalizedDescription, entry.evidence)) {
      return;
    }

    if (field.type === 'select' && Array.isArray(field.options) && field.options.length > 0) {
      const matched = matchSelectOption(field.options, entry.value);
      if (!matched) {
        return;
      }
      updates[field.id] = matched;
      return;
    }

    if (field.type === 'url' && !isValidHttpUrl(entry.value)) {
      return;
    }

    if (field.type === 'date' && !isIsoDate(entry.value)) {
      return;
    }

    updates[field.id] = entry.value;
  });

  return updates;
}

function getLastUserMessageContent(messages: Array<{ role: string; content: string }>): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (!item) {
      continue;
    }

    if (item.role !== 'user') {
      continue;
    }

    const content = typeof item.content === 'string' ? item.content.trim() : '';
    if (content) {
      return content;
    }
  }

  return '';
}

function buildRemoteAiFallbackContent(
  options: RemoteCompletionOptions,
  messages: Array<{ role: string; content: string }>
): string {
  if (options.jsonMode) {
    return JSON.stringify({ updates: [] });
  }

  const userContent = getLastUserMessageContent(messages);
  if (!userContent) {
    return 'Unable to generate AI response right now.';
  }

  try {
    const parsed = JSON.parse(userContent) as Record<string, unknown>;
    const basePrompt = typeof parsed.basePrompt === 'string' ? parsed.basePrompt.trim() : '';
    if (basePrompt) {
      return basePrompt;
    }
  } catch {
    // Keep raw text fallback.
  }

  return userContent.slice(0, 4000);
}

async function requestRemoteAiCompletion(
  messages: Array<{ role: string; content: string }>,
  options: RemoteCompletionOptions
): Promise<RemoteCompletionResult> {
  const remoteBaseUrl = resolveRemoteAiBaseUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, 45000);

  try {
    const response = await fetch(`${remoteBaseUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
        jsonMode: options.jsonMode ? true : undefined,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 429 || response.status >= 500) {
        return {
          content: buildRemoteAiFallbackContent(options, messages),
          model: FRONTEND_REMOTE_MODEL,
          provider: 'pollinations-fallback',
        };
      }

      throw new Error(`Remote AI request failed (${response.status}): ${errorText || 'Unknown error'}`);
    }

    const content = (await response.text()).trim();
    if (!content) {
      throw new Error('Remote AI response did not contain message content');
    }

    return {
      content,
      model: FRONTEND_REMOTE_MODEL,
      provider: 'pollinations',
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Remote AI request timed out');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function analyzeDescriptionWithRemote(payload: AnalyzeDescriptionRequest): Promise<LlmAnalyzeResponse> {
  const fieldContext = payload.fields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    options: field.options || [],
  }));

  const completion = await requestRemoteAiCompletion(
    [
      {
        role: 'system',
        content:
          'You extract structured project passport fields from free text. Return only JSON with key "updates". ' +
          'The "updates" value must be an array of objects: [{"fieldId":"...", "value":"...", "confidence":1, "evidence":"exact quote from description"}]. ' +
          'Include only facts that are explicitly stated in the description with confidence exactly 1. ' +
          'If a value is uncertain, omit it. Use only provided field ids. ' +
          'For select fields, pick one value from allowed options. Do not add explanations.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          description: payload.description,
          currentFields: payload.currentFields,
          fields: fieldContext,
        }),
      },
    ],
    {
      jsonMode: true,
      temperature: 0.1,
    }
  );

  const parsed = parseJsonObject(completion.content);
  const rawUpdates = (parsed.updates ?? parsed) as unknown;
  const updates = sanitizeLlmUpdates(rawUpdates, payload.fields, payload.description);

  return {
    updates,
    model: `${completion.provider}/${completion.model}`,
  };
}

async function generatePromptWithRemote(payload: GeneratePromptRequest): Promise<LlmGeneratePromptResponse> {
  const completion = await requestRemoteAiCompletion(
    [
      {
        role: 'system',
        content:
          'You are a senior prompt engineer for software implementation tasks. ' +
          'Rewrite the provided base prompt into a concise, structured, execution-ready prompt. ' +
          'Preserve critical facts and constraints. Return only final prompt text without explanations.',
      },
      {
        role: 'user',
        content: JSON.stringify(payload),
      },
    ],
    {
      jsonMode: false,
      temperature: 0.2,
    }
  );

  const prompt = completion.content.trim() || payload.basePrompt.trim();
  return {
    prompt,
    model: `${completion.provider}/${completion.model}`,
  };
}

export const runtimeApi = {
  setTitle(title: string): void {
    document.title = title;
  },

  async openTextFile(): Promise<{ filePath: string; content: string } | null> {
    return openTextFileInBrowser();
  },

  async loadPassportState(): Promise<PersistedPassportState> {
    try {
      const backendState = await requestJson<PersistedPassportState>('/api/state', {
        method: 'GET',
      });
      const normalized = normalizePersistedState(backendState);
      savePersistedStateToLocalStorage(normalized);
      await savePersistedStateToIndexedDb(normalized);
      return normalized;
    } catch {
      const indexedState = await loadPersistedStateFromIndexedDb();
      if (indexedState) {
        const normalized = normalizePersistedState(indexedState);
        savePersistedStateToLocalStorage(normalized);
        return normalized;
      }

      return readPersistedStateFromLocalStorage();
    }
  },

  async savePassportState(payload: PersistedPassportState): Promise<{ ok: boolean }> {
    const normalized = normalizePersistedState(payload);

    savePersistedStateToLocalStorage(normalized);
    await savePersistedStateToIndexedDb(normalized);

    try {
      return await requestJson<{ ok: boolean }>('/api/state', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    } catch {
      return { ok: false };
    }
  },

  async getAiRuntimeInfo(payload?: { model?: string }): Promise<AiRuntimeInfo> {
    const params = payload?.model ? `?model=${encodeURIComponent(payload.model)}` : '';

    try {
      return await requestJson<AiRuntimeInfo>(`/api/ai/runtime${params}`, {
        method: 'GET',
      });
    } catch {
      const remoteBaseUrl = resolveRemoteAiBaseUrl();
      return {
        provider: 'pollinations',
        model: FRONTEND_REMOTE_MODEL,
        endpoint: `${remoteBaseUrl}/`,
      };
    }
  },

  async listAiModels(): Promise<AiModelListResponse> {
    try {
      return await requestJson<AiModelListResponse>('/api/ai/models', {
        method: 'GET',
      });
    } catch {
      return {
        provider: 'pollinations',
        models: [FRONTEND_REMOTE_MODEL],
      };
    }
  },

  async analyzeDescriptionWithLLM(payload: AnalyzeDescriptionRequest): Promise<LlmAnalyzeResponse> {
    try {
      return await requestJson<LlmAnalyzeResponse>('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return analyzeDescriptionWithRemote(payload);
    }
  },

  async generateAiPromptWithLLM(payload: GeneratePromptRequest): Promise<LlmGeneratePromptResponse> {
    try {
      return await requestJson<LlmGeneratePromptResponse>('/api/ai/generate-prompt', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return generatePromptWithRemote(payload);
    }
  },
};
