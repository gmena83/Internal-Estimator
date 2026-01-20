# Project Structure and Architecture

## Overview

This project, **Internal-Estimator** (also known as **ISI - Intelligent Strategy Interface**), is an AI-powered business development agent designed to automate project estimation, proposal generation, and execution planning.

## Monorepo Architecture

The project uses **Turborepo** with **pnpm** workspaces:

```
├── apps/
│   ├── api/                    # Backend (Bun + Express + TypeScript)
│   └── web/                    # Frontend (Vite + React + TypeScript)
├── packages/
│   └── shared/                 # Shared types & database schema (@internal/shared)
├── scripts/                    # Build, seed, and utility scripts
├── tests/                      # Test suites (Vitest)
└── turbo.json                  # Monorepo orchestration
```

## Backend (`apps/api/`)

### Directory Structure

```
apps/api/src/
├── routes/                     # Express route handlers
│   ├── project-routes.ts       # CRUD for projects
│   ├── message-routes.ts       # Chat messages
│   ├── asset-routes.ts         # PDF, image, export generation
│   ├── email-routes.ts         # Email sending & drafts
│   ├── knowledge-routes.ts     # RAG knowledge base
│   └── admin-routes.ts         # Admin operations
├── services/
│   ├── ai/                     # AI orchestration layer
│   │   ├── providers/          # AI provider implementations
│   │   │   ├── base-provider.ts
│   │   │   ├── openai-provider.ts
│   │   │   └── gemini-provider.ts
│   │   ├── strategies/         # Business logic strategies
│   │   │   ├── chat-strategy.ts
│   │   │   ├── estimate-strategy.ts
│   │   │   ├── execution-strategy.ts
│   │   │   └── input-strategy.ts
│   │   ├── prompts/            # Prompt engineering
│   │   │   ├── templates.ts
│   │   │   └── prompt-builder.ts
│   │   ├── fallbacks/          # Error handling
│   │   └── orchestrator.ts     # Provider selection logic
│   ├── asset.service.ts        # Image generation
│   └── export-service.ts       # JSON/CSV exports
├── ai-service.ts               # Main AI service facade
├── storage.ts                  # Drizzle ORM database layer
├── auth.ts                     # Passport.js authentication
├── pdf-service.ts              # pdfmake PDF generation
├── email-service.ts            # Resend email integration
├── perplexity-service.ts       # Market research
├── usage-tracker.ts            # API cost tracking
└── index.ts                    # Express server entry point
```

### Key Technologies

- **Runtime**: Bun 1.3+
- **Framework**: Express.js
- **Database**: PostgreSQL via Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **PDF Generation**: pdfmake
- **Email**: Resend API

## Frontend (`apps/web/`)

### Key Technologies

- **Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 (Native CSS)
- **Components**: shadcn/ui + Radix UI
- **State**: TanStack Query
- **Routing**: Wouter

## Shared Package (`packages/shared/`)

Contains the Drizzle ORM schema and Zod validation schemas used by both frontend and backend:

- `schema.ts` - Database tables and TypeScript types
- Exported as `@internal/shared`

## AI Integration Pattern

The application uses a Strategy pattern for AI operations:

1. **Orchestrator** (`orchestrator.ts`) - Selects the appropriate provider
2. **Providers** - OpenAI, Gemini implementations
3. **Strategies** - Chat, Estimate, Execution business logic
4. **Prompts** - Template-based prompt engineering

## Data Flow

1. **Input**: User pastes client email/notes
2. **Processing**: `InputProcessingStrategy` extracts structured data
3. **Estimation**: `EstimateStrategy` generates dual scenarios (A/B)
4. **Assets**: PDF proposals, presentations, execution manuals
5. **Delivery**: Email with attachments via Resend

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start development (all workspaces)
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check

# Run tests
pnpm test
```

## Security

- Session-based authentication with secure cookies
- IDOR protection on all project routes
- Prompt injection mitigation via XML tags
- Production startup checks for SESSION_SECRET

