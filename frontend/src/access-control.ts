export type PassportEntity = 'Project' | 'Lead';

export type UserRole = 'Admin' | 'Manager' | 'Developer' | 'Designer';

export type Department = 'Development' | 'UI/UX';

export interface RolePermissions {
  canCreateProject: boolean;
  canCreateLead: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canUseTaskConverter: boolean;
  canViewProjects: boolean;
  canViewLeads: boolean;
}

export const ACCESS_ROLE_STORAGE_KEY = 'project-passport-access-role-v1';
export const ACCESS_DEPARTMENT_STORAGE_KEY = 'project-passport-access-department-v1';

export const ROLE_OPTIONS: UserRole[] = ['Admin', 'Manager', 'Developer', 'Designer'];
export const DEPARTMENT_OPTIONS: Department[] = ['Development', 'UI/UX'];

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    canCreateProject: true,
    canCreateLead: true,
    canArchive: true,
    canDelete: true,
    canUseTaskConverter: true,
    canViewProjects: true,
    canViewLeads: true,
  },
  Manager: {
    canCreateProject: true,
    canCreateLead: true,
    canArchive: true,
    canDelete: true,
    canUseTaskConverter: true,
    canViewProjects: true,
    canViewLeads: true,
  },
  Developer: {
    canCreateProject: false,
    canCreateLead: false,
    canArchive: false,
    canDelete: false,
    canUseTaskConverter: true,
    canViewProjects: true,
    canViewLeads: false,
  },
  Designer: {
    canCreateProject: false,
    canCreateLead: false,
    canArchive: false,
    canDelete: false,
    canUseTaskConverter: true,
    canViewProjects: true,
    canViewLeads: false,
  },
};

const TECHNICAL_PROJECT_FIELDS = new Set<string>([
  'status',
  'priority',
  'currentStage',
  'mainStack',
  'secondaryStack',
  'platform',
  'hostingDeployment',
  'database',
  'cms',
  'authStrategy',
  'storage',
  'apiType',
  'integrations',
  'repositoryUrl',
  'docsUrl',
  'stagingUrl',
  'productionUrl',
  'adminUrl',
  'apiBaseUrl',
  'runInstallCommand',
  'runStartCommand',
  'runTestCommand',
  'runBuildCommand',
  'secretStorageReference',
  'vaultLink',
  'accessNotes',
  'testAssignmentTitle',
  'testAssignmentSourceUrl',
  'testAssignmentStatus',
  'testAssignmentEstimate',
  'testAssignmentSubmissionFormat',
  'testAssignmentDeliverables',
  'testAssignmentEvaluationCriteria',
  'testAssignmentConstraints',
  'projectAttachments',
]);

const TECHNICAL_FIELD_PREFIXES = [
  'wp',
  'react',
  'next',
  'rn',
  'electron',
  'fullstack',
  'vercel',
  'netlify',
  'cpanel',
  'shared',
  'vps',
  'aws',
  'firebase',
  'render',
  'railway',
  'eas',
  'store',
  'desktopDist',
];

const DESIGN_PROJECT_FIELDS = new Set<string>([
  'projectName',
  'client',
  'communicationChannel',
  'communicatorPeople',
  'responsiblePeople',
  'department',
  'projectType',
  'businessGoal',
  'scopeIn',
  'scopeOut',
  'definitionOfDone',
  'acceptanceCriteria',
  'designTool',
  'designToolUrl',
  'projectAttachments',
]);

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

function isTechnicalProjectField(fieldId: string): boolean {
  if (TECHNICAL_PROJECT_FIELDS.has(fieldId)) {
    return true;
  }

  return TECHNICAL_FIELD_PREFIXES.some((prefix) => fieldId.startsWith(prefix));
}

export function canRoleEditField(role: UserRole, entity: PassportEntity, fieldId: string): boolean {
  if (role === 'Admin' || role === 'Manager') {
    return true;
  }

  if (entity === 'Lead') {
    return false;
  }

  if (role === 'Developer') {
    return isTechnicalProjectField(fieldId);
  }

  if (role === 'Designer') {
    return DESIGN_PROJECT_FIELDS.has(fieldId);
  }

  return false;
}

export function canRoleViewEntity(role: UserRole, entity: PassportEntity): boolean {
  if (role === 'Developer' || role === 'Designer') {
    return entity === 'Project';
  }

  return true;
}

export function getRolePermissionLabels(role: UserRole): string[] {
  if (role === 'Admin') {
    return ['All permissions'];
  }

  if (role === 'Manager') {
    return ['Create Project', 'Create Lead', 'Edit Project', 'Edit Lead'];
  }

  if (role === 'Developer') {
    return ['Read all projects', 'Edit technical project documentation'];
  }

  if (role === 'Designer') {
    return ['Read all projects', 'Edit UI/UX and design fields'];
  }

  return ['Read-only access'];
}

export function isVisibleForDepartment(
  role: UserRole,
  entity: PassportEntity,
  selectedDepartment: Department,
  projectDepartment: string
): boolean {
  if (role === 'Admin' || role === 'Manager') {
    return true;
  }

  if (entity === 'Lead') {
    return true;
  }

  if (!selectedDepartment) {
    return true;
  }

  if (!projectDepartment.trim()) {
    return true;
  }

  return projectDepartment === selectedDepartment;
}
