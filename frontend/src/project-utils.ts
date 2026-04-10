import type { PaletteMode } from '@mui/material';
import { IMPORTANT_FIELDS, LEAD_IMPORTANT_FIELDS } from './passport-schema';
import { AI_MODEL_STORAGE_KEY, STORAGE_KEY, THEME_STORAGE_KEY } from './config';
import type { CompletenessInfo, LoadedState, PersistedPassportState, ProjectPassport } from './types';

type PassportEntityKind = 'Project' | 'Lead';

function generateId(): string {
  return `passport-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDateForInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function formatDisplayDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return formatDateTime(date);
}

export function getProjectName(project: ProjectPassport): string {
  if (project.fields.passportEntity === 'Lead') {
    return project.fields.leadName?.trim() || project.fields.projectName?.trim() || 'Untitled Lead';
  }

  return project.fields.projectName?.trim() || 'Untitled Passport';
}

export function createDefaultProject(entity: PassportEntityKind = 'Project'): ProjectPassport {
  const nowIso = new Date().toISOString();

  const isLead = entity === 'Lead';

  return {
    id: generateId(),
    archived: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    fields: {
      passportEntity: entity,
      projectName: '',
      passportTemplate: isLead ? '' : 'Standard',
      client: '',
      communicationChannel: '',
      communicatorPeople: '',
      responsiblePeople: '',
      department: '',
      designTool: '',
      designToolUrl: '',
      status: isLead ? '' : 'Discovery',
      projectType: '',
      priority: isLead ? 'Medium' : '',
      startedAt: '',
      lastUpdated: '',
      businessGoal: '',
      scopeIn: '',
      scopeOut: '',
      currentStage: '',
      definitionOfDone: '',
      acceptanceCriteria: '',
      testAssignmentTitle: '',
      testAssignmentSourceUrl: '',
      testAssignmentStatus: '',
      testAssignmentEstimate: '',
      testAssignmentSubmissionFormat: '',
      testAssignmentDeliverables: '',
      testAssignmentEvaluationCriteria: '',
      testAssignmentConstraints: '',
      leadName: '',
      leadContactPerson: '',
      leadSource: '',
      leadStatus: isLead ? 'New' : '',
      leadBudget: '',
      leadSummary: '',
      leadQualificationNotes: '',
      leadNextStep: '',
      leadOwner: '',
      leadLossReason: '',
      mainStack: '',
      secondaryStack: '',
      platform: '',
      hostingDeployment: '',
      database: '',
      cms: '',
      authStrategy: '',
      storage: '',
      apiType: '',
      integrations: '',
      repositoryUrl: '',
      docsUrl: '',
      stagingUrl: '',
      productionUrl: '',
      adminUrl: '',
      apiBaseUrl: '',
      runInstallCommand: '',
      runStartCommand: '',
      runTestCommand: '',
      runBuildCommand: '',
      secretStorageReference: '',
      vaultLink: '',
      accessNotes: '',
      projectAttachments: '',
      leadAttachments: '',
      taskConverterInput: '',
    },
  };
}

function normalizeProject(raw: unknown): ProjectPassport | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;
  const fieldsRaw = obj.fields;
  const fields: Record<string, string> = {};

  if (fieldsRaw && typeof fieldsRaw === 'object') {
    Object.entries(fieldsRaw as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'string') {
        fields[key] = value;
      }
    });
  }

  if (!fields.scopeIn && fields.mainDeliverable) {
    fields.scopeIn = fields.mainDeliverable;
  }

  if (!fields.communicationChannel && fields.leadContactChannel) {
    fields.communicationChannel = fields.leadContactChannel;
  }

  if (!fields.responsiblePeople && fields.leadOwner) {
    fields.responsiblePeople = fields.leadOwner;
  }

  if (fields.projectType === 'Client Work' || fields.projectType === 'Internal Tool') {
    fields.projectType = 'SaaS Product';
  }

  if (!fields.passportEntity) {
    fields.passportEntity = fields.leadName?.trim() ? 'Lead' : 'Project';
  }

  if (!fields.passportTemplate) {
    fields.passportTemplate =
      fields.passportEntity === 'Lead'
        ? ''
        : fields.projectType === 'Test Assignment'
          ? 'Test Assignment'
          : 'Standard';
  }

  if (fields.passportEntity === 'Lead' && !fields.leadStatus) {
    fields.leadStatus = 'New';
  }

  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString();
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString();

  return {
    id: typeof obj.id === 'string' ? obj.id : generateId(),
    archived: Boolean(obj.archived),
    createdAt,
    updatedAt,
    fields,
  };
}

export function getCompleteness(fields: Record<string, string>): CompletenessInfo {
  if (fields.passportEntity === 'Lead') {
    const total = LEAD_IMPORTANT_FIELDS.length;
    const missing = LEAD_IMPORTANT_FIELDS.filter((field) => !fields[field.id]?.trim()).map((field) => ({
      id: field.id,
      label: field.label,
    }));

    return {
      percent: Math.round(((total - missing.length) / total) * 100),
      missing,
    };
  }

  const isTestAssignmentTemplate = fields.passportTemplate === 'Test Assignment';
  const visibleImportantFields = IMPORTANT_FIELDS.filter((field) => {
    if (!isTestAssignmentTemplate) {
      return true;
    }

    return (
      field.id !== 'businessGoal' &&
      field.id !== 'scopeIn' &&
      field.id !== 'definitionOfDone' &&
      field.id !== 'acceptanceCriteria'
    );
  });

  const total = visibleImportantFields.length;
  const missing = visibleImportantFields.filter((field) => !fields[field.id]?.trim()).map((field) => ({
    id: field.id,
    label: field.label,
  }));

  return {
    percent: Math.round(((total - missing.length) / total) * 100),
    missing,
  };
}

export function normalizePersistedPassportState(raw: unknown): LoadedState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const parsed = raw as PersistedPassportState;
  const projects = (Array.isArray(parsed.projects) ? parsed.projects : [])
    .map((project) => normalizeProject(project))
    .filter((project): project is ProjectPassport => Boolean(project));

  if (projects.length === 0) {
    return null;
  }

  const selectedExists =
    typeof parsed.selectedProjectId === 'string' &&
    projects.some((project) => project.id === parsed.selectedProjectId);
  const fallback = projects.find((project) => !project.archived) || projects[0];

  return {
    projects,
    selectedProjectId: selectedExists ? (parsed.selectedProjectId as string) : fallback.id,
  };
}

export function loadInitialState(): LoadedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const normalized = normalizePersistedPassportState(JSON.parse(raw));
      if (normalized) {
        return normalized;
      }
    }
  } catch (error) {
    console.error('Failed to load project passport state:', error);
  }

  const initial = createDefaultProject();

  return {
    projects: [initial],
    selectedProjectId: initial.id,
  };
}

export function loadThemeMode(): PaletteMode {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'dark' || raw === 'light') {
    return raw;
  }

  return 'light';
}

export function loadAiModelPreference(): string {
  const raw = localStorage.getItem(AI_MODEL_STORAGE_KEY);
  if (!raw) {
    return '';
  }

  return raw.trim();
}

export function touchProject(project: ProjectPassport): ProjectPassport {
  const now = new Date();
  const nowIso = now.toISOString();

  return {
    ...project,
    updatedAt: nowIso,
    fields: {
      ...project.fields,
      lastUpdated: formatDateTime(now),
    },
  };
}
