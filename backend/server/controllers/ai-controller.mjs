import {
  analyzeDescription,
  generatePrompt,
  getAiRuntimeInfo,
  listAiModels,
} from '../services/ai-service.mjs';
import { readRequestJson, sendJson } from '../utils/http-utils.mjs';

function normalizeAnalyzeFields(rawFields) {
  return Array.isArray(rawFields)
    ? rawFields
        .map((field) => {
          if (!field || typeof field !== 'object') {
            return null;
          }

          const id = typeof field.id === 'string' ? field.id.trim() : '';
          const label = typeof field.label === 'string' ? field.label.trim() : '';
          const type = field.type;
          const options = Array.isArray(field.options)
            ? field.options
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter(Boolean)
            : [];

          if (!id || !label || !type) {
            return null;
          }

          if (!['text', 'textarea', 'select', 'date', 'url'].includes(type)) {
            return null;
          }

          return {
            id,
            label,
            type,
            options,
          };
        })
        .filter(Boolean)
    : [];
}

function normalizeFieldContext(rawFieldContext) {
  return Array.isArray(rawFieldContext)
    ? rawFieldContext
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const id = typeof item.id === 'string' ? item.id.trim() : '';
          const label = typeof item.label === 'string' ? item.label.trim() : '';
          const value = typeof item.value === 'string' ? item.value.trim() : '';
          if (!id || !label || !value) {
            return null;
          }

          return { id, label, value };
        })
        .filter(Boolean)
        .slice(0, 120)
    : [];
}

export function createAiController() {
  return {
    async handleHealth(_request, response) {
      return sendJson(response, 200, {
        ok: true,
        service: 'project-passport-react-ai-api',
      });
    },

    async handleRuntime(_request, response, url) {
      const modelOverride = url.searchParams.get('model') || undefined;
      return sendJson(response, 200, getAiRuntimeInfo(modelOverride));
    },
    async handleModels(_request, response) {
      const result = await listAiModels();
      return sendJson(response, 200, result);
    },

    async handleAnalyze(request, response) {
      const payload = await readRequestJson(request);
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload is required');
      }

      const description = typeof payload.description === 'string' ? payload.description.trim() : '';
      if (!description) {
        throw new Error('Description is required');
      }

      const fields = normalizeAnalyzeFields(payload.fields);
      if (fields.length === 0) {
        throw new Error('At least one field definition is required');
      }

      const currentFields =
        payload.currentFields && typeof payload.currentFields === 'object' ? payload.currentFields : {};
      const model =
        typeof payload.model === 'string' && payload.model.trim().length > 0 ? payload.model.trim() : undefined;

      const result = await analyzeDescription({
        description,
        currentFields,
        fields,
        model,
      });

      return sendJson(response, 200, result);
    },

    async handleGeneratePrompt(request, response) {
      const payload = await readRequestJson(request);
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload is required');
      }

      const basePrompt = typeof payload.basePrompt === 'string' ? payload.basePrompt.trim() : '';
      if (!basePrompt) {
        throw new Error('Base prompt is required');
      }

      const templateId = typeof payload.templateId === 'string' ? payload.templateId.trim() : '';
      const projectName = typeof payload.projectName === 'string' ? payload.projectName.trim() : '';
      const passportEntity = typeof payload.passportEntity === 'string' ? payload.passportEntity.trim() : '';
      const passportFields =
        payload.passportFields && typeof payload.passportFields === 'object' ? payload.passportFields : {};
      const fieldContext = normalizeFieldContext(payload.fieldContext);
      const mainStack = typeof payload.mainStack === 'string' ? payload.mainStack.trim() : '';
      const platform = typeof payload.platform === 'string' ? payload.platform.trim() : '';
      const hostingDeployment =
        typeof payload.hostingDeployment === 'string' ? payload.hostingDeployment.trim() : '';
      const model =
        typeof payload.model === 'string' && payload.model.trim().length > 0 ? payload.model.trim() : undefined;

      const result = await generatePrompt({
        basePrompt,
        templateId,
        projectName,
        passportEntity,
        passportFields,
        fieldContext,
        mainStack,
        platform,
        hostingDeployment,
        model,
      });

      return sendJson(response, 200, result);
    },
  };
}
