# Comunita Energetiche — AI Onboarding Platform

> **Closed Source** — See [LICENSE](LICENSE) for terms.

An AI-powered onboarding platform for Italian Renewable Energy Communities (_Comunita Energetiche Rinnovabili_, CER). Automates the full member lifecycle: registration, document collection, intelligent data extraction via GPT-4o Vision, multi-layer validation, and GSE Tracciato CSV generation.

Built as a **pnpm monorepo** with a domain-driven modular architecture. The entire platform runs through the **Mastra AI Agent** — a conversational interface powered by GPT-4o with 9 specialized tools.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [AI Agent](#ai-agent)
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

The project uses a **Mastra-first architecture** — all functionality is accessed through the AI agent's tools, which call shared business logic packages directly:

```
                     ┌──────────────────────┐
                     │   Mastra Studio       │   Web UI (localhost:4111)
                     │   or CLI Chat         │   Interactive agent chat
                     └────────┬─────────────┘
                              │
                     ┌────────▼─────────────┐
                     │  packages/mastra      │   AI Agent + 9 Tools
                     │  OnboardingOpsAgent   │   GPT-4o powered
                     └────────┬─────────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
     ┌────────▼──────┐              ┌────────▼──────┐
     │  packages/core │              │  packages/db  │
     │  Business logic│              │  Prisma       │
     │  Validation    │              │  Singleton    │
     │  Extraction    │              │  Client       │
     └───────────────┘              └───────┬──────┘
                                            │
                                   ┌────────▼────────┐
                                   │   PostgreSQL     │
                                   │   (Supabase)     │
                                   └─────────────────┘
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Runtime** | Node.js + TypeScript (ES2020) |
| **AI Agent** | Mastra Framework 1.8+ / OpenAI GPT-4o |
| **AI Extraction** | GPT-4o Vision (native PDF + image support) |
| **Database** | PostgreSQL via Prisma ORM |
| **Validation** | Zod schemas + JSON rule engine |
| **Agent Memory** | @mastra/memory + @mastra/pg (persistent, per-session) |
| **Monorepo** | pnpm workspaces |
| **Testing** | Jest + ts-jest (22 tests) |

---

## Project Structure

```
comunita-energetiche/
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
├── packages/db/                     # Shared singleton PrismaClient
│
├── packages/mastra/                 # Mastra AI Agent (main entry point)
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
git clone https://github.com/syed-waleed-ahmed/comunita-energetiche.git
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
pnpm dev                    # Mastra Studio → http://localhost:4111
# OR
pnpm agent:chat             # Interactive CLI chat in terminal
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes* | OpenAI API key (for GPT-4o extraction + agent) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google AI key (alternative LLM provider) |
| `NODE_ENV` | No | `development` / `production` (default: `development`) |
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
| --- | --- |
| `pnpm dev` | Start Mastra Studio agent UI (http://localhost:4111) |
| `pnpm build` | Build all packages |
| `pnpm agent:chat` | Interactive CLI chat with the AI agent |
| `pnpm test` | Run test suite (22 tests) |
| `pnpm seed` | Seed database with test data |
| `npx prisma db push` | Sync Prisma schema to database |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:studio` | Open Prisma Studio (database browser) |

---

## AI Agent

The **OnboardingOpsAgent** is a GPT-4o conversational agent powered by the [Mastra Framework](https://mastra.ai) with persistent memory and 9 tools:

| Tool | Category | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| Mastra Studio (Web UI) | `pnpm dev` | http://localhost:4111 |
| CLI Chat | `pnpm agent:chat` | Terminal |

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
