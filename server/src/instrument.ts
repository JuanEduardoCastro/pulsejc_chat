// replaces line 1: // Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
  release: process.env.SENTRY_RELEASE,
  // Tracing
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
  },
});
