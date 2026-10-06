# Pulse.Jc

[![CI/CD](https://github.com/JuanEduardoCastro/pulsejc_chat/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/JuanEduardoCastro/pulsejc_chat/actions/workflows/ci-cd.yml)

**Real-time 1-to-1 chat with an AI assistant that streams its replies.** A full-stack TypeScript app — React and NestJS over Socket.io — deployed on AWS with CI/CD, error monitoring and Stripe subscriptions.

**Live demo → [pulsejc.com](https://pulsejc.com)**

<p align="center">
  <img src="docs/screenshots/pulsejc_home_screen_dark_desktop.jpg" alt="Pulse.Jc home page in dark mode" width="800" />
</p>

<p align="center">
  <img src="docs/screenshots/pulsejc_ai_screen_light_desktop.jpg" alt="AI assistant streaming a reply, light mode" width="560" />
  &nbsp;
  <img src="docs/screenshots/pulsejc_chat_screen_dark_mobile.jpg" alt="Chat on mobile, dark mode" width="220" />
</p>

---

## Try the demo

Sign up with email or Google — or log in with one of the shared demo accounts, which already have a contact, a conversation and a pending contact request:

| Account | Email | Password |
| --- | --- | --- |
| Alex | `demo1@example.com` | `Demo1234` |
| Ana | `demo2@example.com` | `Demo1234` |

Open Alex in a normal window and Ana in a private window to see real-time messaging, presence, typing indicators and read receipts between them. Payments run in **Stripe test mode**: use the card `4242 4242 4242 4242` with any future date and CVC.

The demo accounts are shared, so profile changes, adding or removing contacts and account deletion are disabled on them, and they reset every night. To try everything, create your own account.

## Features

- **Real-time messaging** over WebSockets, with online presence, typing indicators and read receipts.
- **AI assistant** powered by Google Gemini. Replies **stream in word by word**, in the user's language, with live retry status when the model is busy.
- **Contacts and notifications:** add people by email, accept or decline requests, and get notified in real time.
- **Free and Pro plans** with Stripe Checkout and the Customer Portal; Pro raises the daily AI message limit.
- **Accounts:** email/password or Google sign-in, password reset by email, profile and avatar editing, and self-service account deletion.
- **Bilingual (English / Spanish)** and **light / dark** themes, saved to the account.
- **Responsive** from 360 px phones to desktop.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Hook Form + Zod, i18next, Socket.io client |
| Backend | NestJS, TypeScript, Socket.io, Prisma, PostgreSQL, Passport (JWT + Google OAuth) |
| Integrations | Google Gemini API, Stripe (Checkout, Customer Portal, webhooks), Amazon S3, Amazon SES |
| Infrastructure | AWS EC2 (Nginx + PM2), self-hosted PostgreSQL, Route 53, Let's Encrypt |
| Quality & ops | Jest (unit + e2e), ESLint, GitHub Actions CI/CD, Sentry, UptimeRobot |

## Architecture

```mermaid
flowchart LR
    Browser["Browser<br/>React SPA"]

    subgraph EC2["AWS EC2"]
        Nginx["Nginx<br/>static files + reverse proxy"]
        API["NestJS API<br/>REST + Socket.io (PM2)"]
        DB[("PostgreSQL")]
    end

    Browser -- "HTTPS /api" --> Nginx
    Browser -- "WebSocket /socket.io" --> Nginx
    Nginx --> API
    API --> DB
    API --> Gemini["Google Gemini"]
    API --> Stripe["Stripe"]
    API --> S3["Amazon S3<br/>avatars"]
    API --> SES["Amazon SES<br/>email"]
    Stripe -- "webhooks" --> Nginx
    Browser -. "errors" .-> Sentry["Sentry"]
    API -. "errors" .-> Sentry
```

Nginx serves the React build and proxies `/api` and `/socket.io` to NestJS. The JWT is checked both on REST routes and on the WebSocket handshake.

## Technical highlights

- **Streaming AI replies over Socket.io.** The Gemini stream is forwarded to the user's room as it's generated. Each event carries the *accumulated* text, so a client that misses an event still renders the full reply. On the client, the in-progress reply is a placeholder message in the React Query cache that gets swapped for the saved message in a single update — no flicker, no duplicate.
- **AI resilience and limits.** Transient Gemini errors are retried with backoff and the user sees "busy, retrying (1/2)". A daily-quota 429 is told apart from a per-minute one by reading Gemini's `RetryInfo`, so it fails fast instead of burning more quota. Each user has a rolling 24-hour message limit (Free 10 / Pro 300) checked server-side before anything is saved.
- **Cookie-based auth.** Access and refresh tokens live in httpOnly cookies — never in JavaScript. Refresh tokens rotate on every use, and the client retries failed requests after a single shared silent refresh.
- **Idempotent Stripe webhooks.** Every event just re-fetches the subscription from Stripe and writes its current state, so duplicate or out-of-order events converge without a processed-events table.
- **Performance.** Routes and modals are lazy-loaded and libraries live in a long-lived vendor chunk; Sentry Session Replay is loaded from its CDN after startup. The initial bundle went from 867 kB to under half, and most deploys only change a ~60 kB chunk.
- **Security.** Helmet plus a strict Content Security Policy at the Nginx level, rate limiting (stricter on auth and billing routes), bcrypt password hashing, and Google sign-in through the server-side OAuth flow with no tokens in URLs.
- **Safe shared demo accounts.** A guard blocks destructive actions on the public demo accounts, they're exempt from the per-user session cap so several visitors can use them at once, and a scheduled job rebuilds them every night (and on each deploy) with the same cascade as a real account deletion.
- **Production operations.** GitHub Actions runs lint, type checks, unit and e2e tests (against a real PostgreSQL service) on every pull request. Merging to `main` deploys to EC2 using short-lived AWS credentials via OIDC and a temporary SSH rule — no long-lived keys or open SSH port. Errors from the API, the WebSocket gateway and the React app are reported to Sentry.

## Project structure

```
pulsejc/
├── client/                 # React + Vite SPA
│   └── src/
│       ├── screens/        # home, auth, chat, legal pages (lazy-loaded)
│       ├── components/     # chat, modals, home page, common UI
│       ├── hooks/          # useSocket (real-time events → React Query cache), …
│       ├── stores/         # Zustand: auth, UI, presence
│       ├── queries/        # TanStack Query hooks
│       └── locales/        # en / es translations
├── server/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # JWT cookies, refresh rotation, Google OAuth
│   │   ├── chat/           # REST + ChatGateway (Socket.io)
│   │   ├── ai/             # Gemini provider (streaming), usage limits
│   │   ├── billing/        # Stripe Checkout, portal, webhooks
│   │   ├── contacts/  users/  notifications/  mail/  uploads/
│   │   └── …
│   ├── prisma/             # schema, migrations, seed
│   └── test/               # e2e tests
├── scripts/deploy.sh       # build and restart on EC2
└── .github/workflows/      # CI/CD pipeline
```

## Running locally

**Requirements:** Node.js 24, PostgreSQL, and accounts for the external services you want to use (Google OAuth, Gemini API, Stripe test mode, AWS S3/SES).

```bash
git clone https://github.com/JuanEduardoCastro/pulsejc_chat.git
cd pulsejc_chat
npm install                      # installs both workspaces (client and server)
```

Create `server/.env`:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/pulsejc
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
PORT=3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

AI_API_KEY=                      # Gemini API key
# AI_MODEL=gemini-3.1-flash-lite # optional

AWS_REGION=us-east-1
S3_BUCKET_NAME=
AWS_SES_FROM_EMAIL=

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # printed by `stripe listen`
STRIPE_PRICE_ID=price_...

# SENTRY_DSN=                    # optional
```

Create `client/.env`:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=
# VITE_SENTRY_DSN=               # optional
```

Set up the database and start both apps:

```bash
cd server
npx prisma migrate dev           # create the schema
cd ..

npm run dev:server               # API on http://localhost:3000
npm run dev:client               # app on http://localhost:5173
```

The demo accounts (see "Try the demo") are created automatically when the server starts.

To test subscriptions locally, forward Stripe webhooks with the Stripe CLI:

```bash
stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted \
  --forward-to localhost:3000/api/billing/webhook
```

## Tests

```bash
cd server
npm test                         # unit tests (auth, contacts, chat, billing, AI usage, gateway)
npm run test:e2e                 # e2e tests against a test database (server/.env.test)
```

Both suites run in CI on every pull request, along with lint and type checks for the client and the server.

## Known limitations

This is a portfolio project, and some trade-offs are deliberate:

- **Stripe runs in test mode** — no real payments.
- **Gemini's free tier** is shared by all users (500 requests per day), and Google may use those prompts to improve its products. The privacy policy says so, and users are warned not to share personal information with the AI.
- **Single EC2 instance** with self-hosted PostgreSQL and on-instance daily backups — chosen for cost, not high availability.
- **Frontend tests** are not in place yet; the backend has unit and e2e coverage.

## Roadmap

- Group chats (the data model already supports them).
- Sending images, audio and files in chats (message fields already exist).
- Frontend tests with Vitest + React Testing Library and a Playwright flow.
- A React Native app reusing the same API.

## Author

**Juan Eduardo Castro** — [GitHub](https://github.com/JuanEduardoCastro) · contact@pulsejc.com

© 2026 Juan Eduardo Castro. All rights reserved. The source code is public for review as part of a portfolio.
