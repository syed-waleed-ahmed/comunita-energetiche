# Comunità Energetiche AI Onboarding — Monolith Agent

An AI-powered onboarding assistant for Italian Renewable Energy Communities (_Comunità Energetiche Rinnovabili_). Automates member registration, document collection, data extraction (GPT-4o Vision), cross-validation, and GSE Tracciato generation — running as a **self-contained monolith** with direct database access.

---

## 📁 Project Structure

```
comunità-energetiche/
│
├── apps/api/                        # ── Fastify REST API (legacy, optional) ──
│   └── src/
│       ├── index.ts                 # Server entrypoint
│       ├── routes.members.ts        # Member CRUD
│       ├── routes.documents.ts      # Document upload
│       ├── routes.checklist.ts      # Document checklist
│       ├── routes.extractions.ts    # Data extraction
│       ├── routes.validation.ts     # Validation
│       ├── routes.tracciato.ts      # GSE CSV generation
│       └── routes.agent.ts          # Agent chat endpoint
│
├── packages/core/                   # ── Core Business Logic ──
│   └── src/
│       ├── docTypes.ts              # 16 document type definitions
│       ├── checklistConfig.ts       # Consumer / Producer / Prosumer checklists
│       ├── extractionSchemas.ts     # Zod extraction schemas
│       ├── extractor.ts             # GPT-4o Vision document extractor
│       ├── crossValidation.ts       # Cross-document consistency checks
│       ├── validation.ts            # Field-level rule engine
│       ├── tracciato.ts             # GSE CSV column definitions
│       └── index.ts                 # Barrel exports
│
├── packages/mastra/                 # ── Mastra AI Agent (Monolith) ──
│   └── src/
│       ├── lib/
│       │   ├── prisma.ts            # Shared PrismaClient singleton
│       │   └── extractor.ts         # Shared DocumentExtractor singleton
│       ├── tools/
│       │   ├── index.ts             # Barrel export (9 tools)
│       │   ├── memberTools.ts       # Search + Register + Update
│       │   ├── documentTools.ts     # Extract + List + Upload
│       │   ├── validationTools.ts   # Checklist + Validate
│       │   └── tracciatoTools.ts    # GSE CSV generation
│       ├── mastra/
│       │   ├── index.ts             # Mastra instance registration
│       │   └── agents/
│       │       └── OnboardingOpsAgent.ts  # Agent (GPT-4o + 9 tools)
│       ├── agentSystemPrompt.ts     # System prompt (full registration aware)
│       └── cli.ts                   # Interactive CLI chat
│
├── prisma/
│   ├── schema.prisma                # Database schema (Member with 30+ fields)
│   └── rules.json                   # Validation rules configuration
│
├── scripts/
│   └── seed.ts                      # Seed script (consumer + producer members)
│
├── docs necessari iscrizione/       # Real enrollment document samples
│   ├── consumatore/                 # Consumer: ID, bill, Visura
│   └── produttore/                  # Producer: GAUDÌ, nameplates, schematics
│
├── package.json                     # Monorepo root with convenience scripts
├── pnpm-workspace.yaml              # Workspace configuration
├── tsconfig.json                    # Root TypeScript config
├── .env.example                     # Environment variable template
└── .gitignore                       # Comprehensive ignore rules
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env → set DATABASE_URL and OPENAI_API_KEY

# 3. Set up database
pnpm prisma:migrate
pnpm seed

# 4. Start Mastra Studio (the only thing you need!)
pnpm studio                 # → http://localhost:4111
```

> **Note:** You do NOT need to run `pnpm dev` (the Fastify API). The Mastra agent runs as a self-contained monolith with direct database and AI access.

---

## 🤖 Mastra Agent — Monolith Architecture

The **OnboardingOpsAgent** is a GPT-4o agent with **9 modular tools**, **PostgreSQL-backed persistent memory**, and **native database access** — no HTTP API layer needed.

| Tool | Module | What it does |
|------|--------|-------------|
| `register-member` | `memberTools` | Register a new member with all registration fields |
| `member-search` | `memberTools` | Find members by name, email, CF, POD, or VAT |
| `update-member-field` | `memberTools` | Update any member field (with whitelist) |
| `checklist-check` | `validationTools` | Check document requirements for a member |
| `validate-member` | `validationTools` | Run row-level + cross-document validation |
| `extract-document` | `documentTools` | Extract structured data from a document |
| `extract-local-file` | `documentTools` | Process drag-and-drop file uploads via GPT-4o Vision |
| `list-documents` | `documentTools` | List all documents for a member |
| `generate-tracciato` | `tracciatoTools` | Generate GSE Tracciato CSV batch |

### Registration Form Coverage

The agent covers **100% of the fields** from the [live registration form](https://comunitaenergetica.eu/registrazione-soci/):

- ✅ Identity (name, surname, fiscal code, gender)
- ✅ Birth data (place, province, country, date)
- ✅ Address (street, house number, city, province, CAP)
- ✅ Contacts (phone, mobile, email)
- ✅ Financial (IBAN, profession)
- ✅ Member type (Consumer / Producer / Prosumer)
- ✅ Document uploads (ID, bills, payment receipt)
- ✅ Consent tracking (privacy, statute, regulation)

### How to use the agent:

| Method | Command | URL |
|--------|---------|-----|
| **Mastra Studio** (web UI) | `pnpm studio` | http://localhost:4111 |
| **CLI Chat** | `pnpm agent:chat` | Terminal |

---

## 🧪 Testing

```bash
pnpm test
```

**22 tests** across 5 categories: row validation, checklist config, cross-validation, extraction schemas, document extractor.

---

## 🔧 All Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm studio` | **Start Mastra Studio** (main entry point, port 4111) |
| `pnpm dev` | Start the legacy Fastify API (port 3000, optional) |
| `pnpm agent:chat` | Interactive CLI chat with the agent |
| `pnpm test` | Run the test suite |
| `pnpm seed` | Seed the database with test data |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:studio` | Open Prisma Studio (DB browser) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| AI Agent | Mastra Framework + OpenAI GPT-4o |
| Database | Prisma ORM (PostgreSQL / Supabase) |
| AI Extraction | OpenAI GPT-4o Vision (native PDF + image) |
| Validation | Zod schemas + JSON rule engine |
| Memory | @mastra/memory + @mastra/pg (persistent) |
| Monorepo | pnpm workspaces |
| Testing | Jest + ts-jest |
