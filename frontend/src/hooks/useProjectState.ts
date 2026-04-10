import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionDefinition } from '../passport-schema';
import { STACK_DEPENDENT_FIELD_IDS, STORAGE_KEY } from '../config';
import { getProjectSections } from '../section-utils';
import { runtimeApi } from '../services/runtime-api';
import {
  createDefaultProject,
  getCompleteness,
  getProjectName,
  loadInitialState,
  normalizePersistedPassportState,
  touchProject,
} from '../project-utils';
import type {
  CompletenessInfo,
  PersistedPassportState,
  ProjectPassport,
} from '../types';

interface UseProjectStateOptions {
  onProjectSelected?: () => void;
}

interface UseProjectStateResult {
  projects: ProjectPassport[];
  selectedProjectId: string;
  selectedProject: ProjectPassport | null;
  searchQuery: string;
  activeProjects: ProjectPassport[];
  archivedProjects: ProjectPassport[];
  completeness: CompletenessInfo | null;
  sections: SectionDefinition[];
  setSearchQuery: (value: string) => void;
  updateProjectById: (projectId: string, updateFn: (project: ProjectPassport) => ProjectPassport) => void;
  updateSelectedProject: (updateFn: (project: ProjectPassport) => ProjectPassport) => void;
  createPassport: (entity?: 'Project' | 'Lead') => void;
  selectProject: (projectId: string) => void;
  archiveChange: (projectId: string, archived: boolean) => void;
  deleteProject: (projectId: string) => boolean;
  fieldChange: (fieldId: string, value: string) => void;
}

const LOCAL_STORAGE_PERSIST_DEBOUNCE_MS = 300;
const BACKEND_PERSIST_DEBOUNCE_MS = 900;

export function useProjectState({ onProjectSelected }: UseProjectStateOptions = {}): UseProjectStateResult {
  const initialLocalState = useMemo(() => loadInitialState(), []);
  const [projects, setProjects] = useState<ProjectPassport[]>(initialLocalState.projects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialLocalState.selectedProjectId);
  const [isBackendStateReady, setIsBackendStateReady] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      const fallback = projects.find((project) => !project.archived) || projects[0];
      setSelectedProjectId(fallback.id);
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    let isCancelled = false;

    const hydrateStateFromBackend = async () => {
      try {
        const backendState = await runtimeApi.loadPassportState();
        const normalized = normalizePersistedPassportState(backendState);

        if (normalized && normalized.projects.length > 0) {
          if (!isCancelled) {
            setProjects(normalized.projects);
            setSelectedProjectId(normalized.selectedProjectId);
          }
          return;
        }

        await runtimeApi.savePassportState({
          projects: initialLocalState.projects,
          selectedProjectId: initialLocalState.selectedProjectId,
        });
      } catch (error) {
        console.error('Failed to hydrate state from backend storage:', error);
      } finally {
        if (!isCancelled) {
          setIsBackendStateReady(true);
        }
      }
    };

    void hydrateStateFromBackend();

    return () => {
      isCancelled = true;
    };
  }, [initialLocalState.projects, initialLocalState.selectedProjectId]);

  useEffect(() => {
    const payload: PersistedPassportState = {
      projects,
      selectedProjectId,
    };
    const serializedPayload = JSON.stringify(payload);

    const localTimeout = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializedPayload);
      } catch (error) {
        console.error('Failed to persist state to localStorage (possibly quota exceeded):', error);
      }
    }, LOCAL_STORAGE_PERSIST_DEBOUNCE_MS);

    if (!isBackendStateReady) {
      return () => {
        window.clearTimeout(localTimeout);
      };
    }

    const backendTimeout = window.setTimeout(() => {
      void runtimeApi.savePassportState(payload).catch((error) => {
        console.error('Failed to save state to backend storage:', error);
      });
    }, BACKEND_PERSIST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(localTimeout);
      window.clearTimeout(backendTimeout);
    };
  }, [projects, selectedProjectId, isBackendStateReady]);

  useEffect(() => {
    const suffix = selectedProject ? getProjectName(selectedProject) : 'No Project Selected';
    runtimeApi.setTitle(`Project Passport - ${suffix}`);
  }, [selectedProject]);

  const activeProjects = useMemo(
    () =>
      projects.filter((project) => {
        return !project.archived;
      }),
    [projects]
  );

  const archivedProjects = useMemo(
    () =>
      projects.filter((project) => {
        return project.archived;
      }),
    [projects]
  );

  const completeness = useMemo(
    () => (selectedProject ? getCompleteness(selectedProject.fields) : null),
    [selectedProject]
  );

  const sections = useMemo<SectionDefinition[]>(() => {
    if (!selectedProject) {
      return [];
    }

    return getProjectSections(selectedProject.fields);
  }, [selectedProject]);

  const updateProjectById = useCallback(
    (projectId: string, updateFn: (project: ProjectPassport) => ProjectPassport) => {
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          return updateFn(project);
        })
      );
    },
    []
  );

  const updateSelectedProject = useCallback(
    (updateFn: (project: ProjectPassport) => ProjectPassport) => {
      if (!selectedProjectId) {
        return;
      }

      updateProjectById(selectedProjectId, updateFn);
    },
    [selectedProjectId, updateProjectById]
  );

  const createPassport = useCallback((entity: 'Project' | 'Lead' = 'Project') => {
    const next = createDefaultProject(entity);
    setProjects((prevProjects) => [next, ...prevProjects]);
    setSelectedProjectId(next.id);
  }, []);

  const selectProject = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      onProjectSelected?.();
    },
    [onProjectSelected]
  );

  const archiveChange = useCallback((projectId: string, archived: boolean) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return touchProject({
          ...project,
          archived,
        });
      })
    );
  }, []);

  const deleteProject = useCallback(
    (projectId: string): boolean => {
      const project = projects.find((item) => item.id === projectId);
      if (!project) {
        return false;
      }

      const confirmed = window.confirm(`Delete passport "${getProjectName(project)}"?`);
      if (!confirmed) {
        return false;
      }

      const remaining = projects.filter((item) => item.id !== projectId);
      const nextProjects = remaining.length > 0 ? remaining : [createDefaultProject('Project')];

      setProjects(nextProjects);

      const selectedStillExists = nextProjects.some((item) => item.id === selectedProjectId);
      if (!selectedStillExists) {
        const fallback = nextProjects.find((item) => !item.archived) || nextProjects[0];
        setSelectedProjectId(fallback.id);
      }

      return true;
    },
    [projects, selectedProjectId]
  );

  const fieldChange = useCallback(
    (fieldId: string, value: string) => {
      updateSelectedProject((project) => {
        const previousValue = project.fields[fieldId] || '';
        if (previousValue === value) {
          return project;
        }

        const nextFields: Record<string, string> = {
          ...project.fields,
          [fieldId]: value,
        };

        if (fieldId === 'mainStack') {
          STACK_DEPENDENT_FIELD_IDS.forEach((dependentFieldId) => {
            nextFields[dependentFieldId] = '';
          });
        }

        return touchProject({
          ...project,
          fields: nextFields,
        });
      });
    },
    [updateSelectedProject]
  );

  return {
    projects,
    selectedProjectId,
    selectedProject,
    searchQuery,
    activeProjects,
    archivedProjects,
    completeness,
    sections,
    setSearchQuery,
    updateProjectById,
    updateSelectedProject,
    createPassport,
    selectProject,
    archiveChange,
    deleteProject,
    fieldChange,
  };
}
