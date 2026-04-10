import { useCallback, useEffect, useState } from 'react';
import { ANALYZER_MIN_FIELD_COUNT, analyzeDescriptionToFieldUpdates, buildFocusedAnalyzerFields } from '../analyzer';
import { STACK_DEPENDENT_FIELD_IDS } from '../config';
import { touchProject } from '../project-utils';
import { runtimeApi } from '../services/runtime-api';
import { isAttachmentFieldId } from '../file-attachments';
import type { ConverterStatus, LlmAnalyzeResponse, ProjectPassport } from '../types';

interface UseTaskConverterParams {
  projects: ProjectPassport[];
  selectedProject: ProjectPassport | null;
  selectedAiModel: string;
  updateProjectById: (projectId: string, updateFn: (project: ProjectPassport) => ProjectPassport) => void;
}

interface UseTaskConverterResult {
  converterInput: string;
  selectedConverterStatus: ConverterStatus | null;
  isSelectedProjectAnalyzing: boolean;
  isAnyProjectAnalyzing: boolean;
  analyzingProjectIds: Record<string, true>;
  clearProjectTaskState: (projectId: string) => void;
  analyzeDescription: () => void;
  insertConverterFile: () => void;
  clearConverter: () => void;
}

export function useTaskConverter({
  projects,
  selectedProject,
  selectedAiModel,
  updateProjectById,
}: UseTaskConverterParams): UseTaskConverterResult {
  const [converterStatusByProjectId, setConverterStatusByProjectId] = useState<Record<string, ConverterStatus>>({});
  const [analyzingProjectIds, setAnalyzingProjectIds] = useState<Record<string, true>>({});

  const converterInput = selectedProject?.fields.taskConverterInput || '';
  const isSelectedProjectAnalyzing = Boolean(selectedProject && analyzingProjectIds[selectedProject.id]);
  const selectedConverterStatus = selectedProject ? converterStatusByProjectId[selectedProject.id] || null : null;
  const isAnyProjectAnalyzing = Object.keys(analyzingProjectIds).length > 0;

  const setProjectConverterStatus = useCallback((projectId: string, status: ConverterStatus | null) => {
    setConverterStatusByProjectId((prev) => {
      if (status) {
        const previousStatus = prev[projectId];
        if (
          previousStatus &&
          previousStatus.severity === status.severity &&
          previousStatus.message === status.message
        ) {
          return prev;
        }

        return {
          ...prev,
          [projectId]: status,
        };
      }

      if (!(projectId in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  }, []);

  const setProjectAnalyzing = useCallback((projectId: string, isAnalyzing: boolean) => {
    setAnalyzingProjectIds((prev) => {
      if (isAnalyzing) {
        if (prev[projectId]) {
          return prev;
        }

        return {
          ...prev,
          [projectId]: true,
        };
      }

      if (!prev[projectId]) {
        return prev;
      }

      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  }, []);

  const clearProjectTaskState = useCallback(
    (projectId: string) => {
      setProjectConverterStatus(projectId, null);
      setProjectAnalyzing(projectId, false);
    },
    [setProjectAnalyzing, setProjectConverterStatus]
  );

  useEffect(() => {
    const existingProjectIds = new Set(projects.map((project) => project.id));

    setConverterStatusByProjectId((prev) => {
      let changed = false;
      const next: Record<string, ConverterStatus> = {};

      Object.entries(prev).forEach(([projectId, status]) => {
        if (existingProjectIds.has(projectId)) {
          next[projectId] = status;
          return;
        }

        changed = true;
      });

      return changed ? next : prev;
    });

    setAnalyzingProjectIds((prev) => {
      let changed = false;
      const next: Record<string, true> = {};

      Object.entries(prev).forEach(([projectId, isAnalyzing]) => {
        if (existingProjectIds.has(projectId)) {
          next[projectId] = isAnalyzing;
          return;
        }

        changed = true;
      });

      return changed ? next : prev;
    });
  }, [projects]);

  const applySuggestedUpdates = useCallback(
    (projectId: string, projectFields: Record<string, string>, suggestedUpdates: Record<string, string>): number => {
      const changedEntries = Object.entries(suggestedUpdates).filter(([fieldId, value]) => {
        const nextValue = value.trim();
        if (!nextValue) {
          return false;
        }

        return (projectFields[fieldId] || '') !== nextValue;
      });

      if (changedEntries.length === 0) {
        return 0;
      }

      updateProjectById(projectId, (project) => {
        const nextFields: Record<string, string> = { ...project.fields };

        changedEntries.forEach(([fieldId, value]) => {
          nextFields[fieldId] = value.trim();
        });

        const stackChangedEntry = changedEntries.find(([fieldId]) => fieldId === 'mainStack');
        if (stackChangedEntry && stackChangedEntry[1] !== project.fields.mainStack) {
          STACK_DEPENDENT_FIELD_IDS.forEach((dependentFieldId) => {
            const providedByAnalyzer = changedEntries.some(([fieldId]) => fieldId === dependentFieldId);
            if (!providedByAnalyzer) {
              nextFields[dependentFieldId] = '';
            }
          });
        }

        return touchProject({
          ...project,
          fields: nextFields,
        });
      });

      return changedEntries.length;
    },
    [updateProjectById]
  );

  const analyzeDescription = useCallback(async () => {
    if (!selectedProject) {
      return;
    }

    const projectId = selectedProject.id;
    const projectFields = { ...selectedProject.fields };
    const source = (projectFields.taskConverterInput || '').trim();
    if (!source) {
      setProjectConverterStatus(projectId, {
        severity: 'warning',
        message: 'Paste a product description to analyze.',
      });
      return;
    }

    const strictFallbackUpdates = analyzeDescriptionToFieldUpdates(source);
    if (projectFields.passportEntity === 'Lead') {
      if (!strictFallbackUpdates.leadName && strictFallbackUpdates.projectName) {
        strictFallbackUpdates.leadName = strictFallbackUpdates.projectName;
      }

      if (!strictFallbackUpdates.leadStatus && strictFallbackUpdates.status) {
        strictFallbackUpdates.leadStatus = strictFallbackUpdates.status;
      }
    }
    const focusedAnalyzerFields = buildFocusedAnalyzerFields(
      source,
      projectFields,
      strictFallbackUpdates
    );
    const currentFieldsForLlm = Object.fromEntries(
      Object.entries({
        ...projectFields,
        ...strictFallbackUpdates,
      }).filter(([fieldId]) => !isAttachmentFieldId(fieldId))
    );

    setProjectAnalyzing(projectId, true);
    setProjectConverterStatus(projectId, {
      severity: 'info',
      message: `Analyzing description with LLM (${focusedAnalyzerFields.length} focused fields)...`,
    });

    try {
      let llmResult: LlmAnalyzeResponse | null = null;
      let llmError: unknown = null;

      try {
        llmResult = await runtimeApi.analyzeDescriptionWithLLM({
          description: source,
          currentFields: currentFieldsForLlm,
          fields: focusedAnalyzerFields,
          model: selectedAiModel || undefined,
        });
      } catch (firstError) {
        llmError = firstError;

        const retryFieldCount = Math.max(
          ANALYZER_MIN_FIELD_COUNT,
          Math.min(24, Math.ceil(focusedAnalyzerFields.length * 0.55))
        );
        const compactFields = focusedAnalyzerFields.slice(0, retryFieldCount);

        if (compactFields.length > 0 && compactFields.length < focusedAnalyzerFields.length) {
          setProjectConverterStatus(projectId, {
            severity: 'info',
            message: `LLM retry with compact field set (${compactFields.length} fields)...`,
          });

          try {
            llmResult = await runtimeApi.analyzeDescriptionWithLLM({
              description: source,
              currentFields: currentFieldsForLlm,
              fields: compactFields,
              model: selectedAiModel || undefined,
            });
            llmError = null;
          } catch (retryError) {
            llmError = retryError;
          }
        }
      }

      if (!llmResult) {
        const fallbackExtractedEntries = Object.entries(strictFallbackUpdates).filter(
          ([, value]) => value.trim().length > 0
        );
        const fallbackActuallyNewEntries = fallbackExtractedEntries.filter(
          ([fieldId, value]) => (projectFields[fieldId] || '') !== value.trim()
        );
        const changedCount = applySuggestedUpdates(projectId, projectFields, strictFallbackUpdates);
        const message = llmError instanceof Error ? llmError.message : 'Unknown error';

        if (changedCount === 0) {
          if (fallbackExtractedEntries.length === 0) {
            setProjectConverterStatus(projectId, {
              severity: 'error',
              message: `LLM analysis failed (${message}), and strict fallback found no validated data.`,
            });
            return;
          }

          if (fallbackActuallyNewEntries.length === 0) {
            const fieldList = fallbackExtractedEntries.map(([fieldId]) => fieldId).slice(0, 8).join(', ');
            setProjectConverterStatus(projectId, {
              severity: 'info',
              message: `LLM analysis failed (${message}). Strict fallback extracted data, but these fields already have the same values: ${fieldList}.`,
            });
            return;
          }

          setProjectConverterStatus(projectId, {
            severity: 'error',
            message: `LLM analysis failed (${message}), and strict fallback found no validated data.`,
          });
          return;
        }

        setProjectConverterStatus(projectId, {
          severity: 'info',
          message: `LLM analysis failed (${message}). Applied strict fallback updates: ${changedCount}.`,
        });
        return;
      }

      const mergedUpdates = {
        ...llmResult.updates,
        ...strictFallbackUpdates,
      };
      const extractedEntries = Object.entries(mergedUpdates).filter(([, value]) => value.trim().length > 0);
      const actuallyNewEntries = extractedEntries.filter(
        ([fieldId, value]) => (projectFields[fieldId] || '') !== value.trim()
      );
      const changedCount = applySuggestedUpdates(projectId, projectFields, mergedUpdates);
      if (changedCount === 0) {
        if (extractedEntries.length === 0) {
          setProjectConverterStatus(projectId, {
            severity: 'info',
            message: `Analysis completed (${llmResult.model}), but no 100% validated data was found in the source.`,
          });
          return;
        }

        if (actuallyNewEntries.length === 0) {
          const fieldList = extractedEntries.map(([fieldId]) => fieldId).slice(0, 8).join(', ');
          setProjectConverterStatus(projectId, {
            severity: 'info',
            message: `Analysis completed (${llmResult.model}). Valid data was extracted, but these fields already have the same values: ${fieldList}.`,
          });
          return;
        }

        setProjectConverterStatus(projectId, {
          severity: 'info',
          message: `Analysis completed (${llmResult.model}), but no 100% validated updates were found.`,
        });
        return;
      }

      setProjectConverterStatus(projectId, {
        severity: 'success',
        message: `Analysis completed (${llmResult.model}). Strict validated fields updated: ${changedCount}.`,
      });
    } finally {
      setProjectAnalyzing(projectId, false);
    }
  }, [
    selectedProject,
    selectedAiModel,
    setProjectAnalyzing,
    setProjectConverterStatus,
    applySuggestedUpdates,
  ]);

  const insertConverterFile = useCallback(async () => {
    if (!selectedProject) {
      return;
    }

    const projectId = selectedProject.id;

    try {
      const fileData = await runtimeApi.openTextFile();

      if (!fileData) {
        setProjectConverterStatus(projectId, {
          severity: 'info',
          message: 'File selection was canceled.',
        });
        return;
      }

      const nextChunk = fileData.content.trim();
      if (!nextChunk) {
        setProjectConverterStatus(projectId, {
          severity: 'warning',
          message: 'The selected file is empty. Nothing to insert.',
        });
        return;
      }

      updateProjectById(projectId, (project) => {
        const previous = project.fields.taskConverterInput || '';
        const prefix = previous.trim();
        const merged = !prefix
          ? nextChunk
          : `${prefix}\n\n---\nSource file: ${fileData.filePath}\n${nextChunk}`;

        return touchProject({
          ...project,
          fields: {
            ...project.fields,
            taskConverterInput: merged,
          },
        });
      });

      setProjectConverterStatus(projectId, {
        severity: 'success',
        message: `File inserted into Task Converter: ${fileData.filePath}`,
      });
    } catch (error) {
      console.error('Failed to insert converter file:', error);
      setProjectConverterStatus(projectId, {
        severity: 'error',
        message: 'Failed to read a file for Task Converter.',
      });
    }
  }, [selectedProject, updateProjectById, setProjectConverterStatus]);

  const clearConverter = useCallback(() => {
    if (!selectedProject) {
      return;
    }

    const projectId = selectedProject.id;

    updateProjectById(projectId, (project) =>
      touchProject({
        ...project,
        fields: {
          ...project.fields,
          taskConverterInput: '',
        },
      })
    );
    setProjectConverterStatus(projectId, null);
  }, [selectedProject, updateProjectById, setProjectConverterStatus]);

  return {
    converterInput,
    selectedConverterStatus,
    isSelectedProjectAnalyzing,
    isAnyProjectAnalyzing,
    analyzingProjectIds,
    clearProjectTaskState,
    analyzeDescription: () => {
      void analyzeDescription();
    },
    insertConverterFile: () => {
      void insertConverterFile();
    },
    clearConverter,
  };
}
