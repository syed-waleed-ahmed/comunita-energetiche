# Comunita Energetiche — AI Onboarding Platform

> **Closed Source** — See [LICENSE](LICENSE) for terms.

An AI-powered onboarding platform for Italian Renewable Energy Communities (_Comunita Energetiche Rinnovabili_, CER). Automates the full member lifecycle: registration, document collection, intelligent data extraction via GPT-4o Vision, multi-layer validation, and GSE Tracciato CSV generation.

Built as a **pnpm monorepo** with a domain-driven modular architecture, ready for MVP production deployment.

---

## Table of Contents

- [Comunita Energetiche — AI Onboarding Platform](#comunita-energetiche--ai-onboarding-platform)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [API Endpoints](#api-endpoints)
    - [Members](#members)
    - [Documents](#documents)
    - [Checklist](#checklist)
    - [Extractions](#extractions)
    - [Validation](#validation)
    - [Tracciato (GSE CSV)](#tracciato-gse-csv)
    - [Agent](#agent)
  - [AI Agent](#ai-agent)
    - [Usage](#usage)
  - [Testing](#testing)
  - [License](#license)

---

## Features

- **Member Management** — Full CRUD for consumer, producer, and prosumer members with all Italian registration fields
- **Document Handling** — Upload, store, and manage 16 document types (ID cards, utility bills, cadastral records, etc.)
- **AI Data Extraction** — GPT-4o Vision extracts structured data from PDFs and images with Zod-validated schemas
- **Multi-Layer Validation** — Row-level field validation via a JSON rule engine + cross-document consistency checks
- **GSE Tracciato Generation** — Produces compliant CSV batches for the Italian GSE authority
- **AI Onboarding Agent** — A conversational GPT-4o agent (Mastra Framework) with 9 tools and persistent PostgreSQL memory
- **Dynamic Checklists** — Automatically computes required documents per member type

---

## Architecture

The project follows a **domain-driven modular architecture** inside a pnpm monorepo:

```
                     ┌─────────────────────┐
                     │   apps/api           │   Fastify REST API
                     │  (modules, routes,   │   Zod-validated env
                     │   services, middleware)│  Auth + Error handling
                     └────────┬────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼──────┐ ┌─────▼──────┐ ┌──────▼───────┐
     │  packages/core │ │ packages/db│ │packages/mastra│
     │  Business logic│ │ Prisma     │ │ AI Agent +   │
     │  Validation    │ │ Singleton  │ │ 9 Tools      │
     │  Extraction    │ │ Client     │ │ CLI + Studio │
     └───────────────┘ └────────────┘ └──────────────┘
                              │
                     ┌────────▼────────┐
                     │   PostgreSQL     │
                     │   (Supabase)     │
                     └─────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + TypeScript (ES2020) |
| **API Framework** | Fastify 4 |
| **AI Agent** | Mastra Framework 1.8+ / OpenAI GPT-4o |
| **AI Extraction** | GPT-4o Vision (native PDF + image support) |
| **Database** | PostgreSQL via Prisma ORM |
| **Validation** | Zod 4 schemas + JSON rule engine |
| **Agent Memory** | @mastra/memory + @mastra/pg (persistent, per-session) |
| **Monorepo** | pnpm workspaces |
| **Testing** | Jest + ts-jest (22 tests) |

---

## Project Structure

```
comunita-energetiche/
│
├── apps/api/                        # Fastify REST API
│   └── src/
│       ├── server.ts                # Production entry point
│       ├── app.ts                   # Fastify factory (testable)
│       ├── config/env.ts            # Zod-validated environment config
│       ├── middleware/
│       │   ├── auth.ts              # API key authentication hook
│       │   └── errorHandler.ts      # Global error handler
│       └── modules/
│           ├── members/             # Member CRUD (routes + service)
│           ├── documents/           # Document upload (routes + service)
│           ├── checklist/           # Document checklist (routes)
│           ├── extractions/         # AI data extraction (routes + service)
│           ├── validation/          # Validation engine (routes + service)
│           ├── tracciato/           # GSE CSV generation (routes + service)
│           └── agent/               # AI agent chat (routes)
│
├── packages/db/                     # Shared singleton PrismaClient
│
├── packages/core/                   # Core business logic
│   └── src/
│       ├── docTypes.ts              # 16 document type definitions
│       ├── checklistConfig.ts       # Consumer / Producer checklists
│       ├── extractionSchemas.ts     # Zod extraction schemas (8 doc types)
│       ├── extractor.ts             # GPT-4o Vision document extractor
│       ├── crossValidation.ts       # Cross-document consistency checks
│       ├── validation.ts            # Field-level rule engine
│       ├── tracciato.ts             # GSE CSV columns + English→Italian mapping
│       └── validation.test.ts       # 22 tests
│
├── packages/mastra/                 # Mastra AI Agent
│   └── src/
│       ├── tools/                   # 9 agent tools (member, doc, validation, tracciato)
│       ├── mastra/agents/           # OnboardingOpsAgent definition
│       ├── agentSystemPrompt.ts     # Agent system prompt
│       ├── agents.ts                # Agent exports
│       └── cli.ts                   # Interactive CLI chat
│
├── prisma/
│   ├── schema.prisma                # 8-model database schema
│   └── rules.json                   # Validation rules config (field rules + enums)
│
├── scripts/seed.ts                  # Database seed script (consumer + producer)
├── .env.example                     # Environment variable template
├── pnpm-workspace.yaml              # Workspace configuration
└── tsconfig.json                    # Root TypeScript config
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8
- **PostgreSQL** (local or hosted — e.g., [Supabase](https://supabase.com))

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd comunita-energetiche

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, API_KEY, and at least one LLM key

# 4. Set up database
pnpm prisma:generate
npx prisma db push          # Sync schema to your database
pnpm seed                   # Optional: seed with test data

# 5. Start development
pnpm dev                    # Fastify API → http://localhost:3000
# OR
pnpm studio                 # Mastra Studio → http://localhost:4111
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_KEY` | Yes | API key for authenticating REST requests (`x-api-key` header) |
| `OPENAI_API_KEY` | Yes* | OpenAI API key (for GPT-4o extraction + agent) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google AI key (alternative LLM provider) |
| `NODE_ENV` | No | `development` / `production` (default: `development`) |
| `PORT` | No | API server port (default: `3000`) |
| `HOST` | No | API server host (default: `0.0.0.0`) |
| `CSV_DELIMITER` | No | CSV delimiter for Tracciato (default: `;`) |
| `UPLOAD_DIR` | No | File upload directory (default: `uploads`) |
| `TRACCIATO_DIR` | No | Tracciato output directory (default: `tracciato`) |
| `SUPABASE_URL` | No | Supabase project URL (for cloud storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key |

\* At least one LLM key is required for AI features.

---

## Available Scripts

All scripts are run from the monorepo root:

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Fastify API in dev mode (port 3000) |
| `pnpm build` | Build all packages |
| `pnpm start` | Start production server |
| `pnpm studio` | Start Mastra Studio agent UI (port 4111) |
| `pnpm agent:chat` | Interactive CLI chat with the AI agent |
| `pnpm test` | Run test suite (22 tests) |
| `pnpm seed` | Seed database with test data |
| `npx prisma db push` | Sync Prisma schema to database (recommended) |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:studio` | Open Prisma Studio (database browser) |

---

## API Endpoints

All endpoints require the `x-api-key` header (except `GET /` and `GET /health`).

### Members
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/members` | Create a new member |
| `GET` | `/members` | Search members (query params) |
| `GET` | `/members/:id` | Get member by ID |
| `PATCH` | `/members/:id/status` | Update member status |
| `PATCH` | `/members/:id/field` | Update a specific member field |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents` | Upload a document |
| `GET` | `/members/:id/documents` | List documents for a member |

### Checklist
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/members/:id/checklist` | Get document checklist status |

### Extractions
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/extractions/run` | Run AI data extraction on a document |
| `GET` | `/extractions/schemas` | List available extraction schemas |

### Validation
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/members/:id/validate` | Run full validation (row + cross-doc) |

### Tracciato (GSE CSV)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tracciato/batches` | Create a new Tracciato batch |
| `POST` | `/tracciato/batches/:id/generate` | Generate CSV for a batch |
| `GET` | `/tracciato/batches/:id/download` | Download generated CSV |

### Agent
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agent/chat` | Send a message to the AI agent |
| `DELETE` | `/agent/chat/:sessionId` | Clear agent chat session |

---

## AI Agent

The **OnboardingOpsAgent** is a GPT-4o conversational agent powered by the [Mastra Framework](https://mastra.ai) with persistent memory and 9 tools:

| Tool | Category | Description |
|------|----------|-------------|
| `register-member` | Members | Register a new CER member |
| `member-search` | Members | Search by name, email, fiscal code, POD, or VAT |
| `update-member-field` | Members | Update any whitelisted member field |
| `checklist-check` | Validation | Check document requirements |
| `validate-member` | Validation | Run row-level + cross-document validation |
| `extract-document` | Documents | Extract structured data from uploaded documents |
| `extract-local-file` | Documents | Process drag-and-drop file uploads via GPT-4o Vision |
| `list-documents` | Documents | List all documents for a member |
| `generate-tracciato` | Tracciato | Generate GSE-compliant CSV batch |

### Usage

| Method | Command | Access |
|--------|---------|--------|
| Mastra Studio (Web UI) | `pnpm studio` | http://localhost:4111 |
| CLI Chat | `pnpm agent:chat` | Terminal |
| REST API | `POST /agent/chat` | HTTP |

---

## Testing

```bash
pnpm test
```

Runs **22 tests** across 5 categories:

- Row-level field validation
- Checklist configuration
- Cross-document consistency checks
- Extraction schema validation
- Document extractor logic

---

## License

This project is **proprietary and closed source**. See the [LICENSE](LICENSE) file for full terms.

**TL;DR:** You may view this code as a reference only. You may **not** copy, modify, distribute, or use it in any project without explicit written permission from the author.
