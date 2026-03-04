# Hermes Dashboard

Hermes Dashboard is an MIT-licensed, local-first control center for AI marketing operations on top of OpenClaw.

It unifies CRM, outreach, content, analytics, approvals, automations, and agent ops in one Next.js + SQLite app that can run with zero external infrastructure.

Last reviewed: 2026-03-04

## Screenshots

### Overview

![Hermes Dashboard Overview](./public/hermes-dashboard-overview.png)

### CRM

![Hermes Dashboard Mission Control](./public/hermes-dashboard-mission-control.png)

## Core Features

- CRM pipeline with lead records, source tracking, and funnel views
- Outreach operations with sequencing, pause controls, and audit logs
- Content system with calendar, item tracking, and performance endpoints
- Analytics and KPI surfaces for growth and operator visibility
- Agent workspace, comms, squads, and dynamic OpenClaw agent discovery
- Cron jobs and templates for repeatable research and automation workflows
- Role-based access with session auth and optional API key access
- Local SQLite-backed APIs with no required managed backend

## Architecture

- Frontend: Next.js App Router + React + TypeScript
- Backend: Next.js API routes
- Data: SQLite (local)
- Agent runtime: OpenClaw CLI + filesystem integrations
- Auth: Local user/session auth, optional Google SSO

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Bootstrap environment

```bash
pnpm env:bootstrap
```

This creates `.env.local` with generated secure defaults and placeholders.

### 3. Configure required auth values

Required:

- `AUTH_USER`
- `AUTH_PASS` (minimum 10 characters)
- `API_KEY`
- `AUTH_COOKIE_SECURE` (`false` for local HTTP, `true` for HTTPS)

### 4. Run the app

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Optional 1Password Runtime Overlay

Hermes supports optional 1Password env resolution with fallback to local environment values.

- `HERMES_1PASSWORD_MODE=off`: never use 1Password
- `HERMES_1PASSWORD_MODE=auto` (default): try 1Password, fallback to existing env
- `HERMES_1PASSWORD_MODE=required`: fail startup if 1Password resolution fails
- `HERMES_OP_ENV_FILE=/etc/hermes-dashboard/hermes-dashboard.op.env`: custom op env mapping file

Reference template:

- `ops/1password/hermes-dashboard.op.env.example`

## OpenClaw Integration Notes

- Designed for OpenClaw-based agent workflows and cron automation.
- Cron compatibility supports both `jobId` and legacy `id` fields.
- Schedule rendering handles `cron`, `every`, and `at` schedule kinds.
- Deploy status includes OpenClaw config preflight validation (`openclaw config validate --json`).

## Host Access Lock

Default behavior keeps Hermes local-first.

- `HERMES_HOST_LOCK=local` (default): allows `localhost`, `127.0.0.1`, and Tailscale hosts
- `HERMES_HOST_LOCK=off`: disables host lock
- `HERMES_HOST_LOCK=host1,host2`: explicit allowlist

## Authentication Model

- Protected pages and API routes require authenticated sessions.
- API routes also support `x-api-key` when it matches `API_KEY`.
- When the users table is empty, first admin is seeded from `AUTH_USER` + `AUTH_PASS`.
- There are no hardcoded fallback credentials.
- Roles: `admin`, `editor`/`operator`, `viewer`.

## Scripts

- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm start`
- `pnpm seed`
- `pnpm env:bootstrap`
- `pnpm prepare:standalone`
- `pnpm build:standalone`

## Template-Ready Export and Hygiene

Before sharing or publishing as a template:

```bash
./scripts/template-audit.sh
./scripts/template-export.sh [output_dir]
```

The export flow excludes sensitive/runtime artifacts such as `.env*`, databases, `.next`, `node_modules`, and local state.

## Open Source and Governance

- License: [MIT](./LICENSE)
- Security policy: [SECURITY.md](./SECURITY.md)
- Contributing guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)

## Security Reminder

Do not commit real credentials, API tokens, or personal data. Use `.env.local`, 1Password references, and the template export scripts for safe distribution.
