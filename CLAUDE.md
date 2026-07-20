# Pulse.Jc

Pulse.Jc is a real-time 1-to-1 chat web app (React.js + NestJS), built as a portfolio demo. Users sign up (email/password or Google), add contacts by email, chat in real time, and can also chat with an integrated AI assistant. Bilingual UI (es/en), light/dark theme.

**Stack**: React + TypeScript + Vite (frontend), NestJS + TypeScript (backend), PostgreSQL + Prisma, Socket.io for real-time, Google Gemini for the AI chat. Hosted on a single AWS EC2 instance (Nginx + PM2) with RDS PostgreSQL and S3. Full details in the docs below.

## Documentation map

Docs live in `.claude-context/` (not committed to git — internal working reference only, not part of the public repo). Read the relevant one on demand, based on what you're working on — don't load all of them by default:

- General architecture / stack → `.claude-context/ARCHITECTURE_OVERVIEW.md`
- Data model, business flows, socket events → `.claude-context/BACKEND_SPEC.md`
- Backend operational details (auth, rate limiting, etc.) → `.claude-context/BACKEND_REFINEMENTS.md`
- AWS infrastructure → `.claude-context/AWS_INFRASTRUCTURE.md`
- Frontend routes, screens, components → `.claude-context/FRONTEND_SPEC.md`
- Frontend UX/behavior details → `.claude-context/FRONTEND_REFINEMENTS.md`

These docs are currently in Spanish — they'll be translated to English in a later pass. Don't let the language mismatch stop you from reading and using them.

## Code change policy

Never use the Edit or Write tools to modify files. This rule has no exceptions, not even for trivial changes (a typo, an import, a config line) — `.claude/settings.json` already blocks this at the permissions level, so don't even attempt it.

The one exception is the session recap written by the `/wrap-up` command to `.claude-context/session-log/`, which is explicitly allowed in `.claude/settings.json`. Everything else — all actual project code — is off-limits to Edit/Write.

When asked to review a bug, implement something, or provide a piece of code, always follow this sequence:

1. **Investigate first.** Read the relevant files (`Read`, `Grep`, `Glob` are allowed) before responding. If you already have the necessary context from the conversation, no need to re-read everything, but never assume without verifying when it matters.
2. **Briefly explain** what's going on (if it's a bug: the root cause) or what you're about to do (if it's a new implementation) — 2-4 lines, no fluff.
3. **Lay out a step-by-step guide** of which files to touch and in what order, in plain prose before the code.
4. **Show the exact code** to implement, in code blocks in the chat, each one labeled with the file path (and, if it replaces something specific, which lines or block it replaces). I'll apply it manually.

If an Edit/Write tool call ever comes back denied by permissions, don't retry silently or change strategy without telling me — just follow the format above, not as an emergency fallback.

## Session memory

- At the end of a session, run `/wrap-up` to generate a recap (requested / confirmed / completed / pending) and save it to `.claude-context/session-log/`.
- At the start of each session, a `SessionStart` hook automatically loads `.claude-context/session-log/LATEST.md` into context — no need to ask for it manually.
