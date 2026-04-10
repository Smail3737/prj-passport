export type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'url' | 'files' | 'people';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: SelectOption[];
  required?: boolean;
  readOnly?: boolean;
  layout?: 'half' | 'full';
  helperText?: string;
  rerenderOnChange?: boolean;
}

export interface SectionDefinition {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  fields: FieldDefinition[];
}

export interface ImportantFieldDefinition {
  id: string;
  label: string;
}

const YES_NO_OPTIONS: SelectOption[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Discovery', label: 'Discovery' },
  { value: 'Planning', label: 'Planning' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'QA', label: 'QA' },
  { value: 'Blocked', label: 'Blocked' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Done', label: 'Done' },
];

const PROJECT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Test Assignment', label: 'Test Assignment' },
  { value: 'SaaS Product', label: 'SaaS Product' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Mobile Product', label: 'Mobile Product' },
  { value: 'Desktop Product', label: 'Desktop Product' },
  { value: 'Full-stack System', label: 'Full-stack System' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const DESIGN_TOOL_OPTIONS: SelectOption[] = [
  { value: 'Figma', label: 'Figma' },
  { value: 'Lovable', label: 'Lovable' },
  { value: 'Other', label: 'Other' },
];

const MAIN_STACK_OPTIONS: SelectOption[] = [
  { value: 'WordPress', label: 'WordPress' },
  { value: 'React', label: 'React' },
  { value: 'Next.js', label: 'Next.js' },
  { value: 'React Native', label: 'React Native' },
  { value: 'Electron', label: 'Electron' },
  { value: 'Generic Full-stack', label: 'Generic Full-stack' },
];

const PLATFORM_OPTIONS: SelectOption[] = [
  { value: 'Web', label: 'Web' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Cross-platform', label: 'Cross-platform' },
];

const HOSTING_OPTIONS: SelectOption[] = [
  { value: 'Vercel', label: 'Vercel' },
  { value: 'Netlify', label: 'Netlify' },
  { value: 'cPanel', label: 'cPanel' },
  { value: 'Shared Hosting', label: 'Shared Hosting' },
  { value: 'VPS', label: 'VPS' },
  { value: 'AWS', label: 'AWS' },
  { value: 'Firebase', label: 'Firebase' },
  { value: 'Render', label: 'Render' },
  { value: 'Railway', label: 'Railway' },
  { value: 'Expo EAS', label: 'Expo EAS' },
  { value: 'App Store / Play Store', label: 'App Store / Play Store' },
  { value: 'Desktop Distribution', label: 'Desktop Distribution' },
];

const API_TYPE_OPTIONS: SelectOption[] = [
  { value: 'REST', label: 'REST' },
  { value: 'GraphQL', label: 'GraphQL' },
  { value: 'tRPC', label: 'tRPC' },
  { value: 'RPC', label: 'RPC' },
  { value: 'Mixed', label: 'Mixed' },
];

const CURRENT_STAGE_OPTIONS: SelectOption[] = [
  { value: 'Discovery', label: 'Discovery' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Implementation', label: 'Implementation' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Release', label: 'Release' },
  { value: 'Maintenance', label: 'Maintenance' },
];

const PASSPORT_TEMPLATE_OPTIONS: SelectOption[] = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Test Assignment', label: 'Test Assignment' },
];

const TEST_ASSIGNMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Completed', label: 'Completed' },
];

const TEST_ASSIGNMENT_SUBMISSION_FORMAT_OPTIONS: SelectOption[] = [
  { value: 'Repository', label: 'Repository' },
  { value: 'Repository + Live Demo', label: 'Repository + Live Demo' },
  { value: 'Archive (.zip)', label: 'Archive (.zip)' },
  { value: 'Document / Slides', label: 'Document / Slides' },
  { value: 'Other', label: 'Other' },
];

const LEAD_STATUS_OPTIONS: SelectOption[] = [
  { value: 'New', label: 'New' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' },
];

const LEAD_SOURCE_OPTIONS: SelectOption[] = [
  { value: 'Referral', label: 'Referral' },
  { value: 'Upwork', label: 'Upwork' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Website', label: 'Website' },
  { value: 'Cold Outreach', label: 'Cold Outreach' },
  { value: 'Other', label: 'Other' },
];

const TEAM_MEMBER_OPTIONS: SelectOption[] = [
  { value: 'Mykhailo Demianenko', label: 'Mykhailo Demianenko' },
  { value: 'Olena Kovalenko', label: 'Olena Kovalenko' },
  { value: 'Andrii Shevchenko', label: 'Andrii Shevchenko' },
  { value: 'Iryna Bondar', label: 'Iryna Bondar' },
  { value: 'Dmytro Koval', label: 'Dmytro Koval' },
  { value: 'Yuliia Melnyk', label: 'Yuliia Melnyk' },
];

export const BASE_SECTIONS: SectionDefinition[] = [
  {
    id: 'passport-header',
    title: 'Passport Header',
    fields: [
      {
        id: 'projectName',
        label: 'Project Name',
        type: 'text',
        required: true,
        placeholder: 'Project Passport',
        rerenderOnChange: true,
      },
      {
        id: 'passportTemplate',
        label: 'Passport Template',
        type: 'select',
        options: PASSPORT_TEMPLATE_OPTIONS,
        required: true,
        rerenderOnChange: true,
      },
      { id: 'client', label: 'Client', type: 'text', placeholder: 'Client name' },
      {
        id: 'communicationChannel',
        label: 'Communication Channel',
        type: 'text',
        placeholder: 'Email / phone / Telegram',
      },
      {
        id: 'communicatorPeople',
        label: 'Communicator(s)',
        type: 'people',
        options: TEAM_MEMBER_OPTIONS,
        placeholder: 'Select communicators',
      },
      {
        id: 'responsiblePeople',
        label: 'Responsible Person(s)',
        type: 'people',
        options: TEAM_MEMBER_OPTIONS,
        placeholder: 'Select responsible people',
      },
      {
        id: 'designTool',
        label: 'Design Tool',
        type: 'select',
        options: DESIGN_TOOL_OPTIONS,
      },
      {
        id: 'designToolUrl',
        label: 'Design Tool Link',
        type: 'url',
        placeholder: 'https://...',
        layout: 'full',
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: STATUS_OPTIONS,
        rerenderOnChange: true,
      },
      {
        id: 'projectType',
        label: 'Project Type',
        type: 'select',
        options: PROJECT_TYPE_OPTIONS,
        rerenderOnChange: true,
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'select',
        options: PRIORITY_OPTIONS,
        rerenderOnChange: true,
      },
    ],
  },
  {
    id: 'project-intent',
    title: 'Project Intent & Scope',
    fields: [
      {
        id: 'businessGoal',
        label: 'Business Goal',
        type: 'textarea',
        required: true,
        layout: 'full',
        placeholder: 'What business result should be achieved.',
      },
      {
        id: 'scopeIn',
        label: 'Scope In',
        type: 'textarea',
        required: true,
        layout: 'full',
        placeholder: 'What is included in this phase.',
      },
      {
        id: 'scopeOut',
        label: 'Scope Out',
        type: 'textarea',
        layout: 'full',
        placeholder: 'What is explicitly not included.',
      },
      {
        id: 'currentStage',
        label: 'Current Stage',
        type: 'select',
        options: CURRENT_STAGE_OPTIONS,
      },
      {
        id: 'definitionOfDone',
        label: 'Definition of Done',
        type: 'textarea',
        required: true,
        layout: 'full',
        placeholder: 'Conditions that define completion.',
      },
      {
        id: 'acceptanceCriteria',
        label: 'Acceptance Criteria',
        type: 'textarea',
        required: true,
        layout: 'full',
        placeholder: 'Checklist of acceptance points.',
      },
    ],
  },
  {
    id: 'technical-profile',
    title: 'Technical Profile',
    fields: [
      {
        id: 'mainStack',
        label: 'Main Stack',
        type: 'select',
        options: MAIN_STACK_OPTIONS,
        required: true,
        rerenderOnChange: true,
      },
      { id: 'secondaryStack', label: 'Secondary Stack / Libraries', type: 'text', placeholder: 'Key libs and tools' },
      {
        id: 'platform',
        label: 'Platform',
        type: 'select',
        options: PLATFORM_OPTIONS,
        required: true,
        rerenderOnChange: true,
      },
      {
        id: 'hostingDeployment',
        label: 'Hosting / Deployment',
        type: 'select',
        options: HOSTING_OPTIONS,
        required: true,
        rerenderOnChange: true,
      },
      { id: 'database', label: 'Database', type: 'text', required: true, placeholder: 'Will be stack-driven select' },
      { id: 'cms', label: 'CMS', type: 'text', placeholder: 'Will be stack-driven select' },
      {
        id: 'authStrategy',
        label: 'Auth Strategy',
        type: 'text',
        required: true,
        placeholder: 'Will be stack-driven select',
      },
      { id: 'storage', label: 'Storage', type: 'text', placeholder: 'Will be stack-driven select' },
      { id: 'apiType', label: 'API Type', type: 'select', options: API_TYPE_OPTIONS },
      {
        id: 'integrations',
        label: 'Integrations',
        type: 'textarea',
        layout: 'full',
        placeholder: 'External APIs, analytics, payments, CRM, etc.',
      },
    ],
  },
  {
    id: 'repositories-environments',
    title: 'Repositories & Environments',
    fields: [
      { id: 'repositoryUrl', label: 'Repository URL', type: 'url', required: true, placeholder: 'https://...' },
      { id: 'docsUrl', label: 'Docs URL', type: 'url', placeholder: 'https://...' },
      { id: 'stagingUrl', label: 'Staging URL', type: 'url', placeholder: 'https://...' },
      { id: 'productionUrl', label: 'Production URL', type: 'url', required: true, placeholder: 'https://...' },
      { id: 'adminUrl', label: 'Admin URL', type: 'url', placeholder: 'https://...' },
      { id: 'apiBaseUrl', label: 'API Base URL', type: 'url', placeholder: 'https://...' },
    ],
  },
  {
    id: 'delivery-runbook',
    title: 'Delivery Runbook',
    fields: [
      { id: 'runInstallCommand', label: 'Install Command', type: 'text', placeholder: 'npm install' },
      { id: 'runStartCommand', label: 'Start Command', type: 'text', placeholder: 'npm start' },
      { id: 'runTestCommand', label: 'Test Command', type: 'text', placeholder: 'npm test' },
      { id: 'runBuildCommand', label: 'Build Command', type: 'text', placeholder: 'npm run build' },
      {
        id: 'secretStorageReference',
        label: 'Secrets Stored In',
        type: 'text',
        placeholder: '1Password, Bitwarden, Vault, etc.',
      },
      { id: 'vaultLink', label: 'Vault Link', type: 'url', placeholder: 'https://...' },
      {
        id: 'accessNotes',
        label: 'Access Notes',
        type: 'textarea',
        layout: 'full',
        placeholder: 'Access boundaries and provisioning notes.',
      },
    ],
  },
  {
    id: 'project-files',
    title: 'Project Files',
    description: 'Attach key documents to this project passport.',
    fields: [
      {
        id: 'projectAttachments',
        label: 'Project Files',
        type: 'files',
        layout: 'full',
        helperText: 'Max 8 files, up to 5 MB each, total about 10 MB. Files are saved inside this passport.',
      },
    ],
  },
];

export const LEAD_SECTIONS: SectionDefinition[] = [
  {
    id: 'lead-header',
    title: 'Lead Header',
    fields: [
      {
        id: 'leadName',
        label: 'Lead Name',
        type: 'text',
        required: true,
        placeholder: 'Project Passport Desktop App',
        rerenderOnChange: true,
      },
      { id: 'client', label: 'Client / Company', type: 'text', placeholder: 'Company name' },
      {
        id: 'leadStatus',
        label: 'Lead Status',
        type: 'select',
        options: LEAD_STATUS_OPTIONS,
        required: true,
        rerenderOnChange: true,
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'select',
        options: PRIORITY_OPTIONS,
        rerenderOnChange: true,
      },
      {
        id: 'leadSource',
        label: 'Lead Source',
        type: 'select',
        options: LEAD_SOURCE_OPTIONS,
      },
      { id: 'leadContactPerson', label: 'Contact Person', type: 'text', placeholder: 'Name and role' },
      { id: 'communicationChannel', label: 'Communication Channel', type: 'text', placeholder: 'Email / phone / Telegram' },
      {
        id: 'communicatorPeople',
        label: 'Communicator(s)',
        type: 'people',
        options: TEAM_MEMBER_OPTIONS,
        placeholder: 'Select communicators',
      },
      {
        id: 'responsiblePeople',
        label: 'Responsible Person(s)',
        type: 'people',
        options: TEAM_MEMBER_OPTIONS,
        placeholder: 'Select responsible people',
      },
    ],
  },
  {
    id: 'lead-brief',
    title: 'Lead Brief',
    fields: [
      {
        id: 'leadSummary',
        label: 'Request Summary',
        type: 'textarea',
        layout: 'full',
        required: true,
        placeholder: 'Short description of request and business context.',
      },
      { id: 'leadBudget', label: 'Budget Range', type: 'text', placeholder: 'e.g. $3k-$5k' },
      { id: 'leadNextStep', label: 'Next Step', type: 'text', placeholder: 'Send estimate / schedule call / etc.' },
      {
        id: 'leadQualificationNotes',
        label: 'Qualification Notes',
        type: 'textarea',
        layout: 'full',
        placeholder: 'Technical risks, blockers, assumptions.',
      },
      {
        id: 'leadLossReason',
        label: 'Loss Reason',
        type: 'textarea',
        layout: 'full',
        placeholder: 'Fill only if lead is Lost.',
      },
    ],
  },
  {
    id: 'lead-files',
    title: 'Lead Files',
    description: 'Attach key files to this lead passport.',
    fields: [
      {
        id: 'leadAttachments',
        label: 'Lead Files',
        type: 'files',
        layout: 'full',
        helperText: 'Max 8 files, up to 5 MB each, total about 10 MB. Files are saved inside this passport.',
      },
    ],
  },
];

const PASSPORT_TEMPLATE_SECTIONS: Record<string, SectionDefinition> = {
  'Test Assignment': {
    id: 'test-assignment-template',
    title: 'Test Assignment Template',
    description: 'Structured checklist for technical test tasks.',
    badge: 'Template',
    fields: [
      {
        id: 'testAssignmentTitle',
        label: 'Test Assignment Title',
        type: 'text',
        required: true,
        placeholder: 'Implement ...',
      },
      {
        id: 'testAssignmentSourceUrl',
        label: 'Source / Brief URL',
        type: 'url',
        placeholder: 'https://...',
      },
      {
        id: 'testAssignmentStatus',
        label: 'Test Assignment Status',
        type: 'select',
        options: TEST_ASSIGNMENT_STATUS_OPTIONS,
      },
      {
        id: 'testAssignmentEstimate',
        label: 'Estimated Effort',
        type: 'text',
        placeholder: 'e.g. 10-14 hours',
      },
      {
        id: 'testAssignmentSubmissionFormat',
        label: 'Submission Format',
        type: 'select',
        options: TEST_ASSIGNMENT_SUBMISSION_FORMAT_OPTIONS,
      },
      {
        id: 'testAssignmentDeliverables',
        label: 'Expected Deliverables',
        type: 'textarea',
        required: true,
        layout: 'full',
        placeholder: 'Repository, demo link, documentation, etc.',
      },
      {
        id: 'testAssignmentEvaluationCriteria',
        label: 'Evaluation Criteria',
        type: 'textarea',
        layout: 'full',
        placeholder: 'Code quality, architecture, tests, UX, etc.',
      },
      {
        id: 'testAssignmentConstraints',
        label: 'Constraints & Notes',
        type: 'textarea',
        layout: 'full',
        placeholder: 'Time limits, forbidden libraries, mandatory stack, etc.',
      },
    ],
  },
};

const STACK_TEMPLATE_SECTIONS: Record<string, SectionDefinition> = {
  WordPress: {
    id: 'stack-wordpress',
    title: 'Stack Template: WordPress',
    badge: 'Main Stack',
    fields: [
      { id: 'wpType', label: 'WordPress Type', type: 'text' },
      { id: 'wpThemeType', label: 'Theme Type', type: 'text' },
      { id: 'wpPageBuilder', label: 'Page Builder', type: 'text' },
      { id: 'wpAcfUsed', label: 'ACF Used', type: 'select', options: YES_NO_OPTIONS },
      { id: 'wpWooCommerce', label: 'WooCommerce', type: 'select', options: YES_NO_OPTIONS },
      { id: 'wpMultilangPlugin', label: 'Multilang Plugin', type: 'text' },
      { id: 'wpSeoPlugin', label: 'SEO Plugin', type: 'text' },
      { id: 'wpAdminUrl', label: 'wp-admin URL', type: 'url' },
    ],
  },
  React: {
    id: 'stack-react',
    title: 'Stack Template: React',
    badge: 'Main Stack',
    fields: [
      { id: 'reactFramework', label: 'Framework', type: 'text' },
      { id: 'reactRouting', label: 'Routing', type: 'text' },
      { id: 'reactStateManagement', label: 'State Management', type: 'text' },
      { id: 'reactUiLibrary', label: 'UI Library', type: 'text' },
      { id: 'reactDataFetching', label: 'Data Fetching', type: 'text' },
      { id: 'reactBuildTool', label: 'Build Tool', type: 'text' },
      { id: 'reactApiType', label: 'API Type', type: 'text' },
      { id: 'reactPerformanceNotes', label: 'Performance Notes', type: 'textarea', layout: 'full' },
    ],
  },
  'Next.js': {
    id: 'stack-nextjs',
    title: 'Stack Template: Next.js',
    badge: 'Main Stack',
    fields: [
      { id: 'nextRouterMode', label: 'App Router / Pages Router', type: 'text' },
      { id: 'nextRenderingStrategy', label: 'Rendering Strategy', type: 'text' },
      { id: 'nextAuth', label: 'Auth', type: 'text' },
      { id: 'nextCmsIntegration', label: 'CMS Integration', type: 'text' },
      { id: 'nextImageStrategy', label: 'Image Strategy', type: 'text' },
      { id: 'nextHostingPlatform', label: 'Hosting Platform', type: 'text' },
      { id: 'nextSsrCachingNotes', label: 'SSR / caching notes', type: 'textarea', layout: 'full' },
      { id: 'nextDeploymentNotes', label: 'Deployment Notes', type: 'textarea', layout: 'full' },
    ],
  },
  'React Native': {
    id: 'stack-react-native',
    title: 'Stack Template: React Native',
    badge: 'Main Stack',
    fields: [
      { id: 'rnExpoOrBare', label: 'Expo or Bare', type: 'text' },
      { id: 'rnTargetPlatforms', label: 'Target Platforms', type: 'text' },
      { id: 'rnNavigation', label: 'Navigation', type: 'text' },
      { id: 'rnPushNotifications', label: 'Push Notifications', type: 'text' },
      { id: 'rnAuth', label: 'Auth', type: 'text' },
      { id: 'rnAppStoreStatus', label: 'App Store Status', type: 'text' },
      { id: 'rnPlayStoreStatus', label: 'Play Store Status', type: 'text' },
      { id: 'rnMobileRisks', label: 'Mobile Risks', type: 'textarea', layout: 'full' },
    ],
  },
  Electron: {
    id: 'stack-electron',
    title: 'Stack Template: Electron',
    badge: 'Main Stack',
    fields: [
      { id: 'electronRendererStack', label: 'Renderer Stack', type: 'text' },
      { id: 'electronStateManagement', label: 'State Management', type: 'text' },
      { id: 'electronLocalPersistenceStrategy', label: 'Local Persistence Strategy', type: 'text' },
      { id: 'electronIpcNotes', label: 'IPC Notes', type: 'textarea', layout: 'full' },
      { id: 'electronNativeIntegrations', label: 'Native Integrations', type: 'text' },
      { id: 'electronFileSystemAccess', label: 'File System Access', type: 'text' },
      { id: 'electronAutoUpdate', label: 'Auto Update', type: 'text' },
      { id: 'electronDesktopRisks', label: 'Desktop-specific Risks', type: 'textarea', layout: 'full' },
    ],
  },
  'Generic Full-stack': {
    id: 'stack-generic-fullstack',
    title: 'Stack Template: Generic Full-stack',
    badge: 'Main Stack',
    fields: [
      { id: 'fullstackFrontend', label: 'Frontend', type: 'text' },
      { id: 'fullstackBackend', label: 'Backend', type: 'text' },
      { id: 'fullstackDatabase', label: 'Database', type: 'text' },
      { id: 'fullstackAuth', label: 'Auth', type: 'text' },
      { id: 'fullstackInfra', label: 'Infra', type: 'text' },
      { id: 'fullstackDeployment', label: 'Deployment', type: 'text' },
      { id: 'fullstackExternalServices', label: 'External Services', type: 'textarea', layout: 'full' },
      { id: 'fullstackArchitectureNotes', label: 'Architecture Notes', type: 'textarea', layout: 'full' },
    ],
  },
};

const HOSTING_TEMPLATE_SECTIONS: Record<string, SectionDefinition> = {
  Vercel: {
    id: 'hosting-vercel',
    title: 'Hosting Template: Vercel',
    badge: 'Hosting',
    fields: [
      { id: 'vercelProjectUrl', label: 'Project URL', type: 'url' },
      { id: 'vercelTeamName', label: 'Team Name', type: 'text' },
      { id: 'vercelEnvStatus', label: 'Environment Variables Status', type: 'text' },
      { id: 'vercelPreviewDeployments', label: 'Preview Deployments', type: 'text' },
      { id: 'vercelProductionDomain', label: 'Production Domain', type: 'text' },
      { id: 'vercelNotes', label: 'Vercel Notes', type: 'textarea', layout: 'full' },
    ],
  },
  Netlify: {
    id: 'hosting-netlify',
    title: 'Hosting Template: Netlify',
    badge: 'Hosting',
    fields: [
      { id: 'netlifySiteUrl', label: 'Site URL', type: 'url' },
      { id: 'netlifyTeam', label: 'Team / Workspace', type: 'text' },
      { id: 'netlifyBuildSettings', label: 'Build Settings', type: 'text' },
      { id: 'netlifyDomain', label: 'Production Domain', type: 'text' },
      { id: 'netlifyNotes', label: 'Netlify Notes', type: 'textarea', layout: 'full' },
    ],
  },
  cPanel: {
    id: 'hosting-cpanel',
    title: 'Hosting Template: cPanel',
    badge: 'Hosting',
    fields: [
      { id: 'cpanelUrl', label: 'Hosting Panel URL', type: 'url' },
      { id: 'cpanelFtpReference', label: 'FTP / SFTP Reference', type: 'text' },
      { id: 'cpanelDomain', label: 'Domain', type: 'text' },
      { id: 'cpanelSslStatus', label: 'SSL Status', type: 'text' },
      { id: 'cpanelPhpVersion', label: 'PHP Version', type: 'text' },
      { id: 'cpanelDbReference', label: 'DB Access Reference', type: 'text' },
      { id: 'cpanelCronJobs', label: 'Cron Jobs', type: 'text' },
      { id: 'cpanelFileManagerNotes', label: 'File Manager Notes', type: 'textarea', layout: 'full' },
    ],
  },
  'Shared Hosting': {
    id: 'hosting-shared-hosting',
    title: 'Hosting Template: Shared Hosting',
    badge: 'Hosting',
    fields: [
      { id: 'sharedPanelUrl', label: 'Hosting Panel URL', type: 'url' },
      { id: 'sharedFtpReference', label: 'FTP / SFTP Reference', type: 'text' },
      { id: 'sharedDomain', label: 'Domain', type: 'text' },
      { id: 'sharedSslStatus', label: 'SSL Status', type: 'text' },
      { id: 'sharedPhpVersion', label: 'PHP Version', type: 'text' },
      { id: 'sharedDbReference', label: 'DB Access Reference', type: 'text' },
      { id: 'sharedCronJobs', label: 'Cron Jobs', type: 'text' },
      { id: 'sharedFileManagerNotes', label: 'File Manager Notes', type: 'textarea', layout: 'full' },
    ],
  },
  VPS: {
    id: 'hosting-vps',
    title: 'Hosting Template: VPS',
    badge: 'Hosting',
    fields: [
      { id: 'vpsProvider', label: 'Provider', type: 'text' },
      { id: 'vpsIpReference', label: 'Server IP / DNS Reference', type: 'text' },
      { id: 'vpsAccessMethod', label: 'Access Method', type: 'text' },
      { id: 'vpsRuntime', label: 'Runtime Stack', type: 'text' },
      { id: 'vpsProcessManager', label: 'Process Manager', type: 'text' },
      { id: 'vpsNotes', label: 'Infrastructure Notes', type: 'textarea', layout: 'full' },
    ],
  },
  AWS: {
    id: 'hosting-aws',
    title: 'Hosting Template: AWS',
    badge: 'Hosting',
    fields: [
      { id: 'awsServicesUsed', label: 'Services Used', type: 'text' },
      { id: 'awsRegion', label: 'Region', type: 'text' },
      { id: 'awsS3', label: 'S3', type: 'text' },
      { id: 'awsCloudFront', label: 'CloudFront', type: 'text' },
      { id: 'awsCompute', label: 'EC2 / ECS / Lambda', type: 'text' },
      { id: 'awsIamReference', label: 'IAM Reference', type: 'text' },
      { id: 'awsMonitoring', label: 'Logs / Monitoring', type: 'text' },
      { id: 'awsInfraNotes', label: 'Infra Notes', type: 'textarea', layout: 'full' },
    ],
  },
  Firebase: {
    id: 'hosting-firebase',
    title: 'Hosting Template: Firebase',
    badge: 'Hosting',
    fields: [
      { id: 'firebaseProjectId', label: 'Project ID', type: 'text' },
      { id: 'firebaseHostingSite', label: 'Hosting Site', type: 'text' },
      { id: 'firebaseServicesUsed', label: 'Services Used', type: 'text' },
      { id: 'firebaseRulesStatus', label: 'Security Rules Status', type: 'text' },
      { id: 'firebaseEnvStatus', label: 'Environment Variables Status', type: 'text' },
      { id: 'firebaseNotes', label: 'Firebase Notes', type: 'textarea', layout: 'full' },
    ],
  },
  Render: {
    id: 'hosting-render',
    title: 'Hosting Template: Render',
    badge: 'Hosting',
    fields: [
      { id: 'renderServiceUrl', label: 'Service URL', type: 'url' },
      { id: 'renderServiceType', label: 'Service Type', type: 'text' },
      { id: 'renderRegion', label: 'Region', type: 'text' },
      { id: 'renderEnvStatus', label: 'Environment Variables Status', type: 'text' },
      { id: 'renderDeployHooks', label: 'Deploy Hooks', type: 'text' },
      { id: 'renderNotes', label: 'Render Notes', type: 'textarea', layout: 'full' },
    ],
  },
  Railway: {
    id: 'hosting-railway',
    title: 'Hosting Template: Railway',
    badge: 'Hosting',
    fields: [
      { id: 'railwayProjectName', label: 'Project Name', type: 'text' },
      { id: 'railwayServiceNames', label: 'Service Names', type: 'text' },
      { id: 'railwayEnvironments', label: 'Environments', type: 'text' },
      { id: 'railwayVariablesStatus', label: 'Variables Status', type: 'text' },
      { id: 'railwayDomain', label: 'Domain', type: 'text' },
      { id: 'railwayNotes', label: 'Railway Notes', type: 'textarea', layout: 'full' },
    ],
  },
  'Expo EAS': {
    id: 'hosting-expo-eas',
    title: 'Hosting Template: Expo EAS',
    badge: 'Hosting',
    fields: [
      { id: 'easProjectId', label: 'Expo Project ID', type: 'text' },
      { id: 'easBuildStatus', label: 'EAS Build Status', type: 'text' },
      { id: 'easOtaUpdates', label: 'OTA Updates', type: 'text' },
      { id: 'easIosBundle', label: 'iOS Bundle', type: 'text' },
      { id: 'easAndroidPackage', label: 'Android Package', type: 'text' },
      { id: 'easReleaseNotes', label: 'Release Notes', type: 'textarea', layout: 'full' },
    ],
  },
  'App Store / Play Store': {
    id: 'hosting-app-store-play-store',
    title: 'Hosting Template: App Store / Play Store',
    badge: 'Hosting',
    fields: [
      { id: 'storeIosAppId', label: 'iOS App ID', type: 'text' },
      { id: 'storeAndroidAppId', label: 'Android App ID', type: 'text' },
      { id: 'storeReviewStatus', label: 'Review Status', type: 'text' },
      { id: 'storeReleaseChannel', label: 'Release Channel', type: 'text' },
      { id: 'storeVersionPolicy', label: 'Versioning Policy', type: 'text' },
      { id: 'storeSubmissionNotes', label: 'Submission Notes', type: 'textarea', layout: 'full' },
    ],
  },
  'Desktop Distribution': {
    id: 'hosting-desktop-distribution',
    title: 'Hosting Template: Desktop Distribution',
    badge: 'Hosting',
    fields: [
      { id: 'desktopDistOsTargets', label: 'OS Targets', type: 'text' },
      { id: 'desktopDistInstallerType', label: 'Installer Type', type: 'text' },
      { id: 'desktopDistAutoUpdate', label: 'Auto-update', type: 'text' },
      { id: 'desktopDistSigningStatus', label: 'Signing Status', type: 'text' },
      { id: 'desktopDistReleaseChannel', label: 'Release Channel', type: 'text' },
    ],
  },
};

export const IMPORTANT_FIELDS: ImportantFieldDefinition[] = [
  { id: 'projectName', label: 'Project Name' },
  { id: 'passportTemplate', label: 'Passport Template' },
  { id: 'client', label: 'Client' },
  { id: 'communicationChannel', label: 'Communication Channel' },
  { id: 'communicatorPeople', label: 'Communicator(s)' },
  { id: 'responsiblePeople', label: 'Responsible Person(s)' },
  { id: 'businessGoal', label: 'Business Goal' },
  { id: 'scopeIn', label: 'Scope In' },
  { id: 'definitionOfDone', label: 'Definition of Done' },
  { id: 'acceptanceCriteria', label: 'Acceptance Criteria' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'mainStack', label: 'Main Stack' },
  { id: 'platform', label: 'Platform' },
  { id: 'hostingDeployment', label: 'Hosting / Deployment' },
  { id: 'database', label: 'Database' },
  { id: 'authStrategy', label: 'Auth Strategy' },
  { id: 'repositoryUrl', label: 'Repository URL' },
  { id: 'productionUrl', label: 'Production URL' },
  { id: 'runInstallCommand', label: 'Install Command' },
  { id: 'runStartCommand', label: 'Start Command' },
];

export const LEAD_IMPORTANT_FIELDS: ImportantFieldDefinition[] = [
  { id: 'leadName', label: 'Lead Name' },
  { id: 'client', label: 'Client / Company' },
  { id: 'leadStatus', label: 'Lead Status' },
  { id: 'leadSource', label: 'Lead Source' },
  { id: 'leadContactPerson', label: 'Contact Person' },
  { id: 'communicationChannel', label: 'Communication Channel' },
  { id: 'communicatorPeople', label: 'Communicator(s)' },
  { id: 'responsiblePeople', label: 'Responsible Person(s)' },
  { id: 'leadSummary', label: 'Request Summary' },
  { id: 'leadNextStep', label: 'Next Step' },
];

export function getConditionalSections(values: Record<string, string>): SectionDefinition[] {
  const sections: SectionDefinition[] = [];

  const mainStack = values.mainStack;
  const hosting = values.hostingDeployment;
  const passportTemplate = values.passportTemplate;

  if (mainStack && STACK_TEMPLATE_SECTIONS[mainStack]) {
    sections.push(STACK_TEMPLATE_SECTIONS[mainStack]);
  }

  if (hosting && HOSTING_TEMPLATE_SECTIONS[hosting]) {
    sections.push(HOSTING_TEMPLATE_SECTIONS[hosting]);
  }

  if (passportTemplate && PASSPORT_TEMPLATE_SECTIONS[passportTemplate]) {
    sections.push(PASSPORT_TEMPLATE_SECTIONS[passportTemplate]);
  }

  return sections;
}
