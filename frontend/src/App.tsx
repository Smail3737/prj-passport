import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CssBaseline, Paper, Stack, ThemeProvider, Typography } from '@mui/material';
import { Sidebar } from './components/Sidebar';
import { ProjectHeaderCard } from './components/ProjectHeaderCard';
import { TaskConverterPanel } from './components/TaskConverterPanel';
import { CompletenessCard } from './components/CompletenessCard';
import { SectionsPanel } from './components/SectionsPanel';
import { PromptDialog } from './components/PromptDialog';
import { useAppTheme } from './hooks/useAppTheme';
import { useFieldNavigator } from './hooks/useFieldNavigator';
import { useProjectState } from './hooks/useProjectState';
import { useAiRuntime } from './hooks/useAiRuntime';
import { useTaskConverter } from './hooks/useTaskConverter';
import { useExportActions } from './hooks/useExportActions';
import { usePromptDialog } from './hooks/usePromptDialog';
import {
  ACCESS_DEPARTMENT_STORAGE_KEY,
  ACCESS_ROLE_STORAGE_KEY,
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  canRoleEditField,
  canRoleViewEntity,
  getRolePermissions,
  isVisibleForDepartment,
  type Department,
  type UserRole,
} from './access-control';
import { JSX } from 'react/jsx-runtime';

function loadRole(): UserRole {
  try {
    const stored = localStorage.getItem(ACCESS_ROLE_STORAGE_KEY);
    if (stored && ROLE_OPTIONS.includes(stored as UserRole)) {
      return stored as UserRole;
    }
  } catch (error) {
    console.error('Failed to load stored role:', error);
  }

  return 'Admin';
}

function loadDepartment(): Department {
  try {
    const stored = localStorage.getItem(ACCESS_DEPARTMENT_STORAGE_KEY);
    if (stored && DEPARTMENT_OPTIONS.includes(stored as Department)) {
      return stored as Department;
    }
  } catch (error) {
    console.error('Failed to load stored department:', error);
  }

  return 'Development';
}

export function App(): JSX.Element {
  const { themeMode, toggleTheme, theme } = useAppTheme();
  const { highlightedFieldId, clearHighlight, jumpToField, registerFieldRef } = useFieldNavigator();

  const [currentRole, setCurrentRole] = useState<UserRole>(() => loadRole());
  const [currentDepartment, setCurrentDepartment] = useState<Department>(() => loadDepartment());

  const permissions = useMemo(() => getRolePermissions(currentRole), [currentRole]);

  useEffect(() => {
    localStorage.setItem(ACCESS_ROLE_STORAGE_KEY, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(ACCESS_DEPARTMENT_STORAGE_KEY, currentDepartment);
  }, [currentDepartment]);

  const {
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
    createPassport,
    selectProject,
    archiveChange,
    deleteProject,
    fieldChange,
  } = useProjectState({
    onProjectSelected: clearHighlight,
  });

  const {
    selectedAiModel,
    availableAiModels,
    isAiAvailable,
    aiConnectionStatus,
    changeAiModel,
  } = useAiRuntime();

  const {
    converterInput,
    selectedConverterStatus,
    isSelectedProjectAnalyzing,
    isAnyProjectAnalyzing,
    analyzingProjectIds,
    clearProjectTaskState,
    analyzeDescription,
    insertConverterFile,
    clearConverter,
  } = useTaskConverter({
    projects,
    selectedProject,
    selectedAiModel,
    updateProjectById,
  });

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const entity = selectedProject.fields.passportEntity === 'Lead' ? 'Lead' : 'Project';

    const isAllowed =
      canRoleViewEntity(currentRole, entity) &&
      isVisibleForDepartment(currentRole, entity, currentDepartment, selectedProject.fields.department || '');

    if (isAllowed) {
      return;
    }

    const fallback = projects.find((project) => {
      const projectEntity = project.fields.passportEntity === 'Lead' ? 'Lead' : 'Project';
      return (
        canRoleViewEntity(currentRole, projectEntity) &&
        isVisibleForDepartment(currentRole, projectEntity, currentDepartment, project.fields.department || '')
      );
    });

    if (fallback) {
      selectProject(fallback.id);
    }
  }, [currentDepartment, currentRole, projects, selectProject, selectedProject]);

  const canEditSelectedField = useCallback(
    (fieldId: string): boolean => {
      if (!selectedProject) {
        return false;
      }

      const entity = selectedProject.fields.passportEntity === 'Lead' ? 'Lead' : 'Project';
      return canRoleEditField(currentRole, entity, fieldId);
    },
    [currentRole, selectedProject]
  );

  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      if (!canEditSelectedField(fieldId)) {
        return;
      }

      fieldChange(fieldId, value);
    },
    [canEditSelectedField, fieldChange]
  );

  const handleCreatePassport = useCallback(
    (entity: 'Project' | 'Lead' = 'Project') => {
      if (entity === 'Project' && !permissions.canCreateProject) {
        return;
      }

      if (entity === 'Lead' && !permissions.canCreateLead) {
        return;
      }

      createPassport(entity);
    },
    [createPassport, permissions.canCreateLead, permissions.canCreateProject]
  );

  const handleArchiveChange = useCallback(
    (projectId: string, archived: boolean) => {
      if (!permissions.canArchive) {
        return;
      }

      archiveChange(projectId, archived);
    },
    [archiveChange, permissions.canArchive]
  );

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (!permissions.canDelete) {
        return;
      }

      const deleted = deleteProject(projectId);
      if (deleted) {
        clearProjectTaskState(projectId);
      }
    },
    [clearProjectTaskState, deleteProject, permissions.canDelete]
  );

  const { exportTxt, exportJson, exportPdf, exportDocx } = useExportActions({
    selectedProject,
    sections,
    completeness,
  });

  const canViewSelectedProject =
    selectedProject &&
    canRoleViewEntity(
      currentRole,
      selectedProject.fields.passportEntity === 'Lead' ? 'Lead' : 'Project'
    ) &&
    isVisibleForDepartment(
      currentRole,
      selectedProject.fields.passportEntity === 'Lead' ? 'Lead' : 'Project',
      currentDepartment,
      selectedProject.fields.department || ''
    );

  const {
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
    generateAiPromptWithLlm,
    regenerateAiPromptWithLlm,
    copyAiPrompt,
    downloadAiPrompt,
  } = usePromptDialog({
    selectedProject,
    sections,
    completeness,
    isAiAvailable,
    selectedAiModel,
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '350px minmax(0, 1fr)',
          },
        }}
      >
        <Sidebar
          themeMode={themeMode}
          searchQuery={searchQuery}
          selectedProjectId={selectedProjectId}
          activeProjects={activeProjects}
          archivedProjects={archivedProjects}
          analyzingProjectIds={analyzingProjectIds}
          currentRole={currentRole}
          currentDepartment={currentDepartment}
          permissions={permissions}
          onToggleTheme={toggleTheme}
          onRoleChange={setCurrentRole}
          onDepartmentChange={setCurrentDepartment}
          onSearchChange={setSearchQuery}
          onCreatePassport={handleCreatePassport}
          onSelectProject={selectProject}
          onArchiveChange={handleArchiveChange}
          onDeleteProject={handleDeleteProject}
        />

        <Box sx={{ p: { xs: 1.5, md: 2.5 }, overflow: 'auto', maxHeight: '100vh' }}>
          {!selectedProject || !canViewSelectedProject ? (
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6">No project selected</Typography>
              <Typography color="text.secondary">Create a new passport or select one from the list.</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              <ProjectHeaderCard
                selectedProject={selectedProject}
                isAiAvailable={isAiAvailable}
                canEditField={canEditSelectedField}
                onFieldChange={handleFieldChange}
                onOpenPromptDialog={openPromptDialog}
                onExportTxt={exportTxt}
                onExportJson={exportJson}
                onExportPdf={exportPdf}
                onExportDocx={exportDocx}
              />

              <TaskConverterPanel
                  selectedAiModel={selectedAiModel}
                  availableAiModels={availableAiModels}
                  isAnyProjectAnalyzing={isAnyProjectAnalyzing}
                  aiConnectionStatus={aiConnectionStatus}
                  converterInput={converterInput}
                  isSelectedProjectAnalyzing={isSelectedProjectAnalyzing}
                  selectedConverterStatus={selectedConverterStatus}
                  onAiModelChange={changeAiModel}
                  onConverterInputChange={(value) => handleFieldChange('taskConverterInput', value)}
                  onAnalyzeDescription={analyzeDescription}
                  onInsertConverterFile={insertConverterFile}
                  onClearConverter={clearConverter}
                />

              {completeness && <CompletenessCard completeness={completeness} onJumpToField={jumpToField} />}

              <SectionsPanel
                sections={sections}
                fields={selectedProject.fields}
                highlightedFieldId={highlightedFieldId}
                onFieldChange={handleFieldChange}
                registerFieldRef={registerFieldRef}
                canEditField={canEditSelectedField}
              />
            </Stack>
          )}
        </Box>
      </Box>

      <PromptDialog
        open={promptDialogOpen}
        promptTemplate={promptTemplate}
        promptTemplateOptions={promptTemplateOptions}
        promptStatus={promptStatus}
        isAiAvailable={isAiAvailable}
        promptText={promptText}
        isPromptGenerating={isPromptGenerating}
        regenerationPresetOptions={regenerationPresetOptions}
        selectedRegenerationPreset={selectedRegenerationPreset}
        regenerationCustomPrompt={regenerationCustomPrompt}
        onClose={closePromptDialog}
        onPromptTemplateChange={setPromptTemplate}
        onRegenerationPresetChange={setSelectedRegenerationPreset}
        onRegenerationCustomPromptChange={setRegenerationCustomPrompt}
        onGenerateWithAi={generateAiPromptWithLlm}
        onRegenerateWithAi={regenerateAiPromptWithLlm}
        onCopy={copyAiPrompt}
        onDownload={downloadAiPrompt}
      />
    </ThemeProvider>
  );
}
