# ISI - Business Development & Project Architecture Agent

## Overview

ISI is an autonomous Business Development & Project Architecture Agent designed to bridge the gap between raw client requests and final deal closure, followed by technical execution planning. The application provides a "Command Center" interface where users can paste client emails or notes, and ISI processes them through a 5-stage workflow to generate project estimates, proposals, and execution plans.

The system integrates multiple AI services (Gemini, Claude, OpenAI) for intelligent analysis and content generation, along with external services for PDF generation, email delivery, and presentation creation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom build script for production
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support

### Layout Structure

The application uses a three-panel "Command Center" layout:

- **Left Sidebar** (w-64): Project navigator with last 5 active projects and history access
- **Main Workspace** (flex-1): Chat interface, markdown viewer, and action buttons
- **Right Sidebar** (w-72): API health dashboard and system status

### Backend Architecture

- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build**: esbuild for server bundling, Vite for client
- **API Style**: RESTful JSON endpoints under `/api/*`

### Data Storage

- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Key Tables**:
  - `projects`: Main entity storing project state, scenarios, and outputs
  - `messages`: Chat history per project
  - `knowledgeEntries`: RAG knowledge base for learning from past projects
  - `apiHealthLogs`: Real-time API integration status tracking

### AI Integration Pattern

The application uses a multi-provider AI strategy configured via Replit AI Integrations:

- **Gemini**: Deep reasoning and logic via `@google/genai`
- **Claude**: Alternative reasoning via `@anthropic-ai/sdk`
- **OpenAI**: General-purpose AI tasks via `openai`

All AI clients are initialized conditionally based on environment variables, with health tracking for each service.

### Project Workflow (5 Stages)

1. Input parsing and mission extraction
2. Estimate generation with dual scenarios (High-Tech vs No-Code)
3. Production asset generation (PDFs, presentations)
4. Email composition and delivery
5. Execution plan generation

## External Dependencies

### AI Services

- **Google Gemini**: Primary reasoning engine (`AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`)
- **Anthropic Claude**: Secondary AI provider (`AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`)
- **OpenAI**: General AI tasks (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`)

### Document & Communication Services

- **PDF.co / pdfmake**: PDF proposal generation (using local pdfmake library)
- **Resend**: Email delivery with tracking (`RESEND_API_KEY`)
- **Gamma**: Presentation generation (planned integration)
- **Nano Banana**: Image generation (planned integration)

### Database

- **PostgreSQL**: Primary data store (`DATABASE_URL` environment variable required)
- **Drizzle ORM**: Database access layer with Zod validation via `drizzle-zod`

### Development Tools

- **Replit Plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`
