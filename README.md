# Comunità Energetiche AI Onboarding — Backend MVP

An AI-powered onboarding assistant for Italian Renewable Energy Communities (_Comunità Energetiche Rinnovabili_). Automates member registration, document collection, data extraction, cross-validation, and GSE Tracciato generation — with a Mastra LLM agent for natural-language interaction.

---

## 📁 Project Structure

```
comunità-energetiche/
│
├── apps/api/                        # ── Fastify REST API ──
│   └── src/
│       ├── index.ts                 # Server entrypoint & route registration
│       ├── routes.members.ts        # Member CRUD + field updates
│       ├── routes.documents.ts      # Document upload & listing
│       ├── routes.checklist.ts      # Dynamic document checklist (consumer/producer)
│       ├── routes.extractions.ts    # Data extraction from documents
│       ├── routes.validation.ts     # Row-level + cross-document validation
│       ├── routes.tracciato.ts      # GSE Tracciato CSV generation
│       └── routes.agent.ts          # LLM Agent chat endpoint
│
├── packages/core/                   # ── Core Business Logic ──
│   └── src/
│       ├── docTypes.ts              # 15 document type definitions
│       ├── checklistConfig.ts       # Consumer / Producer checklists
│       ├── extractionSchemas.ts     # Zod extraction schemas (8 doc types)
│       ├── extractor.ts             # Schema-driven document extractor
│       ├── crossValidation.ts       # Cross-document consistency checks
│       ├── validation.ts            # Field-level rule engine
│       ├── tracciato.ts             # GSE CSV column definitions
│       ├── validation.test.ts       # Test suite (22 tests)
│       └── index.ts                 # Barrel exports
│
├── packages/mastra/                 # ── Mastra AI Agent ──
│   └── src/
│       ├── mastra/                  # Mastra instance (for Studio)
│       │   ├── index.ts             # Mastra({ agents }) registration
│       │   └── agents/
│       │       └── OnboardingOpsAgent.ts  # Agent definition (GPT-4o-mini)
│       ├── tools.ts                 # 7 agent tools (createTool)
│       ├── agentSystemPrompt.ts     # System prompt (consumer/producer aware)
│       └── cli.ts                   # Interactive CLI chat
│
├── prisma/
│   ├── schema.prisma                # Database schema (Member, Document, etc.)
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

# 4. Start the API server
pnpm dev                    # → http://localhost:3000

# 5. Open Mastra Studio (new terminal)
pnpm studio                 # → http://localhost:4111

# 6. Or chat via CLI (new terminal)
pnpm agent:chat
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/members` | Create member (consumer or producer) |
| `GET` | `/members` | Search members by name/CF/POD/VAT |
| `GET` | `/members/:id` | Get member detail |
| `PATCH` | `/members/:id/field` | Update a single member field |
| `POST` | `/documents` | Upload a document (multipart) |
| `GET` | `/members/:id/documents` | List documents for a member |
| `GET` | `/members/:id/checklist` | Dynamic document checklist |
| `POST` | `/extractions/run` | Extract data from a document |
| `GET` | `/extractions/schemas` | List available extraction schemas |
| `POST` | `/members/:id/validate` | Run validation (row + cross-doc) |
| `POST` | `/tracciato/batches` | Create tracciato batch |
| `POST` | `/tracciato/batches/:id/generate` | Generate GSE CSV |
| `POST` | `/agent/chat` | Chat with the LLM agent |
| `DELETE` | `/agent/chat/:sessionId` | Clear agent session |

---

## 🤖 Mastra Agent

The **OnboardingOpsAgent** is a real LLM-backed agent (OpenAI GPT-4o-mini) with 7 tools:

| Tool | What it does |
|------|-------------|
| `member-search` | Find members by name, fiscal code, POD, or VAT |
| `checklist-check` | Check document requirements for a member |
| `validate-member` | Run validation (row-level + cross-document) |
| `extract-document` | Extract structured data from a document |
| `list-documents` | List all documents for a member |
| `update-member-field` | Update member profile fields |
| `generate-tracciato` | Generate GSE Tracciato CSV batch |

### Three ways to use the agent:

| Method | Command | URL |
|--------|---------|-----|
| **Mastra Studio** (web UI) | `pnpm studio` | http://localhost:4111 |
| **CLI Chat** | `pnpm agent:chat` | Terminal |
| **REST API** | `POST /agent/chat` | http://localhost:3000/agent/chat |

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
| `pnpm dev` | Start the Fastify API server (port 3000) |
| `pnpm studio` | Start Mastra Studio web UI (port 4111) |
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
| API | Fastify |
| Database | Prisma ORM (PostgreSQL) |
| Validation | Zod schemas + JSON rule engine |
| AI Agent | Mastra Framework + OpenAI GPT-4o-mini |
| Monorepo | pnpm workspaces |
| Testing | Jest + ts-jest |
