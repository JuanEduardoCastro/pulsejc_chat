import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  dataCollection: {
    userInfo: false,
  },
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

Sentry.lazyLoadIntegration('replayIntegration')
  .then((replayIntegration) => Sentry.addIntegration(replayIntegration()))
  .catch(() => {
    // Replay is optional: if the CDN is blocked (ad blocker, CSP), errors are still reported
  });
