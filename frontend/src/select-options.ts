import { BASE_SECTIONS, LEAD_SECTIONS, SelectOption } from './passport-schema';

function getBaseSelectOptions(fieldId: string): SelectOption[] {
  const field = [...BASE_SECTIONS, ...LEAD_SECTIONS]
    .flatMap((section) => section.fields)
    .find((item) => item.id === fieldId);
  return field?.options ? [...field.options] : [];
}

export const MAIN_STACK_FIELD_OPTIONS = getBaseSelectOptions('mainStack');
export const PLATFORM_FIELD_OPTIONS = getBaseSelectOptions('platform');
export const HOSTING_FIELD_OPTIONS = getBaseSelectOptions('hostingDeployment');
export const PASSPORT_TEMPLATE_FIELD_OPTIONS = getBaseSelectOptions('passportTemplate');
export const PRIORITY_FIELD_OPTIONS = getBaseSelectOptions('priority');
export const LEAD_STATUS_FIELD_OPTIONS = getBaseSelectOptions('leadStatus');
export const LEAD_SOURCE_FIELD_OPTIONS = getBaseSelectOptions('leadSource');
export const DEPARTMENT_FIELD_OPTIONS = getBaseSelectOptions('department');
export const DESIGN_TOOL_FIELD_OPTIONS = getBaseSelectOptions('designTool');

export interface StackDrivenSelectOptions {
  cms: SelectOption[];
  database: SelectOption[];
  storage: SelectOption[];
  authStrategy: SelectOption[];
}

function toOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({
    value,
    label: value,
  }));
}

export function withCurrentOption(options: SelectOption[], currentValue: string): SelectOption[] {
  if (!currentValue.trim()) {
    return options;
  }

  const exists = options.some((option) => option.value === currentValue);
  if (exists) {
    return options;
  }

  return [{ value: currentValue, label: `${currentValue} (Current)` }, ...options];
}

const DEFAULT_STACK_DRIVEN_SELECTS: StackDrivenSelectOptions = {
  cms: toOptions(['None', 'WordPress', 'Strapi', 'Contentful', 'Sanity', 'Prismic', 'Ghost', 'Shopify']),
  database: toOptions([
    'PostgreSQL',
    'MySQL',
    'MariaDB',
    'MongoDB',
    'SQLite',
    'Redis',
    'Supabase Postgres',
    'Firebase Firestore',
    'DynamoDB',
    'None',
  ]),
  storage: toOptions([
    'Local Disk',
    'Amazon S3',
    'Cloudinary',
    'Firebase Storage',
    'Supabase Storage',
    'Vercel Blob',
    'Cloudflare R2',
    'None',
  ]),
  authStrategy: toOptions([
    'JWT',
    'Session Cookies',
    'OAuth 2.0',
    'Auth0',
    'Clerk',
    'Firebase Auth',
    'NextAuth',
    'Magic Link',
    'None',
  ]),
};

const STACK_DRIVEN_SELECTS: Record<string, StackDrivenSelectOptions> = {
  WordPress: {
    cms: toOptions(['WordPress']),
    database: toOptions(['MySQL', 'MariaDB']),
    storage: toOptions(['WordPress Media Library', 'Amazon S3', 'Cloudinary', 'None']),
    authStrategy: toOptions(['WordPress Users', 'JWT Plugin', 'OAuth Plugin', 'None']),
  },
  React: {
    cms: toOptions(['None', 'Strapi', 'Contentful', 'Sanity', 'WordPress Headless', 'Shopify']),
    database: toOptions(['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase Postgres', 'Firebase Firestore', 'None']),
    storage: toOptions(['Amazon S3', 'Cloudinary', 'Firebase Storage', 'Supabase Storage', 'None']),
    authStrategy: toOptions(['JWT', 'Session Cookies', 'OAuth 2.0', 'Auth0', 'Clerk', 'Firebase Auth', 'None']),
  },
  'Next.js': {
    cms: toOptions(['None', 'Contentful', 'Sanity', 'Strapi', 'WordPress Headless', 'Prismic']),
    database: toOptions(['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase Postgres', 'PlanetScale', 'None']),
    storage: toOptions(['Amazon S3', 'Vercel Blob', 'Cloudinary', 'Supabase Storage', 'None']),
    authStrategy: toOptions(['NextAuth', 'JWT', 'OAuth 2.0', 'Auth0', 'Clerk', 'None']),
  },
  'React Native': {
    cms: toOptions(['None', 'Contentful', 'Sanity', 'Strapi']),
    database: toOptions(['Firebase Firestore', 'Supabase Postgres', 'PostgreSQL', 'MongoDB', 'SQLite', 'None']),
    storage: toOptions(['Firebase Storage', 'Amazon S3', 'Cloudinary', 'Supabase Storage', 'None']),
    authStrategy: toOptions(['Firebase Auth', 'OAuth 2.0', 'JWT', 'Clerk', 'Magic Link', 'None']),
  },
  Electron: {
    cms: toOptions(['None', 'Local Markdown/JSON', 'Strapi', 'WordPress Headless']),
    database: toOptions(['SQLite', 'PostgreSQL', 'MySQL', 'MongoDB', 'PouchDB', 'None']),
    storage: toOptions(['Local Disk', 'IndexedDB', 'Amazon S3', 'Supabase Storage', 'None']),
    authStrategy: toOptions(['Local Session', 'JWT', 'OAuth 2.0', 'SSO', 'None']),
  },
  'Generic Full-stack': {
    cms: toOptions(['None', 'WordPress', 'Strapi', 'Contentful', 'Sanity', 'Custom Admin']),
    database: toOptions([
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'Supabase Postgres',
      'Firebase Firestore',
      'DynamoDB',
    ]),
    storage: toOptions(['Amazon S3', 'Cloudinary', 'Supabase Storage', 'Firebase Storage', 'Local Disk', 'None']),
    authStrategy: toOptions(['JWT', 'Session Cookies', 'OAuth 2.0', 'Auth0', 'Clerk', 'SSO', 'None']),
  },
};

export const STATIC_SELECT_OPTIONS_BY_FIELD_ID: Record<string, SelectOption[]> = {
  seoCriticality: toOptions(['Low', 'Medium', 'High', 'Critical']),
  webPerformanceBudget: toOptions(['Basic', 'Balanced', 'Strict']),
  desktopDistributionModel: toOptions(['Direct download', 'Private installer', 'MDM rollout', 'Store distribution']),
  osSupportPolicy: toOptions(['Latest only', 'Latest two versions', 'Long-term support']),
  sharedCodeRatio: toOptions(['Low (<30%)', 'Medium (30-70%)', 'High (>70%)']),
  wpType: toOptions(['Corporate Site', 'Landing', 'WooCommerce', 'Custom Theme', 'LMS', 'Blog']),
  wpThemeType: toOptions(['Custom Theme', 'Premium Theme', 'Hybrid', 'Headless Frontend']),
  wpPageBuilder: toOptions(['Elementor', 'Gutenberg', 'WPBakery', 'Bricks', 'None']),
  wpMultilangPlugin: toOptions(['WPML', 'Polylang', 'TranslatePress', 'Weglot', 'None']),
  wpSeoPlugin: toOptions(['Yoast SEO', 'Rank Math', 'All in One SEO', 'SEOPress', 'None']),
  reactFramework: toOptions(['React SPA', 'Vite', 'CRA', 'Other']),
  reactRouting: toOptions(['React Router', 'TanStack Router', 'Custom', 'None']),
  reactStateManagement: toOptions(['Redux Toolkit', 'Zustand', 'MobX', 'Context API', 'Recoil', 'None']),
  reactUiLibrary: toOptions(['MUI', 'Ant Design', 'Chakra UI', 'Tailwind UI', 'Custom UI']),
  reactDataFetching: toOptions(['TanStack Query', 'RTK Query', 'SWR', 'Axios + custom', 'Apollo']),
  reactBuildTool: toOptions(['Vite', 'Webpack', 'Rspack', 'Parcel']),
  reactApiType: toOptions(['REST', 'GraphQL', 'tRPC', 'BFF']),
  nextRouterMode: toOptions(['App Router', 'Pages Router', 'Hybrid']),
  nextRenderingStrategy: toOptions(['SSR', 'SSG', 'ISR', 'CSR', 'Mixed']),
  nextAuth: toOptions(['NextAuth', 'Auth.js', 'Auth0', 'Clerk', 'Custom JWT', 'None']),
  nextCmsIntegration: toOptions(['None', 'Contentful', 'Sanity', 'Strapi', 'WordPress Headless', 'Other']),
  nextImageStrategy: toOptions(['next/image', 'CDN optimized', 'External only', 'Mixed']),
  nextHostingPlatform: toOptions(['Vercel', 'AWS', 'Render', 'Railway', 'Other']),
  rnExpoOrBare: toOptions(['Expo', 'Bare React Native']),
  rnTargetPlatforms: toOptions(['iOS + Android', 'iOS only', 'Android only']),
  rnNavigation: toOptions(['React Navigation', 'Expo Router', 'Native Navigation']),
  rnPushNotifications: toOptions(['Expo Notifications', 'FCM', 'OneSignal', 'None']),
  rnAuth: toOptions(['Firebase Auth', 'OAuth 2.0', 'JWT', 'Auth0', 'None']),
  rnAppStoreStatus: toOptions(['Not Started', 'Draft', 'In Review', 'Live', 'Paused']),
  rnPlayStoreStatus: toOptions(['Not Started', 'Draft', 'In Review', 'Live', 'Paused']),
  electronRendererStack: toOptions(['React', 'Vue', 'Svelte', 'Vanilla', 'Other']),
  electronStateManagement: toOptions(['Redux Toolkit', 'Zustand', 'MobX', 'Context API', 'None']),
  electronLocalPersistenceStrategy: toOptions(['electron-store', 'SQLite', 'IndexedDB', 'JSON files']),
  electronFileSystemAccess: toOptions(['IPC-mediated access', 'Read-only', 'Read/write with dialogs']),
  electronAutoUpdate: toOptions(['Enabled', 'Planned', 'Not required']),
  fullstackAuth: toOptions(['JWT', 'Session', 'OAuth 2.0', 'SSO', 'Mixed']),
  desktopDistInstallerType: toOptions(['DMG', 'EXE', 'MSI', 'AppImage', 'pkg']),
  desktopDistAutoUpdate: toOptions(['Enabled', 'Planned', 'Disabled']),
  desktopDistSigningStatus: toOptions(['Signed', 'Unsigned', 'In progress']),
  desktopDistReleaseChannel: toOptions(['Stable', 'Beta', 'Alpha', 'Internal']),
  vercelEnvStatus: toOptions(['Configured', 'Partially configured', 'Missing']),
  netlifyBuildSettings: toOptions(['Configured', 'Needs review', 'Unknown']),
  cpanelSslStatus: toOptions(['Active', 'Expired', 'Pending']),
  sharedSslStatus: toOptions(['Active', 'Expired', 'Pending']),
  vpsProvider: toOptions(['DigitalOcean', 'Hetzner', 'AWS EC2', 'GCP Compute', 'Azure VM', 'Other']),
  vpsAccessMethod: toOptions(['SSH key', 'Password', 'SSM', 'VPN']),
  vpsRuntime: toOptions(['Node.js', 'PHP', 'Python', 'Docker', 'Mixed']),
  vpsProcessManager: toOptions(['PM2', 'systemd', 'Docker', 'Kubernetes', 'Other']),
  awsRegion: toOptions(['eu-central-1', 'eu-west-1', 'us-east-1', 'us-west-2', 'Other']),
  firebaseRulesStatus: toOptions(['Configured', 'Needs review', 'Open']),
  renderServiceType: toOptions(['Static Site', 'Web Service', 'Background Worker', 'Cron Job']),
  railwayEnvironments: toOptions(['Production', 'Staging', 'Preview']),
  easBuildStatus: toOptions(['Green', 'Failing', 'In progress', 'Not configured']),
  storeReviewStatus: toOptions(['Draft', 'In review', 'Approved', 'Rejected']),
  storeReleaseChannel: toOptions(['Production', 'Staged Rollout', 'Beta', 'Internal']),
};

export function getStackDrivenOptions(mainStack: string): StackDrivenSelectOptions {
  return STACK_DRIVEN_SELECTS[mainStack] || DEFAULT_STACK_DRIVEN_SELECTS;
}

export function buildDependentSelectUnion(fieldId: keyof StackDrivenSelectOptions): string[] {
  const values = new Set<string>();
  DEFAULT_STACK_DRIVEN_SELECTS[fieldId].forEach((option) => values.add(option.value));
  Object.values(STACK_DRIVEN_SELECTS).forEach((stackOptions) => {
    stackOptions[fieldId].forEach((option) => values.add(option.value));
  });
  return Array.from(values);
}
