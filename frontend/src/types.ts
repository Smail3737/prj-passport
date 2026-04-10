import type { FieldType } from './passport-schema';

export interface LlmAnalyzerFieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface LlmAnalyzeResponse {
  updates: Record<string, string>;
  model: string;
}

export interface LlmGeneratePromptResponse {
  prompt: string;
  model: string;
}

export interface AiRuntimeInfo {
  provider: 'pollinations' | 'pollinations-fallback';
  model: string;
  endpoint: string;
}

export interface AiConnectionTestResponse {
  ok: boolean;
  provider: 'pollinations' | 'pollinations-fallback';
  model: string;
  endpoint: string;
  message: string;
}

export interface AiModelListResponse {
  provider: 'pollinations' | 'pollinations-fallback';
  models: string[];
}

export interface ProjectPassport {
  id: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, string>;
}

export interface PersistedPassportState {
  projects: ProjectPassport[];
  selectedProjectId: string | null;
}

export interface CompletenessInfo {
  percent: number;
  missing: Array<{ id: string; label: string }>;
}

export interface LoadedState {
  projects: ProjectPassport[];
  selectedProjectId: string;
}

export interface ExportFieldItem {
  id: string;
  label: string;
  value: string;
}

export interface ExportSectionItem {
  id: string;
  title: string;
  badge?: string;
  fields: ExportFieldItem[];
}

export interface PassportExportPayload {
  generatedAt: string;
  project: {
    id: string;
    name: string;
    status: string;
    projectType: string;
    client: string;
    communicationChannel: string;
    communicatorPeople: string;
    responsiblePeople: string;
    department: string;
    designTool: string;
    designToolUrl: string;
    mainStack: string;
    platform: string;
    hostingDeployment: string;
    createdAt: string;
    updatedAt: string;
  };
  completeness: {
    percent: number;
    missingImportantFields: Array<{ id: string; label: string }>;
  };
  sections: ExportSectionItem[];
}

export type PromptTemplateId =
  | 'mvp'
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'lead-qualification'
  | 'lead-discovery'
  | 'lead-proposal'
  | 'lead-followup';

export interface PromptTemplateOption {
  id: PromptTemplateId;
  label: string;
  description: string;
}

export interface ConverterStatus {
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface KeywordValueMapping {
  value: string;
  keywords: string[];
}
