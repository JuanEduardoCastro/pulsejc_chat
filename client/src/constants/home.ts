import type { CSSProperties } from 'react';

export const GITHUB_URL = 'https://github.com/JuanEduardoCastro/pulsejc_chat';

export const ICONS = {
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  sparkle: 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  globe:
    'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  card: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2 10h20',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  stream: 'M4 12h3l2-5 4 10 2-5h5',
  branch:
    'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM189a9 9 0 0 1-9 9',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
} as const;

export const FEATURES = [
  { key: 'realtime', icon: ICONS.zap },
  { key: 'ai', icon: ICONS.sparkle },
  { key: 'contacts', icon: ICONS.users },
  { key: 'i18n', icon: ICONS.globe },
  { key: 'pro', icon: ICONS.card },
  { key: 'security', icon: ICONS.shield },
] as const;

export const BUILT = [
  { key: 'architecture', icon: ICONS.layers },
  { key: 'streaming', icon: ICONS.stream },
  { key: 'cicd', icon: ICONS.branch },
  { key: 'aws', icon: ICONS.cloud },
  { key: 'monitoring', icon: ICONS.activity },
  { key: 'performance', icon: ICONS.gauge },
] as const;

export const STATS = ['realtime', 'ai', 'i18n', 'typescript'] as const;

export const STACK = [
  'React 19',
  'TypeScript',
  'Vite',
  'Tailwind CSS',
  'TanStack Query',
  'Zustand',
  'Socket.io',
  'NestJS',
  'Prisma',
  'PostgreSQL',
  'Google Gemini',
  'Stripe',
  'AWS EC2 · S3 · SES',
  'Nginx',
  'GitHub Actions',
  'Sentry',
];

export const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition hover:-translate-y-px';

export const primaryStyle: CSSProperties = {
  backgroundColor: 'var(--accent)',
  color: '#fff',
};

export const ghostStyle: CSSProperties = {
  borderColor: 'var(--border)',
  color: 'var(--text-h)',
};

export const gradientText: CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, #14b8a6 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export const INLINE = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
export const linkClass = 'underline-offset-4 hover:underline';
export const linkStyle = { color: 'var(--accent)' };
