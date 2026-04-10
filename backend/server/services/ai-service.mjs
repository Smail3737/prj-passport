const DEFAULT_REMOTE_AI_BASE_URL = 'https://text.pollinations.ai';
const REMOTE_AI_MODEL = 'auto';

function resolveRemoteAiBaseUrl() {
  const raw =
    typeof process.env.REMOTE_AI_BASE_URL === 'string' && process.env.REMOTE_AI_BASE_URL.trim().length > 0
      ? process.env.REMOTE_AI_BASE_URL.trim()
      : DEFAULT_REMOTE_AI_BASE_URL;
  return raw.replace(/\/+$/, '');
}

function getLastUserMessageContent(messages) {
  if (!Array.isArray(messages)) {
    return '';
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (!item || typeof item !== 'object') {
      continue;
    }

    const role = typeof item.role === 'string' ? item.role.trim().toLowerCase() : '';
    if (role !== 'user') {
      continue;
    }

    const content = typeof item.content === 'string' ? item.content.trim() : '';
    if (content) {
      return content;
    }
  }

  return '';
}

function buildRemoteAiFallbackContent(payload) {
  if (payload?.jsonMode) {
    return JSON.stringify({ updates: [] });
  }

  const userContent = getLastUserMessageContent(payload?.messages);
  if (!userContent) {
    return 'Unable to generate AI response right now.';
  }

  try {
    const parsed = JSON.parse(userContent);
    if (parsed && typeof parsed === 'object') {
      const record = parsed;
      if (typeof record.basePrompt === 'string' && record.basePrompt.trim().length > 0) {
        return record.basePrompt.trim();
      }
    }
  } catch {
    // Keep raw text fallback.
  }

  return userContent.slice(0, 4000);
}

function resolveAiRequestTimeoutMs() {
  const fallback = 35000;
  const raw = process.env.AI_REQUEST_TIMEOUT_MS;
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 3000) {
    return fallback;
  }

  return Math.floor(parsed);
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI request timed out after ${timeoutMs} ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJsonObject(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new Error('LLM returned empty content');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('LLM did not return a valid JSON object');
    }

    return JSON.parse(match[0]);
  }
}

function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseConfidence(raw) {
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

function descriptionContainsSnippet(descriptionNormalized, snippet) {
  const normalizedSnippet = normalizeForMatch(snippet);
  if (!normalizedSnippet) {
    return false;
  }

  return descriptionNormalized.includes(normalizedSnippet);
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function matchSelectOption(options, rawValue) {
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

function toRawUpdateEntries(rawUpdates) {
  if (Array.isArray(rawUpdates)) {
    return rawUpdates
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item;
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
      .filter(Boolean);
  }

  if (rawUpdates && typeof rawUpdates === 'object') {
    return Object.entries(rawUpdates)
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
      .filter(Boolean);
  }

  return [];
}

function sanitizeLlmUpdates(rawUpdates, fieldDefinitions, description) {
  const updates = {};
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

async function requestChatCompletion(payload) {
  const timeoutMs =
    typeof payload.timeoutMs === 'number' && Number.isFinite(payload.timeoutMs) && payload.timeoutMs >= 3000
      ? Math.floor(payload.timeoutMs)
      : resolveAiRequestTimeoutMs();
  const remoteBaseUrl = resolveRemoteAiBaseUrl();
  let response;

  try {
    response = await fetchWithTimeout(
      `${remoteBaseUrl}/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temperature: payload.temperature,
          jsonMode: payload.jsonMode ? true : undefined,
          messages: payload.messages,
        }),
      },
      timeoutMs
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      throw new Error(`Remote AI request timed out after ${timeoutMs} ms`);
    }

    throw new Error('Remote AI request failed. Check REMOTE_AI_BASE_URL.');
  }

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 429 || response.status >= 500) {
      return {
        content: buildRemoteAiFallbackContent(payload),
        model: REMOTE_AI_MODEL,
        provider: 'pollinations-fallback',
      };
    }

    throw new Error(`Remote AI request failed with ${response.status}: ${errorText}`);
  }

  const content = (await response.text()).trim();
  if (!content) {
    throw new Error('Remote AI response did not contain message content');
  }

  return {
    content,
    model: REMOTE_AI_MODEL,
    provider: 'pollinations',
  };
}

async function requestLlmAnalysis(payload) {
  const fieldContext = payload.fields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    options: field.options || [],
  }));

  const completion = await requestChatCompletion({
    temperature: 0.1,
    jsonMode: true,
    messages: [
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
  });

  const parsed = parseJsonObject(completion.content);
  const rawUpdates = parsed.updates ?? parsed;
  const updates = sanitizeLlmUpdates(rawUpdates, payload.fields, payload.description);

  return { updates, model: `${completion.provider}/${completion.model}` };
}

function getPromptGenerationSystemInstruction(templateId, mode) {
  if (mode === 'final-proposal') {
    return (
      'You are a principal solutions architect writing a final client proposal. ' +
      'Generate the proposal itself, not a meta-prompt. ' +
      'Use passportFields and fieldContext as the single source of truth. ' +
      'The proposal must be specifically personalized to this exact client/lead context. ' +
      'Do not invent facts, pricing, deadlines, or commitments. ' +
      'Missing information must be explicitly marked as [Need input]. ' +
      'Return only the final proposal text in Markdown.'
    );
  }

  if (templateId.startsWith('lead-')) {
    return (
      'You are a senior solutions engineer and prompt designer. ' +
      'Rewrite the base prompt into a practical, execution-ready prompt for lead qualification workflows. ' +
      'Use passportFields and fieldContext as the single source of truth for lead facts. ' +
      'Keep it concrete, structured, and focused on business value and next actions. ' +
      'Return only the final prompt text without explanations.'
    );
  }

  return (
    'You are a senior prompt engineer for software implementation tasks. ' +
    'Rewrite the provided base prompt into a concise, structured, execution-ready prompt for AI coding assistants. ' +
    'Use passportFields and fieldContext as the single source of truth for project facts. ' +
    'Preserve all critical project facts and constraints. Return only the final prompt text without explanations.'
  );
}

function getPromptGenerationOutputContract(templateId, mode, recipientName) {
  if (mode === 'final-proposal') {
    return [
      'Return a client-ready proposal as plain text (Markdown allowed only for bullets, but no headings).',
      `Opening line must be exactly: "Hi ${recipientName}! We have carefully reviewed your request and are ready to offer the following terms."`,
      'Cover this content flow in order, without writing section titles:',
      '1) brief executive summary',
      '2) client context and goals',
      '3) scope with in-scope and out-of-scope points',
      '4) solution approach',
      '5) delivery plan with phases and rough durations',
      '6) estimate and commercial terms with at least two options and assumptions',
      '7) key risks and mitigations',
      '8) open questions',
      '9) clear next step',
      'The proposal must be tailored to the specific lead/client from passport data.',
      'Do not use headings like "Executive Summary", "Next Step", etc.',
      'Avoid generic corporate phrases and filler text.',
      'Do not merge words or inject client name inside other words.',
      'Do not fabricate exact numbers for budget, rates, or timelines.',
      'Unknowns must be marked as [Need input].',
    ].join('\n');
  }

  if (templateId === 'lead-proposal') {
    return [
      'Target prompt must require this exact output structure:',
      '1) Executive Summary',
      '2) Proposed Scope (In Scope / Out of Scope)',
      '3) Solution Approach',
      '4) Delivery Plan with phases and duration',
      '5) Estimate & Commercial Terms with at least two options and assumptions',
      '6) Risks & Mitigations',
      '7) Open Questions',
      '8) Next Step',
      'The target prompt must ban fabricated facts and require [Need input] placeholders for missing data.',
    ].join('\n');
  }

  return 'Target prompt should preserve context, constraints, and produce clear structured output.';
}

function buildFieldContextDigest(fieldContext) {
  if (!Array.isArray(fieldContext) || fieldContext.length === 0) {
    return 'No explicit filled fields provided.';
  }

  return fieldContext
    .slice(0, 120)
    .map((item) => `- ${item.label} (${item.id}): ${item.value}`)
    .join('\n');
}

function resolveProposalRecipientName(payload) {
  const fields = payload.passportFields || {};
  const candidates = [fields.client, fields.leadName, payload.projectName];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }

    const normalized = candidate.trim();
    if (normalized) {
      return normalized;
    }
  }

  return 'there';
}

function isLogicalProposalTitleLine(line) {
  const normalized = line
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.:;!?-]+$/g, '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return false;
  }

  const blockedTitles = new Set([
    'executive summary',
    'client context & goals',
    'client context and goals',
    'proposed scope',
    'in scope',
    'out of scope',
    'solution approach',
    'delivery plan',
    'estimate & commercial terms',
    'estimate and commercial terms',
    'risks & mitigations',
    'risks and mitigations',
    'open questions',
    'next step',
  ]);

  return blockedTitles.has(normalized);
}

function sanitizeProposalBody(content) {
  const cleanedLines = [];

  String(content || '')
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const lineWithoutHeading = rawLine.replace(/^#{1,6}\s+/, '').replace(/\s+$/g, '');
      const trimmed = lineWithoutHeading.trim();

      if (!trimmed) {
        cleanedLines.push('');
        return;
      }

      if (isLogicalProposalTitleLine(trimmed)) {
        return;
      }

      cleanedLines.push(lineWithoutHeading);
    });

  return cleanedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ensureProposalOpening(content, recipientName) {
  const opening = `Hi ${recipientName}! We have carefully reviewed your request and are ready to offer the following terms.`;
  const sanitized = sanitizeProposalBody(content);
  const bodyWithoutOpening = sanitized
    .split(/\r?\n/)
    .filter((line) => line.trim().toLowerCase() !== opening.toLowerCase())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!bodyWithoutOpening) {
    return opening;
  }

  return `${opening}\n\n${bodyWithoutOpening}`;
}

function isTimeoutError(error) {
  return error instanceof Error && error.message.toLowerCase().includes('timed out');
}

function buildCompactPassportFields(passportFields) {
  if (!passportFields || typeof passportFields !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(passportFields)
      .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
      .slice(0, 48)
  );
}

async function requestLlmPromptGeneration(payload) {
  const normalizedTemplateId = payload.templateId.trim().toLowerCase();
  const normalizedEntity = (payload.passportEntity || '').trim().toLowerCase();
  const mode = normalizedTemplateId === 'lead-proposal' && normalizedEntity === 'lead' ? 'final-proposal' : 'prompt-rewrite';
  const proposalRecipientName = resolveProposalRecipientName(payload);
  const outputContract = getPromptGenerationOutputContract(normalizedTemplateId, mode, proposalRecipientName);
  const fieldContextDigest = buildFieldContextDigest(payload.fieldContext);
  const primaryTimeoutMs = mode === 'final-proposal' ? 70000 : 50000;
  const retryTimeoutMs = mode === 'final-proposal' ? 85000 : 65000;
  const systemInstruction = getPromptGenerationSystemInstruction(normalizedTemplateId, mode);

  const buildMessages = (compact) => {
    const userPayload = {
      generationMode: mode,
      templateId: payload.templateId,
      passportEntity: payload.passportEntity || 'Project',
      projectName: payload.projectName,
      passportFields: compact ? buildCompactPassportFields(payload.passportFields) : payload.passportFields || {},
      fieldContext: compact ? [] : payload.fieldContext || [],
      fieldContextDigest,
      proposalRecipientName,
      mainStack: payload.mainStack,
      platform: payload.platform,
      hostingDeployment: payload.hostingDeployment,
      outputContract,
      basePrompt: payload.basePrompt,
      compactMode: compact,
    };

    return [
      {
        role: 'system',
        content: systemInstruction,
      },
      {
        role: 'user',
        content: JSON.stringify(userPayload),
      },
    ];
  };

  let completion;

  try {
    completion = await requestChatCompletion({
      temperature: mode === 'final-proposal' ? 0.12 : normalizedTemplateId === 'lead-proposal' ? 0.15 : 0.2,
      jsonMode: false,
      maxTokens: mode === 'final-proposal' ? 2200 : undefined,
      timeoutMs: primaryTimeoutMs,
      messages: buildMessages(false),
    });
  } catch (error) {
    if (!isTimeoutError(error)) {
      throw error;
    }

    try {
      completion = await requestChatCompletion({
        temperature: mode === 'final-proposal' ? 0.12 : normalizedTemplateId === 'lead-proposal' ? 0.15 : 0.2,
        jsonMode: false,
        maxTokens: mode === 'final-proposal' ? 1500 : 1100,
        timeoutMs: retryTimeoutMs,
        messages: buildMessages(true),
      });
    } catch (retryError) {
      if (isTimeoutError(retryError)) {
        throw new Error('AI request timed out after retry. Try a shorter prompt or set AI_REQUEST_TIMEOUT_MS=90000.');
      }

      throw retryError;
    }
  }

  const finalContent = mode === 'final-proposal' ? ensureProposalOpening(completion.content, proposalRecipientName) : completion.content;

  return {
    prompt: finalContent,
    model: `${completion.provider}/${completion.model}`,
  };
}

export function getAiRuntimeInfo() {
  const remoteBaseUrl = resolveRemoteAiBaseUrl();
  return {
    provider: 'pollinations',
    model: REMOTE_AI_MODEL,
    endpoint: `${remoteBaseUrl}/`,
  };
}

export async function listAiModels() {
  return {
    provider: 'pollinations',
    models: [REMOTE_AI_MODEL],
  };
}

export async function analyzeDescription(payload) {
  return requestLlmAnalysis(payload);
}

export async function generatePrompt(payload) {
  return requestLlmPromptGeneration(payload);
}
