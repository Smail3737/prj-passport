import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { keyframes } from '@mui/system';
import type { PaletteMode } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { formatDisplayDate, getProjectName } from '../project-utils';
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  canRoleViewEntity,
  isVisibleForDepartment,
  type Department,
  type RolePermissions,
  type UserRole,
} from '../access-control';
import type { ProjectPassport } from '../types';

const analyzingPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(80, 177, 162, 0.32); }
  70% { box-shadow: 0 0 0 9px rgba(80, 177, 162, 0); }
  100% { box-shadow: 0 0 0 0 rgba(80, 177, 162, 0); }
`;

const analyzingDotPulse = keyframes`
  0%, 100% { transform: scale(0.9); opacity: 0.45; }
  50% { transform: scale(1.15); opacity: 1; }
`;

interface SidebarProps {
  themeMode: PaletteMode;
  searchQuery: string;
  selectedProjectId: string;
  activeProjects: ProjectPassport[];
  archivedProjects: ProjectPassport[];
  analyzingProjectIds: Record<string, true>;
  currentRole: UserRole;
  currentDepartment: Department;
  permissions: RolePermissions;
  onToggleTheme: () => void;
  onRoleChange: (role: UserRole) => void;
  onDepartmentChange: (department: Department) => void;
  onSearchChange: (value: string) => void;
  onCreatePassport: (entity?: 'Project' | 'Lead') => void;
  onSelectProject: (projectId: string) => void;
  onArchiveChange: (projectId: string, archived: boolean) => void;
  onDeleteProject: (projectId: string) => void;
}

type SidebarViewMode = 'all' | 'project' | 'lead';

function getDefaultViewMode(permissions: RolePermissions): SidebarViewMode {
  if (permissions.canViewLeads && permissions.canViewProjects) {
    return 'all';
  }

  if (permissions.canViewProjects) {
    return 'project';
  }

  return 'lead';
}

export function Sidebar({
  themeMode,
  searchQuery,
  selectedProjectId,
  activeProjects,
  archivedProjects,
  analyzingProjectIds,
  currentRole,
  currentDepartment,
  permissions,
  onToggleTheme,
  onRoleChange,
  onDepartmentChange,
  onSearchChange,
  onCreatePassport,
  onSelectProject,
  onArchiveChange,
  onDeleteProject,
}: SidebarProps): JSX.Element {
  const [viewMode, setViewMode] = useState<SidebarViewMode>(getDefaultViewMode(permissions));
  const isLead = (project: ProjectPassport): boolean => project.fields.passportEntity === 'Lead';

  const availableViewModes = useMemo<SidebarViewMode[]>(() => {
    if (permissions.canViewLeads && permissions.canViewProjects) {
      return ['all', 'project', 'lead'];
    }

    if (permissions.canViewProjects) {
      return ['project'];
    }

    return ['lead'];
  }, [permissions.canViewLeads, permissions.canViewProjects]);

  useEffect(() => {
    if (!availableViewModes.includes(viewMode)) {
      setViewMode(availableViewModes[0]);
    }
  }, [availableViewModes, viewMode]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filterBySearch = (project: ProjectPassport): boolean => {
    if (!normalizedQuery) {
      return true;
    }

    return getProjectName(project).toLowerCase().includes(normalizedQuery);
  };

  const filterByAccess = (project: ProjectPassport): boolean => {
    const entity = isLead(project) ? 'Lead' : 'Project';

    if (!canRoleViewEntity(currentRole, entity)) {
      return false;
    }

    return isVisibleForDepartment(currentRole, entity, currentDepartment, project.fields.department || '');
  };

  const activeLeads = activeProjects.filter((project) => isLead(project) && filterByAccess(project));
  const activeProjectPassports = activeProjects.filter((project) => !isLead(project) && filterByAccess(project));
  const archivedLeads = archivedProjects.filter((project) => isLead(project) && filterByAccess(project));
  const archivedProjectPassports = archivedProjects.filter((project) => !isLead(project) && filterByAccess(project));

  const showLeads = (viewMode === 'all' || viewMode === 'lead') && permissions.canViewLeads;
  const showProjects = (viewMode === 'all' || viewMode === 'project') && permissions.canViewProjects;

  const visibleActiveLeads = activeLeads.filter(filterBySearch);
  const visibleActiveProjects = activeProjectPassports.filter(filterBySearch);
  const visibleArchivedLeads = archivedLeads.filter(filterBySearch);
  const visibleArchivedProjects = archivedProjectPassports.filter(filterBySearch);

  const renderProjectCard = (project: ProjectPassport, archived: boolean): JSX.Element => {
    const selected = project.id === selectedProjectId;
    const isAnalyzing = Boolean(analyzingProjectIds[project.id]);
    const leadEntity = isLead(project);
    const statusLabel = leadEntity ? project.fields.leadStatus || 'New' : project.fields.status || 'No status';

    return (
      <Card
        key={project.id}
        variant="outlined"
        sx={{
          border: selected
            ? '1px solid #50B1A2'
            : isAnalyzing
              ? '1px solid #50B1A2'
              : undefined,
          animation: isAnalyzing ? `${analyzingPulse} 1.4s ease-in-out infinite` : undefined,
        }}
      >
        <CardActionArea onClick={() => onSelectProject(project.id)}>
          <CardContent sx={{ pb: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Typography variant="subtitle2">{getProjectName(project)}</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {isAnalyzing && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      animation: `${analyzingDotPulse} 0.9s ease-in-out infinite`,
                    }}
                  />
                )}
                <Chip
                  size="small"
                  color={isAnalyzing ? 'primary' : 'default'}
                  label={isAnalyzing ? 'Analyzing...' : statusLabel}
                />
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {leadEntity
                ? `Source: ${project.fields.leadSource || 'Not specified'}`
                : project.fields.mainStack || 'No stack'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Department: {project.fields.department || 'Not selected'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Updated: {formatDisplayDate(project.updatedAt)}
            </Typography>
          </CardContent>
        </CardActionArea>
        {(permissions.canArchive || permissions.canDelete) && (
          <>
            <Divider />
            <Stack direction="row" spacing={1} sx={{ p: 1 }}>
              {permissions.canArchive && (
                <Button
                  size="small"
                  fullWidth
                  variant="outlined"
                  onClick={() => onArchiveChange(project.id, !archived)}
                >
                  {archived ? 'Restore' : 'Archive'}
                </Button>
              )}
              {permissions.canDelete && (
                <Button
                  size="small"
                  fullWidth
                  color="secondary"
                  variant="contained"
                  onClick={() => onDeleteProject(project.id)}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </>
        )}
      </Card>
    );
  };

  const renderCreateButtons = (): JSX.Element => {
    if (!permissions.canCreateLead && !permissions.canCreateProject) {
      return (
        <Alert severity="info" variant="outlined">
          Current role is read-only for creating new entities.
        </Alert>
      );
    }

    if (viewMode === 'all') {
      return (
        <Stack direction="row" spacing={1}>
          {permissions.canCreateProject && (
            <Button variant="contained" fullWidth onClick={() => onCreatePassport('Project')}>
              New Project
            </Button>
          )}
          {permissions.canCreateLead && (
            <Button variant="outlined" fullWidth onClick={() => onCreatePassport('Lead')}>
              New Lead
            </Button>
          )}
        </Stack>
      );
    }

    if (viewMode === 'project') {
      return permissions.canCreateProject ? (
        <Button variant="contained" fullWidth onClick={() => onCreatePassport('Project')}>
          New Project
        </Button>
      ) : (
        <Alert severity="info" variant="outlined">
          Current role cannot create projects.
        </Alert>
      );
    }

    return permissions.canCreateLead ? (
      <Button variant="contained" fullWidth onClick={() => onCreatePassport('Lead')}>
        New Lead
      </Button>
    ) : (
      <Alert severity="info" variant="outlined">
        Current role cannot create leads.
      </Alert>
    );
  };

  return (
    <Paper
      square
      sx={{
        borderRight: {
          lg: (theme) => `1px solid ${theme.palette.divider}`,
        },
        borderBottom: {
          xs: (theme) => `1px solid ${theme.palette.divider}`,
          lg: 'none',
        },
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxHeight: {
          xs: '50vh',
          lg: '100vh',
        },
        overflow: 'auto',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Box
            component="img"
            src="/favicon.svg"
            alt="Project Passport"
            sx={{ width: 42, height: 42, display: "block" }}
          />
        </Box>
        <Tooltip title={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          <IconButton
            onClick={onToggleTheme}
            color="primary"
            aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {themeMode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={1}>
        <TextField
          select
          size="small"
          label="Role"
          value={currentRole}
          onChange={(event) => onRoleChange(event.target.value as UserRole)}
        >
          {ROLE_OPTIONS.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Department"
          value={currentDepartment}
          onChange={(event) => onDepartmentChange(event.target.value as Department)}
        >
          {DEPARTMENT_OPTIONS.map((department) => (
            <MenuItem key={department} value={department}>
              {department}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack spacing={1}>
        <TextField
          size="small"
          label="Search Passports"
          placeholder="Search by name"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {renderCreateButtons()}
        <ToggleButtonGroup
          size="small"
          exclusive
          fullWidth
          value={viewMode}
          onChange={(_event, value: SidebarViewMode | null) => {
            if (value && availableViewModes.includes(value)) {
              setViewMode(value);
            }
          }}
        >
          {availableViewModes.includes('all') && <ToggleButton value="all">All</ToggleButton>}
          {availableViewModes.includes('project') && <ToggleButton value="project">Project</ToggleButton>}
          {availableViewModes.includes('lead') && <ToggleButton value="lead">Lead</ToggleButton>}
        </ToggleButtonGroup>
      </Stack>

      <Divider />

      {showLeads && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Active Leads ({visibleActiveLeads.length})
          </Typography>
          <Stack spacing={1}>
            {visibleActiveLeads.length === 0 ? (
              <Alert severity="info" variant="outlined">
                No active leads.
              </Alert>
            ) : (
              visibleActiveLeads.map((project) => renderProjectCard(project, false))
            )}
          </Stack>
        </Box>
      )}

      {showProjects && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Active Projects ({visibleActiveProjects.length})
          </Typography>
          <Stack spacing={1}>
            {visibleActiveProjects.length === 0 ? (
              <Alert severity="info" variant="outlined">
                No active passports.
              </Alert>
            ) : (
              visibleActiveProjects.map((project) => renderProjectCard(project, false))
            )}
          </Stack>
        </Box>
      )}

      {showLeads && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Archived Leads ({visibleArchivedLeads.length})
          </Typography>
          <Stack spacing={1}>
            {visibleArchivedLeads.length === 0 ? (
              <Alert severity="info" variant="outlined">
                No archived leads.
              </Alert>
            ) : (
              visibleArchivedLeads.map((project) => renderProjectCard(project, true))
            )}
          </Stack>
        </Box>
      )}

      {showProjects && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Archived Projects ({visibleArchivedProjects.length})
          </Typography>
          <Stack spacing={1}>
            {visibleArchivedProjects.length === 0 ? (
              <Alert severity="info" variant="outlined">
                No archived passports.
              </Alert>
            ) : (
              visibleArchivedProjects.map((project) => renderProjectCard(project, true))
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
