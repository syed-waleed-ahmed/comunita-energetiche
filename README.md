# Comunità Energetiche AI Onboarding Backend (MVP)

This monorepo implements the backend MVP for an internal AI onboarding assistant for an Italian “Comunità Energetica” ops team.

---

## Features (MVP Scope)
- Ingest member data (CSV/Excel or API)
- Track document checklist per member (ID, bill, payment, configurable)
- Upload/store documents (PDF/JPG/PNG) and link to members
- Extract key fields from documents (schema-driven, stubbed for MVP)
- Validate/flag inconsistencies using deterministic rules (from Excel template or JSON)
- Generate “Tracciato caricamento POD” output as CSV (portal-ready)
- API endpoints for search, checklist, issues, tracciato, download
- Mastra agent/tools for ops automation and UI testing

## Tech Stack
- TypeScript + Node.js
- Fastify
- Prisma ORM + Postgres (Supabase recommended)
- Zod for validation
- In-process job runner (MVP)
- Supabase Storage/local for files
- Mastra for agent orchestration
- pnpm workspaces monorepo

## Project Structure
- `apps/api` — Fastify API app
- `packages/core` — Domain logic: rules, validators, tracciato generator
- `packages/mastra` — Mastra agent/tools
- `prisma` — Prisma schema, rules.json
- `scripts` — Seed, import, parse-template

## Quickstart

### 1. Install dependencies
```sh
npm install -g pnpm
pnpm install
```

### 2. Set up environment
- Copy `.env.example` to `.env` and fill in your Supabase/Postgres connection string and API key.
- For local dev, use Supabase free tier (see below).

### 3. Run DB migrations
```sh
pnpm exec prisma migrate dev --name init --schema=prisma/schema.prisma
```

### 4. Seed test data
```sh
pnpm exec ts-node scripts/seed.ts
```

### 5. Start the API
```sh
pnpm dev
```

### 6. Run Mastra agent/tools
```sh
pnpm mastra
```

### 7. Run tests
```sh
pnpm --filter @ce/packages-core test
```

---

## Deployment Guide

### Option A: Supabase + Render/Railway/Fly.io
- Use [Supabase](https://supabase.com/) for free Postgres + Storage.
- Deploy API to [Render](https://render.com/), [Railway](https://railway.app/), or [Fly.io](https://fly.io/).
- Set environment variables as in `.env.example`.

### Option B: Railway All-in-One
- Use [Railway](https://railway.app/) for both Postgres and Node app.
- Set environment variables as in `.env.example`.

### Docker (optional)
A sample Dockerfile can be added for containerized deployment.

---

## API Endpoints (MVP)
- `POST /members` — create member
- `GET /members?query=` — search
- `GET /members/:id` — detail
- `POST /members/import` — import CSV/Excel (to be implemented)
- `POST /documents` — upload document (multipart)
- `GET /members/:id/documents` — list documents
- `GET /members/:id/checklist` — checklist
- `POST /extractions/run` — run extraction (stub)
- `POST /members/:id/validate` — validate member
- `POST /tracciato/batches` — create batch
- `POST /tracciato/batches/:id/generate` — generate CSV
- `GET /tracciato/batches/:id/download?type=csv` — download CSV

All endpoints require `x-api-key` header.

---

## Mastra Agent
- See `packages/mastra` for agent/tools.
- Run with `pnpm mastra` for local dev/testing.

---

## Testing
- Unit tests for rule engine and validators: `pnpm --filter @ce/packages-core test`
- Seed script: `pnpm exec ts-node scripts/seed.ts`

---

## Observability & Security
- Minimal request logging
- API key auth (header: x-api-key)
- No PII in logs

---

## File Storage
- For dev: local `/uploads` and `/tracciato` folders
- For prod: use Supabase Storage bucket (see Supabase docs)

---

## Excel Template & Rules
- See `prisma/rules.json` for hardcoded rules (can be loaded from Excel in future)

---

## Contact
For questions, contact the backend maintainer.
