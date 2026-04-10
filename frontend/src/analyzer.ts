import {
  BASE_SECTIONS,
  FieldType,
  LEAD_SECTIONS,
  SectionDefinition,
  getConditionalSections,
} from './passport-schema';
import { CONVERTER_LABEL_MAPPINGS, CONVERTER_SELECT_MAPPINGS } from './config';
import {
  HOSTING_FIELD_OPTIONS,
  MAIN_STACK_FIELD_OPTIONS,
  STATIC_SELECT_OPTIONS_BY_FIELD_ID,
  StackDrivenSelectOptions,
  buildDependentSelectUnion,
} from './select-options';
import type { KeywordValueMapping, LlmAnalyzerFieldDefinition } from './types';

function buildAnalyzerFieldDefinitions(): LlmAnalyzerFieldDefinition[] {
  const sectionMap = new Map<string, SectionDefinition>();
  BASE_SECTIONS.forEach((section) => sectionMap.set(section.id, section));
  LEAD_SECTIONS.forEach((section) => sectionMap.set(section.id, section));

  MAIN_STACK_FIELD_OPTIONS.forEach((option) => {
    getConditionalSections({
      mainStack: option.value,
      hostingDeployment: '',
    }).forEach((section) => sectionMap.set(section.id, section));
  });

  HOSTING_FIELD_OPTIONS.forEach((option) => {
    getConditionalSections({
      mainStack: '',
      hostingDeployment: option.value,
    }).forEach((section) => sectionMap.set(section.id, section));
  });

  getConditionalSections({
    mainStack: '',
    hostingDeployment: '',
    passportTemplate: 'Test Assignment',
  }).forEach((section) => sectionMap.set(section.id, section));

  const dependentSelectOptions: Record<keyof StackDrivenSelectOptions, string[]> = {
    cms: buildDependentSelectUnion('cms'),
    database: buildDependentSelectUnion('database'),
    storage: buildDependentSelectUnion('storage'),
    authStrategy: buildDependentSelectUnion('authStrategy'),
  };

  const fieldMap = new Map<string, LlmAnalyzerFieldDefinition>();

  sectionMap.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.type === 'files') {
        return;
      }

      const isStackDependentSelect =
        field.id === 'cms' ||
        field.id === 'database' ||
        field.id === 'storage' ||
        field.id === 'authStrategy';

      const options = isStackDependentSelect
        ? dependentSelectOptions[field.id as keyof StackDrivenSelectOptions]
        : field.options?.map((option) => option.value) ||
          STATIC_SELECT_OPTIONS_BY_FIELD_ID[field.id]?.map((option) => option.value) ||
          [];

      const resolvedType: FieldType = options.length > 0 ? 'select' : field.type;
      const existing = fieldMap.get(field.id);

      if (!existing) {
        fieldMap.set(field.id, {
          id: field.id,
          label: field.label,
          type: resolvedType,
          options: options.length > 0 ? [...new Set(options)] : undefined,
        });
        return;
      }

      const mergedOptions = [...new Set([...(existing.options || []), ...options])];
      fieldMap.set(field.id, {
        ...existing,
        type: existing.type === 'select' || resolvedType === 'select' ? 'select' : existing.type,
        options: mergedOptions.length > 0 ? mergedOptions : undefined,
      });
    });
  });

  return Array.from(fieldMap.values());
}

export const LLM_ANALYZER_FIELDS = buildAnalyzerFieldDefinitions();

export const ANALYZER_PROJECT_BASE_FIELD_IDS: string[] = [
  'projectName',
  'passportTemplate',
  'client',
  'communicationChannel',
  'communicatorPeople',
  'responsiblePeople',
  'department',
  'status',
  'projectType',
  'priority',
  'businessGoal',
  'scopeIn',
  'scopeOut',
  'currentStage',
  'definitionOfDone',
  'acceptanceCriteria',
  'testAssignmentTitle',
  'testAssignmentSourceUrl',
  'testAssignmentStatus',
  'testAssignmentEstimate',
  'testAssignmentSubmissionFormat',
  'testAssignmentDeliverables',
  'testAssignmentEvaluationCriteria',
  'testAssignmentConstraints',
  'mainStack',
  'platform',
  'hostingDeployment',
  'cms',
  'database',
  'storage',
  'authStrategy',
  'integrations',
  'repositoryUrl',
  'stagingUrl',
  'productionUrl',
  'adminUrl',
  'apiBaseUrl',
  'docsUrl',
];

export const ANALYZER_LEAD_BASE_FIELD_IDS: string[] = [
  'leadName',
  'client',
  'leadStatus',
  'priority',
  'leadSource',
  'leadContactPerson',
  'communicationChannel',
  'communicatorPeople',
  'responsiblePeople',
  'leadSummary',
  'leadBudget',
  'leadNextStep',
  'leadQualificationNotes',
  'leadLossReason',
];

export const ANALYZER_BASE_FIELD_IDS: string[] = [
  ...new Set([...ANALYZER_PROJECT_BASE_FIELD_IDS, ...ANALYZER_LEAD_BASE_FIELD_IDS]),
];

export const ANALYZER_MIN_FIELD_COUNT = 14;
export const ANALYZER_MAX_FIELD_COUNT = 42;

function normalizeAnalyzerToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/ ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferMappedValue(mappings: KeywordValueMapping[] | undefined, text: string): string | undefined {
  if (!mappings) {
    return undefined;
  }

  const normalized = normalizeAnalyzerToken(text);
  if (!normalized) {
    return undefined;
  }

  let bestMatch: { value: string; score: number } | null = null;

  for (const mapping of mappings) {
    for (const keyword of mapping.keywords) {
      const normalizedKeyword = normalizeAnalyzerToken(keyword);
      if (!normalizedKeyword) {
        continue;
      }

      let score = 0;
      if (normalized === normalizedKeyword) {
        score = 1000 + normalizedKeyword.length;
      } else if (normalized.includes(normalizedKeyword)) {
        score = 100 + normalizedKeyword.length;
      } else {
        continue;
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { value: mapping.value, score };
      }
    }
  }

  return bestMatch?.value;
}

function findFieldIdByLabel(labelNormalized: string): string | null {
  const normalizedLabel = normalizeAnalyzerToken(labelNormalized);
  if (!normalizedLabel) {
    return null;
  }

  let bestMatch: { fieldId: string; score: number } | null = null;

  for (const mapping of CONVERTER_LABEL_MAPPINGS) {
    for (const alias of mapping.labels) {
      const normalizedAlias = normalizeAnalyzerToken(alias);
      if (!normalizedAlias) {
        continue;
      }

      let score = 0;
      if (normalizedLabel === normalizedAlias) {
        score = 1000 + normalizedAlias.length;
      } else if (` ${normalizedLabel} `.includes(` ${normalizedAlias} `)) {
        score = 100 + normalizedAlias.length;
      } else if (normalizedLabel.includes(normalizedAlias)) {
        score = 10 + normalizedAlias.length;
      } else {
        continue;
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          fieldId: mapping.fieldId,
          score,
        };
      }
    }
  }

  return bestMatch?.fieldId || null;
}

function extractUrlsFromText(text: string): string[] {
  const urls: string[] = [];
  const regex = /https?:\/\/[^\s)]+/gi;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    urls.push(match[0].replace(/[.,;]+$/, ''));
    match = regex.exec(text);
  }

  return urls;
}

function sanitizeProjectNameCandidate(rawValue: string): string {
  let candidate = rawValue
    .trim()
    .replace(/^["'`“”]+|["'`“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/, '')
    .trim();

  candidate = candidate.replace(/^called\s+/i, '').trim();

  const splitPatterns = [
    /\s+with fields such as\b/i,
    /\s+where project information can be stored\b/i,
    /\s+for this test task\b/i,
  ];

  splitPatterns.forEach((pattern) => {
    const match = candidate.match(pattern);
    if (!match || typeof match.index !== 'number' || match.index <= 0) {
      return;
    }

    candidate = candidate.slice(0, match.index).trim();
  });

  const commaNoiseMatch = candidate.match(
    /^(.+?),\s*(short description|stack|links|notes|contacts|access(?:-related)? information)\b/i
  );
  if (commaNoiseMatch?.[1]) {
    candidate = commaNoiseMatch[1].trim();
  }

  return candidate.replace(/[.,;:!?]+$/, '').trim();
}

function isLikelyProjectName(value: string): boolean {
  if (!value || value.length < 2 || value.length > 120) {
    return false;
  }

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length > 12) {
    return false;
  }

  if (/^(requirements|nice to have|suggested stack|the goal)$/i.test(value)) {
    return false;
  }

  return true;
}

export function analyzeDescriptionToFieldUpdates(description: string): Record<string, string> {
  const updates: Record<string, string> = {};
  const text = description.trim();

  if (!text) {
    return updates;
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const nonEmptyLines = lines.filter(Boolean);
  const trySetProjectName = (rawValue: string): boolean => {
    const candidate = sanitizeProjectNameCandidate(rawValue);
    if (!isLikelyProjectName(candidate)) {
      return false;
    }

    updates.projectName = candidate;
    updates.leadName = candidate;
    return true;
  };

  const parseStructuredLabelLine = (line: string): { fieldId: string; rawValue: string } | null => {
    const match = line.match(
      /^[-*•]?\s*([a-z][a-z0-9 /()&.,'+-]{1,90}?)(?:\s*:\s*|\s+[-–—]\s+)(.*)$/i
    );
    if (!match) {
      return null;
    }

    const rawLabel = match[1].trim();
    if (!rawLabel || rawLabel.toLowerCase().startsWith('http')) {
      return null;
    }

    const fieldId = findFieldIdByLabel(normalizeAnalyzerToken(rawLabel));
    if (!fieldId) {
      return null;
    }

    return {
      fieldId,
      rawValue: match[2].trim(),
    };
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    const parsed = parseStructuredLabelLine(line);
    if (!parsed) {
      continue;
    }

    const { fieldId } = parsed;
    let rawValue = parsed.rawValue;

    if (!rawValue) {
      const blockLines: string[] = [];
      let j = i + 1;

      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (!nextLine) {
          j += 1;
          continue;
        }

        if (parseStructuredLabelLine(nextLine)) {
          break;
        }

        blockLines.push(nextLine.replace(/^[-*•]\s*/, '').trim());
        j += 1;
      }

      rawValue = blockLines.join('\n').replace(/\n{2,}/g, '\n').trim();
      i = j - 1;
    }

    if (!rawValue) {
      continue;
    }

    if (fieldId === 'projectName' || fieldId === 'leadName') {
      if (trySetProjectName(rawValue)) {
        continue;
      }
    }

    const mappedSelectValue = inferMappedValue(CONVERTER_SELECT_MAPPINGS[fieldId], rawValue);
    if (CONVERTER_SELECT_MAPPINGS[fieldId]) {
      if (mappedSelectValue) {
        updates[fieldId] = mappedSelectValue;
      }
      continue;
    }

    updates[fieldId] = rawValue;
  }

  const normalizedText = normalizeAnalyzerToken(text);
  const inferredSelectFields = [
    'passportTemplate',
    'mainStack',
    'platform',
    'hostingDeployment',
    'priority',
    'status',
    'department',
    'currentStage',
    'apiType',
    'testAssignmentStatus',
    'testAssignmentSubmissionFormat',
    'leadStatus',
    'leadSource',
  ];

  inferredSelectFields.forEach((fieldId) => {
    if (updates[fieldId]) {
      return;
    }

    const inferred = inferMappedValue(CONVERTER_SELECT_MAPPINGS[fieldId], normalizedText);
    if (inferred) {
      updates[fieldId] = inferred;
    }
  });

  if (updates.mainStack === 'WordPress' || normalizedText.includes('wordpress')) {
    if (!updates.cms) {
      updates.cms = 'WordPress';
    }
    if (!updates.wpWooCommerce && (normalizedText.includes('woocommerce') || normalizedText.includes('woo'))) {
      updates.wpWooCommerce = 'Yes';
    }
    if (!updates.wpAcfUsed && normalizedText.includes('acf')) {
      updates.wpAcfUsed = 'Yes';
    }
    if (!updates.wpPageBuilder && normalizedText.includes('elementor')) {
      updates.wpPageBuilder = 'Elementor';
    }
    if (!updates.wpSeoPlugin && normalizedText.includes('yoast')) {
      updates.wpSeoPlugin = 'Yoast SEO';
    }
  }

  const urls = extractUrlsFromText(text);
  const usedUrls = new Set<string>();
  const tryPickUrl = (predicate: (url: string) => boolean): string | undefined => {
    const found = urls.find((url) => !usedUrls.has(url) && predicate(url));
    if (found) {
      usedUrls.add(found);
    }
    return found;
  };

  if (!updates.repositoryUrl) {
    const repositoryUrl = tryPickUrl((url) =>
      ['github.com', 'gitlab.com', 'bitbucket.org'].some((host) => url.includes(host))
    );
    if (repositoryUrl) {
      updates.repositoryUrl = repositoryUrl;
    }
  }

  if (!updates.docsUrl) {
    const docsUrl = tryPickUrl((url) => ['notion.so', 'confluence', '/docs', 'readme'].some((part) => url.includes(part)));
    if (docsUrl) {
      updates.docsUrl = docsUrl;
    }
  }

  if (!updates.stagingUrl) {
    const stagingUrl = tryPickUrl((url) => ['staging', 'preview'].some((part) => url.includes(part)));
    if (stagingUrl) {
      updates.stagingUrl = stagingUrl;
    }
  }

  if (!updates.adminUrl) {
    const adminUrl = tryPickUrl((url) => ['wp-admin', '/admin', 'admin.'].some((part) => url.includes(part)));
    if (adminUrl) {
      updates.adminUrl = adminUrl;
    }
  }

  if (!updates.apiBaseUrl) {
    const apiBaseUrl = tryPickUrl((url) => ['/api', 'api.'].some((part) => url.includes(part)));
    if (apiBaseUrl) {
      updates.apiBaseUrl = apiBaseUrl;
    }
  }

  if (!updates.productionUrl) {
    const productionUrl = tryPickUrl(() => true);
    if (productionUrl) {
      updates.productionUrl = productionUrl;
    }
  }

  if (!updates.hostingDeployment) {
    if (urls.some((url) => url.includes('vercel.app'))) {
      updates.hostingDeployment = 'Vercel';
    } else if (urls.some((url) => url.includes('netlify.app'))) {
      updates.hostingDeployment = 'Netlify';
    } else if (urls.some((url) => url.includes('firebaseapp.com') || url.includes('web.app'))) {
      updates.hostingDeployment = 'Firebase';
    } else if (urls.some((url) => url.includes('onrender.com'))) {
      updates.hostingDeployment = 'Render';
    }
  }

  if (!updates.projectName) {
    const titleLine = nonEmptyLines[0];
    if (titleLine) {
      const titleMatch = titleLine.match(
        /^(?:#{1,6}\s*)?(?:test\s*(?:task|assignment)|assignment|project)\s*:\s*(.+)$/i
      );
      if (titleMatch?.[1]) {
        trySetProjectName(titleMatch[1]);
      }
    }
  }

  if (!updates.leadName && updates.projectName) {
    updates.leadName = updates.projectName;
  }

  if (!updates.projectName) {
    const explicitNamePatterns = [
      /\b(?:prototype|app|project)\s+called\s+["“]?([^"\n.]{2,120})["”]?/i,
      /\bproject name(?:\s+is)?\s*[:-]?\s*["“]?([^"\n.]{2,120})["”]?/i,
      /\bname of (?:the )?project(?:\s+is)?\s*[:-]?\s*["“]?([^"\n.]{2,120})["”]?/i,
      /\bwe call (?:the )?project\s+["“]?([^"\n.]{2,120})["”]?/i,
      /\bproject\s+["“]?([^"\n.]{2,120})["”]?\s+is called\b/i,
    ];

    for (const pattern of explicitNamePatterns) {
      const match = text.match(pattern);
      if (!match?.[1]) {
        continue;
      }

      if (trySetProjectName(match[1])) {
        break;
      }
    }
  }

  if (!updates.leadName) {
    const explicitLeadNamePatterns = [
      /\blead name(?:\s+is)?\s*[:\-–—]\s*["“]?([^"\n.]{2,120})["”]?/i,
      /\bopportunity name(?:\s+is)?\s*[:\-–—]\s*["“]?([^"\n.]{2,120})["”]?/i,
      /\brequest name(?:\s+is)?\s*[:\-–—]\s*["“]?([^"\n.]{2,120})["”]?/i,
    ];

    for (const pattern of explicitLeadNamePatterns) {
      const match = text.match(pattern);
      if (!match?.[1]) {
        continue;
      }

      if (trySetProjectName(match[1])) {
        break;
      }
    }
  }

  if (!updates.leadSummary) {
    const leadDescriptionMatch = text.match(/\blead description\s*[:\-–—]\s*([\s\S]{10,2000})$/i);
    if (leadDescriptionMatch?.[1]) {
      updates.leadSummary = leadDescriptionMatch[1].trim();
    }
  }

  if (!updates.businessGoal) {
    const goalMatch = text.match(
      /\b(?:the\s+)?(?:goal|objective)\s+is\s+to\s+([^.\n]+)(?:[.\n]|$)/i
    );
    if (goalMatch?.[1]) {
      updates.businessGoal = goalMatch[1].trim();
    }
  }

  if (!updates.scopeIn) {
    const includeMatch = text.match(
      /\b(?:should|must)\s+include[^.\n]*such\s+as\s+([^.\n]+)(?:[.\n]|$)/i
    );
    if (includeMatch?.[1]) {
      const items = includeMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 2)
        .slice(0, 10);
      if (items.length > 0) {
        updates.scopeIn = items.join('\n');
      }
    }
  }

  if (!updates.scopeIn) {
    const bulletLines = nonEmptyLines
      .filter((line) => /^[-*•]/.test(line))
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter((line) => line.length > 4)
      .slice(0, 6);
    if (bulletLines.length > 0) {
      updates.scopeIn = bulletLines.join('\n');
    }
  }

  return updates;
}

export function buildFocusedAnalyzerFields(
  description: string,
  currentFields: Record<string, string>,
  strictFallbackUpdates: Record<string, string>
): LlmAnalyzerFieldDefinition[] {
  const fieldMap = new Map<string, LlmAnalyzerFieldDefinition>(
    LLM_ANALYZER_FIELDS.map((field) => [field.id, field])
  );
  const normalizedText = normalizeAnalyzerToken(description);
  const baseFieldIds =
    currentFields.passportEntity === 'Lead' ? ANALYZER_LEAD_BASE_FIELD_IDS : ANALYZER_PROJECT_BASE_FIELD_IDS;
  const priorityIds = [...baseFieldIds, ...Object.keys(strictFallbackUpdates)];
  const candidateIds = new Set<string>(priorityIds);

  CONVERTER_LABEL_MAPPINGS.forEach((mapping) => {
    const hasMatch = mapping.labels.some((alias) =>
      normalizedText.includes(normalizeAnalyzerToken(alias))
    );
    if (hasMatch) {
      candidateIds.add(mapping.fieldId);
    }
  });

  Object.entries(CONVERTER_SELECT_MAPPINGS).forEach(([fieldId, mappings]) => {
    const hasMatch = mappings.some((mapping) =>
      mapping.keywords.some((keyword) => normalizedText.includes(normalizeAnalyzerToken(keyword)))
    );
    if (hasMatch) {
      candidateIds.add(fieldId);
    }
  });

  const keywordFieldMappings: Array<{ keywords: string[]; fieldIds: string[] }> = [
    {
      keywords: ['wordpress', 'elementor', 'woocommerce', 'wp-admin'],
      fieldIds: ['wpType', 'wpThemeType', 'wpPageBuilder', 'wpAcfUsed', 'wpWooCommerce', 'wpSeoPlugin', 'wpAdminUrl'],
    },
    {
      keywords: ['next.js', 'nextjs', 'app router', 'pages router'],
      fieldIds: ['nextRouterMode', 'nextRenderingStrategy', 'nextAuth', 'nextCmsIntegration', 'nextHostingPlatform'],
    },
    {
      keywords: ['react native', 'expo', 'ios', 'android'],
      fieldIds: ['rnExpoOrBare', 'rnTargetPlatforms', 'rnNavigation', 'rnPushNotifications', 'rnAuth'],
    },
    {
      keywords: ['electron', 'desktop app', 'ipc', 'auto update'],
      fieldIds: [
        'electronRendererStack',
        'electronStateManagement',
        'electronLocalPersistenceStrategy',
        'electronFileSystemAccess',
        'electronAutoUpdate',
      ],
    },
  ];

  keywordFieldMappings.forEach((entry) => {
    const hasKeyword = entry.keywords.some((keyword) => normalizedText.includes(keyword));
    if (!hasKeyword) {
      return;
    }

    entry.fieldIds.forEach((fieldId) => candidateIds.add(fieldId));
  });

  const orderedIds = [...new Set([...priorityIds, ...Array.from(candidateIds)])];
  const selected: LlmAnalyzerFieldDefinition[] = [];
  const selectedIds = new Set<string>();

  orderedIds.forEach((fieldId) => {
    if (selected.length >= ANALYZER_MAX_FIELD_COUNT) {
      return;
    }

    const field = fieldMap.get(fieldId);
    if (!field || selectedIds.has(fieldId)) {
      return;
    }

    const isPriority =
      baseFieldIds.includes(fieldId) ||
      Object.prototype.hasOwnProperty.call(strictFallbackUpdates, fieldId);
    const hasCurrentValue = Boolean((currentFields[fieldId] || '').trim());

    if (!isPriority && hasCurrentValue) {
      return;
    }

    selected.push(field);
    selectedIds.add(fieldId);
  });

  if (selected.length < ANALYZER_MIN_FIELD_COUNT) {
    for (const field of LLM_ANALYZER_FIELDS) {
      if (selected.length >= ANALYZER_MIN_FIELD_COUNT) {
        break;
      }

      if (selectedIds.has(field.id)) {
        continue;
      }

      const hasCurrentValue = Boolean((currentFields[field.id] || '').trim());
      if (hasCurrentValue) {
        continue;
      }

      selected.push(field);
      selectedIds.add(field.id);
    }
  }

  return selected.length > 0 ? selected : LLM_ANALYZER_FIELDS;
}
