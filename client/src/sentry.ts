import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  dataCollection: {
    userInfo: false,
  },
  // Session Replay
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
