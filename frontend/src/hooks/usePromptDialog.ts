import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionDefinition } from '../passport-schema';
import { LEAD_PROMPT_TEMPLATE_OPTIONS, PROJECT_PROMPT_TEMPLATE_OPTIONS } from '../config';
import { buildAiPromptText, buildExportFileBaseName, downloadFile } from '../export-utils';
import { getProjectName } from '../project-utils';
import { runtimeApi } from '../services/runtime-api';
import { isAttachmentFieldId } from '../file-attachments';
import type {
  CompletenessInfo,
  ConverterStatus,
  PromptTemplateOption,
  ProjectPassport,
  PromptTemplateId,
} from '../types';

interface UsePromptDialogParams {
  selectedProject: ProjectPassport | null;
  sections: SectionDefinition[];
  completeness: CompletenessInfo | null;
  isAiAvailable: boolean;
  selectedAiModel: string;
}

interface RegenerationPresetOption {
  id: string;
  label: string;
}

interface RegenerationPresetInstruction {
  id: string;
  label: string;
  instruction: string;
}

interface UsePromptDialogResult {
  promptDialogOpen: boolean;
  promptTemplate: PromptTemplateId;
  promptTemplateOptions: PromptTemplateOption[];
  promptText: string;
  promptStatus: ConverterStatus | null;
  isPromptGenerating: boolean;
  regenerationPresetOptions: RegenerationPresetOption[];
  selectedRegenerationPreset: string;
  regenerationCustomPrompt: string;
  openPromptDialog: () => void;
  closePromptDialog: () => void;
  setPromptTemplate: (value: PromptTemplateId) => void;
  setSelectedRegenerationPreset: (value: string) => void;
  setRegenerationCustomPrompt: (value: string) => void;
  generateAiPromptWithLlm: () => void;
  regenerateAiPromptWithLlm: () => void;
  copyAiPrompt: () => void;
  downloadAiPrompt: () => void;
}

const REGENERATION_PRESET_INSTRUCTIONS: RegenerationPresetInstruction[] = [
  {
    id: 'alternative',
    label: 'Alternative wording',
    instruction: 'Create an alternative version with different wording while preserving all key meaning.',
  },
  {
    id: 'shorter',
    label: 'Shorter and tighter',
    instruction: 'Make the output shorter and more concise while keeping critical details.',
  },
  {
    id: 'structured',
    label: 'More structured',
    instruction: 'Improve structure and readability with clearer sections and cleaner formatting.',
  },
  {
    id: 'formal',
    label: 'More formal tone',
    instruction: 'Rewrite in a formal business tone suitable for professional communication.',
  },
];

export function usePromptDialog({
  selectedProject,
  sections,
  completeness,
  isAiAvailable,
  selectedAiModel,
}: UsePromptDialogParams): UsePromptDialogResult {
  const [promptDialogOpen, setPromptDialogOpen] = useState<boolean>(false);
  const [promptTemplate, setPromptTemplate] = useState<PromptTemplateId>('mvp');
  const [promptText, setPromptText] = useState<string>('');
  const [promptStatus, setPromptStatus] = useState<ConverterStatus | null>(null);
  const [isPromptGenerating, setIsPromptGenerating] = useState<boolean>(false);
  const [selectedRegenerationPreset, setSelectedRegenerationPreset] = useState<string>('');
  const [regenerationCustomPrompt, setRegenerationCustomPrompt] = useState<string>('');

  const isLeadEntity = selectedProject?.fields.passportEntity === 'Lead';
  const promptTemplateOptions = isLeadEntity
    ? LEAD_PROMPT_TEMPLATE_OPTIONS
    : PROJECT_PROMPT_TEMPLATE_OPTIONS;
  const defaultPromptTemplate = promptTemplateOptions[0].id;

  const regenerationPresetOptions = useMemo<RegenerationPresetOption[]>(
    () => REGENERATION_PRESET_INSTRUCTIONS.map((item) => ({ id: item.id, label: item.label })),
    []
  );

  useEffect(() => {
    const isCurrentTemplateAvailable = promptTemplateOptions.some((option) => option.id === promptTemplate);
    if (isCurrentTemplateAvailable) {
      return;
    }

    setPromptTemplate(defaultPromptTemplate);
  }, [defaultPromptTemplate, promptTemplate, promptTemplateOptions]);

  const generatedAiPromptBase = useMemo(() => {
    if (!selectedProject || !completeness) {
      return '';
    }

    return buildAiPromptText(selectedProject, sections, completeness, promptTemplate);
  }, [selectedProject, sections, completeness, promptTemplate]);

  const promptFieldContext = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    return sections.flatMap((section) =>
      section.fields
        .map((field) => {
          if (isAttachmentFieldId(field.id)) {
            return null;
          }

          const value = (selectedProject.fields[field.id] || '').trim();
          if (!value) {
            return null;
          }

          return {
            id: field.id,
            label: field.label,
            value,
          };
        })
        .filter((item): item is { id: string; label: string; value: string } => Boolean(item))
    );
  }, [sections, selectedProject]);

  const nonEmptyPassportFields = useMemo(() => {
    if (!selectedProject) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(selectedProject.fields).filter(
        ([fieldId, value]) =>
          !isAttachmentFieldId(fieldId) && typeof value === 'string' && value.trim().length > 0
      )
    );
  }, [selectedProject]);

  const buildRegenerationDirective = useCallback((): string => {
    const presetInstruction = REGENERATION_PRESET_INSTRUCTIONS.find(
      (item) => item.id === selectedRegenerationPreset
    )?.instruction;
    const customInstruction = regenerationCustomPrompt.trim();

    const parts: string[] = [];

    if (presetInstruction) {
      parts.push(`Preset instruction: ${presetInstruction}`);
    }

    if (customInstruction) {
      parts.push(`Custom instruction: ${customInstruction}`);
    }

    if (parts.length === 0) {
      parts.push('Provide an improved alternative version while preserving all key facts and intent.');
    }

    return parts.join('\n');
  }, [regenerationCustomPrompt, selectedRegenerationPreset]);

  const requestPromptGeneration = useCallback(
    async (mode: 'generate' | 'regenerate') => {
      if (!isAiAvailable) {
        setPromptStatus({
          severity: 'error',
          message: 'AI is unavailable. Prompt generation is disabled until connection is healthy.',
        });
        return;
      }

      if (!selectedProject || !generatedAiPromptBase) {
        return;
      }

      if (mode === 'regenerate' && !promptText.trim()) {
        setPromptStatus({
          severity: 'warning',
          message: 'Generate a first result before running regeneration.',
        });
        return;
      }

      const isLeadProposalTemplate =
        selectedProject.fields.passportEntity === 'Lead' && promptTemplate === 'lead-proposal';

      setIsPromptGenerating(true);
      setPromptStatus({
        severity: 'info',
        message:
          mode === 'regenerate'
            ? isLeadProposalTemplate
              ? 'Regenerating proposal with your refinement instructions...'
              : 'Regenerating prompt with your refinement instructions...'
            : isLeadProposalTemplate
              ? 'Generating proposal from current lead passport fields...'
              : 'Generating prompt with LLM...',
      });

      try {
        const basePromptForRequest =
          mode === 'regenerate'
            ? [
                generatedAiPromptBase,
                'Regeneration request:',
                buildRegenerationDirective(),
                `Current output to improve:\n${promptText.trim()}`,
                'Return only the final improved output text.',
              ].join('\n\n')
            : generatedAiPromptBase;

        const result = await runtimeApi.generateAiPromptWithLLM({
          basePrompt: basePromptForRequest,
          templateId: promptTemplate,
          projectName: getProjectName(selectedProject),
          passportEntity: selectedProject.fields.passportEntity || 'Project',
          passportFields: nonEmptyPassportFields,
          fieldContext: promptFieldContext,
          mainStack: selectedProject.fields.mainStack || 'Not selected',
          platform: selectedProject.fields.platform || 'Not selected',
          hostingDeployment: selectedProject.fields.hostingDeployment || 'Not selected',
          model: selectedAiModel || undefined,
        });

        const nextPrompt = result.prompt.trim();
        if (!nextPrompt) {
          throw new Error('LLM returned an empty prompt');
        }

        setPromptText(nextPrompt);
        setPromptStatus({
          severity: 'success',
          message:
            mode === 'regenerate'
              ? isLeadProposalTemplate
                ? `Proposal regenerated with ${result.model}.`
                : `Prompt regenerated with ${result.model}.`
              : isLeadProposalTemplate
                ? `Proposal generated with ${result.model}.`
                : `Prompt generated with ${result.model}.`,
        });
      } catch (error) {
        console.error('Failed to generate AI prompt with LLM:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        setPromptStatus({
          severity: 'error',
          message:
            mode === 'regenerate'
              ? `Failed to regenerate with AI (${message}).`
              : `Failed to generate with AI (${message}).`,
        });
      } finally {
        setIsPromptGenerating(false);
      }
    },
    [
      buildRegenerationDirective,
      generatedAiPromptBase,
      isAiAvailable,
      nonEmptyPassportFields,
      promptFieldContext,
      promptTemplate,
      promptText,
      selectedAiModel,
      selectedProject,
    ]
  );

  const openPromptDialog = useCallback(() => {
    setPromptDialogOpen(true);
    setPromptText('');
    setSelectedRegenerationPreset('');
    setRegenerationCustomPrompt('');
    setPromptTemplate((current) => {
      const isCurrentTemplateAvailable = promptTemplateOptions.some((option) => option.id === current);
      return isCurrentTemplateAvailable ? current : defaultPromptTemplate;
    });
    setPromptStatus(
      isAiAvailable
        ? null
        : {
            severity: 'warning',
            message: 'AI is unavailable. Prompt generation is temporarily disabled.',
          }
    );
  }, [defaultPromptTemplate, isAiAvailable, promptTemplateOptions]);

  const closePromptDialog = useCallback(() => {
    setPromptDialogOpen(false);
    setPromptStatus(null);
  }, []);

  const copyAiPrompt = useCallback(async () => {
    if (!promptText) {
      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API is not available');
      }

      await navigator.clipboard.writeText(promptText);
      window.alert('AI prompt copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy AI prompt:', error);
      window.alert('Failed to copy AI prompt. Check console for details.');
    }
  }, [promptText]);

  const downloadAiPrompt = useCallback(() => {
    if (!selectedProject || !promptText) {
      return;
    }

    const fileName = `${buildExportFileBaseName(selectedProject)}-ai-${promptTemplate}.txt`;
    downloadFile(fileName, promptText, 'text/plain;charset=utf-8');
  }, [selectedProject, promptText, promptTemplate]);

  return {
    promptDialogOpen,
    promptTemplate,
    promptTemplateOptions,
    promptText,
    promptStatus,
    isPromptGenerating,
    regenerationPresetOptions,
    selectedRegenerationPreset,
    regenerationCustomPrompt,
    openPromptDialog,
    closePromptDialog,
    setPromptTemplate,
    setSelectedRegenerationPreset,
    setRegenerationCustomPrompt,
    generateAiPromptWithLlm: () => {
      void requestPromptGeneration('generate');
    },
    regenerateAiPromptWithLlm: () => {
      void requestPromptGeneration('regenerate');
    },
    copyAiPrompt: () => {
      void copyAiPrompt();
    },
    downloadAiPrompt,
  };
}
