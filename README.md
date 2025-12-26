# ISI - Intelligent Strategy Interface

> An autonomous Business Development & Project Architecture Agent that transforms client requests into complete project proposals, execution plans, and deliverables.

![ISI Command Center](https://img.shields.io/badge/Status-Production-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![Node.js](https://img.shields.io/badge/Node.js-20-339933)

## Overview

ISI (Intelligent Strategy Interface) bridges the gap between raw client requests and final deal closure. Paste a client email or brief, and ISI processes it through a sophisticated 5-stage workflow to generate professional estimates, proposals, execution guides, and delivers them directly to clients via email with PDF attachments.

The system orchestrates multiple AI services (Google Gemini, Anthropic Claude, OpenAI, Perplexity) to provide intelligent analysis, market research, and content generation - all presented through an elegant "Command Center" interface with real-time API health monitoring.

## Key Features

### 5-Stage Autonomous Workflow

1. **Mission Extraction** - AI parses client input to identify project scope, requirements, and deliverables
2. **Dual-Scenario Estimates** - Generates High-Tech (custom development) vs No-Code solutions with detailed breakdowns
3. **Production Assets** - Creates professional PDF proposals, internal reports, and presentations
4. **Client Communication** - Email preview and delivery with PDF attachments
5. **Execution Planning** - Comprehensive guides with collapsible task checklists

### Multi-AI Orchestration

- **Google Gemini** - Primary reasoning engine for deep analysis
- **Anthropic Claude** - Alternative reasoning and content generation
- **OpenAI** - General-purpose AI tasks
- **Perplexity** - Real-time market research and competitive analysis

### Command Center Interface

- **Three-Panel Layout** - Left sidebar for project navigation, main workspace for chat/documents, right sidebar for API health
- **Glass Morphism UI** - Modern design with dark theme (#0E0F11 background, #1AD5E6 accent)
- **Real-Time Monitoring** - Live API health status with latency tracking
- **Dark/Light Theme** - Full theme support with consistent design tokens

### Document Generation

- **PDF Proposals** - Professional styling (dark blue #0A3A5A, cyan #00B8D4 accents)
- **Internal Reports** - Detailed analysis for internal stakeholders
- **Execution Manuals** - 9-section guides with task breakdowns
- **Markdown Export** - All documents available as Markdown

### Project Management

- **Project-Specific API Usage Tracking** - Cost monitoring per project
- **File Upload Support** - PDF, Word, Excel document processing
- **Email Integration** - Preview, edit, and send with Resend API
- **Knowledge Base** - RAG system for learning from past projects

## Security & Vulnerabilities

- **Known Issue**: `npm audit` reports high-severity vulnerabilities in `xlsx` (imported as `xlsx`). This is currently used in `server/pricing-matrix.ts` to read legacy pricing data.
  - **Mitigation**: Access is limited to internal server-side reading of local files.
  - **Recommendation**: Refactor to use `.json` or `exceljs`.

## Technology Stack

### Frontend

| Technology     | Purpose                 |
| -------------- | ----------------------- |
| React 18       | UI framework            |
| TypeScript     | Type safety             |
| Vite           | Build tool & dev server |
| Tailwind CSS   | Styling                 |
| shadcn/ui      | Component library       |
| Radix UI       | Accessible primitives   |
| TanStack Query | Server state management |
| Wouter         | Lightweight routing     |
| Framer Motion  | Animations              |

### Backend

| Technology  | Purpose         |
| ----------- | --------------- |
| Node.js     | Runtime         |
| Express     | HTTP server     |
| TypeScript  | Type safety     |
| Drizzle ORM | Database access |
| Zod         | Validation      |
| pdfmake     | PDF generation  |
| Resend      | Email delivery  |

### Database

| Technology  | Purpose                    |
| ----------- | -------------------------- |
| PostgreSQL  | Primary data store         |
| Drizzle ORM | Query builder & migrations |
| drizzle-zod | Schema validation          |

### AI Services

| Service          | Purpose           |
| ---------------- | ----------------- |
| Google Gemini    | Primary reasoning |
| Anthropic Claude | Alternative AI    |
| OpenAI           | General tasks     |
| Perplexity       | Market research   |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ISI Command Center                          │
├─────────────────┬───────────────────────────┬───────────────────┤
│   Left Sidebar  │      Main Workspace       │   Right Sidebar   │
│   (w-64)        │      (flex-1)             │   (w-72)          │
│                 │                           │                   │
│ - Recent        │ - Chat Interface          │ - API Health      │
│   Projects      │ - Markdown Viewer         │ - Project Stats   │
│ - Project       │ - Stage Progress          │ - Usage Metrics   │
│   History       │ - Action Buttons          │ - System Status   │
│ - Quick         │ - Document Tabs           │                   │
│   Actions       │ - File Management         │                   │
└─────────────────┴───────────────────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Backend Services                          │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Express    │   AI Layer   │  PDF/Email   │     Database       │
│   Routes     │              │              │                    │
│              │ - Gemini     │ - pdfmake    │ - PostgreSQL       │
│ /api/*       │ - Claude     │ - Resend     │ - Drizzle ORM      │
│              │ - OpenAI     │              │                    │
│              │ - Perplexity │              │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

### Database Schema

```typescript
// Key Tables
projects; // Main entity: state, scenarios, outputs
messages; // Chat history per project
knowledgeEntries; // RAG knowledge base
apiHealthLogs; // Real-time API status tracking
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- API keys for AI services

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI Services (via Replit AI Integrations)
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_GEMINI_BASE_URL=...
AI_INTEGRATIONS_ANTHROPIC_API_KEY=...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=...
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...

# External Services
PERPLEXITY_API_KEY=...
RESEND_API_KEY=...

# Security
SESSION_SECRET=...
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── action-buttons.tsx
│   │   │   ├── main-workspace.tsx
│   │   │   ├── stage-progress.tsx
│   │   │   └── ...
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   └── App.tsx         # Root component
│   └── index.html
├── server/                 # Backend Express app
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   ├── ai-service.ts       # AI orchestration
│   ├── pdf-service.ts      # PDF generation
│   ├── email-service.ts    # Email delivery
│   └── index.ts            # Server entry
├── shared/                 # Shared types
│   └── schema.ts           # Drizzle schema
├── tests/                  # Test suites
└── package.json
```

## API Endpoints

### Projects

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/api/projects`                      | List all projects        |
| GET    | `/api/projects/:id`                  | Get project details      |
| POST   | `/api/projects`                      | Create new project       |
| POST   | `/api/projects/:id/chat`             | Send message             |
| POST   | `/api/projects/:id/approve-estimate` | Approve and generate PDF |
| POST   | `/api/projects/:id/send-email`       | Send proposal email      |
| POST   | `/api/projects/:id/reset`            | Reset project to stage 1 |

### Documents

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/api/projects/:id/proposal.pdf`     | Download proposal PDF    |
| GET    | `/api/projects/:id/report.pdf`       | Download internal report |
| GET    | `/api/projects/:id/execution.pdf`    | Download execution guide |
| GET    | `/api/projects/:id/consolidated.pdf` | Download main proposal   |

### System

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/health`             | API health status       |
| GET    | `/api/projects/:id/usage` | Project API usage stats |

## Development History

### Phase 1: Foundation

- **Initial commit** - Base project structure with React + Express + TypeScript
- **Stack extraction** - Set up Vite, Tailwind, shadcn/ui
- **Database schema** - PostgreSQL with Drizzle ORM for projects and messages

### Phase 2: Core Features

- **Project management** - CRUD operations, filtering, and display
- **AI integration** - Multi-provider setup (Gemini, Claude, OpenAI)
- **Chat interface** - Real-time messaging with AI responses
- **Estimate generation** - Dual-scenario (High-Tech vs No-Code) pricing

### Phase 3: Document Generation

- **PDF proposals** - Professional styling with pdfmake
- **Export options** - JSON, Markdown, PDF downloads
- **File uploads** - Support for PDF, Word, Excel documents

### Phase 4: Communication & Delivery

- **Email service** - Resend integration with tracking
- **Email preview** - Editable recipient, subject, and body
- **PDF attachments** - Automatic attachment of proposal PDFs

### Phase 5: Advanced Features

- **Market research** - Perplexity integration for competitive analysis
- **API health monitoring** - Real-time status dashboard
- **Usage tracking** - Per-project API cost monitoring
- **Presentation generation** - Gamma API integration (planned)
- **Image generation** - Cover image creation (planned)

### Phase 6: Execution Planning

- **Execution manuals** - 9-section comprehensive guides
- **PM breakdown** - Task checklists with phases
- **Internal reports** - Detailed stakeholder analysis

### Phase 7: Polish & UX

- **Stage progress** - Visual workflow indicator with completion states
- **Files tab** - Dual PDF/Markdown download buttons
- **Consolidated exports** - Combined document packages
- **Glass morphism UI** - Modern design system
- **Email preview workflow** - Review before sending
- **Test suite** - Comprehensive backend/frontend tests

## Complete Commit History (Chronological)

| #   | Commit    | Description                                                                        |
| --- | --------- | ---------------------------------------------------------------------------------- |
| 1   | `e212f9e` | Initial commit                                                                     |
| 2   | `bccef1d` | Extracted stack files                                                              |
| 3   | `1134458` | Enhance project management with AI and improve user interface                      |
| 4   | `d7f3b02` | Add export options and improve project filtering and display                       |
| 5   | `b25ed5d` | Update project documentation and improve user interface features                   |
| 6   | `a0d3688` | Add ability to upload files and improve button styling with glass effect           |
| 7   | `d985874` | Add support for uploading Microsoft Office documents                               |
| 8   | `c3410b3` | Integrate market research and pricing details into project estimates               |
| 9   | `162f78a` | Add system to track API usage for each project                                     |
| 10  | `b9a5002` | Add usage tracking and API health checks for AI services                           |
| 11  | `8c9e6d3` | Add project API usage statistics and cost display to sidebar                       |
| 12  | `6fe9de4` | Add functionality to send and manage project documents and emails                  |
| 13  | `d987a44` | Update email service to use verified sender and track email health                 |
| 14  | `89ef0e0` | Improve market research by accurately tracking Perplexity API performance          |
| 15  | `83a4c6c` | Add type definitions for the PDF generation library                                |
| 16  | `3bd4891` | Add image generation and approval workflow for project cover images                |
| 17  | `5eea7e7` | Add presentation generation using Gamma API                                        |
| 18  | `fe117ea` | Add features to generate execution manuals and convert HTML to PDF                 |
| 19  | `257aa31` | Add a way to generate execution manuals using PDF.co service                       |
| 20  | `aced49a` | Add detailed persona and mission for Replit project diagnostics                    |
| 21  | `853abbf` | Add a new system for diagnosing and auditing code repositories                     |
| 22  | `da782e6` | Add system diagnostics to analyze and report on GitHub repositories                |
| 23  | `4acdfb2` | Add a repository diagnostician tool to analyze GitHub repositories                 |
| 24  | `aa75e22` | Update pricing logic to include detailed cost breakdowns and regional alternatives |
| 25  | `a317d73` | Improve project estimate generation with detailed cost and regional options        |
| 26  | `c2060ad` | Add project reset functionality and improve file handling                          |
| 27  | `952c154` | Add comprehensive test suite for backend, frontend, and workflow operations        |
| 28  | `be9f6b3` | Improve test setup and reliability across the project                              |
| 29  | `c05fe2d` | Update project completion flow and enhance AI manual generation                    |
| 30  | `c1d221f` | Published your App                                                                 |
| 31  | `b0fe4e6` | Add email preview and allow custom subjects for project proposals                  |
| 32  | `d62dfa8` | Published your App                                                                 |

_Note: Automated commits (progress saves, mode transitions) omitted for clarity._

## Design System

### Colors

- **Background**: `#0E0F11` (dark theme)
- **Primary Accent**: `#1AD5E6` (cyan)
- **PDF Header**: `#0A3A5A` (dark blue)
- **PDF Accent**: `#00B8D4` (bright cyan)

### Typography

- **Font Family**: Inter
- **Headings**: Semi-bold to Bold
- **Body**: Regular weight

### Components

- Glass morphism effects with backdrop blur
- Subtle borders and shadows
- Consistent spacing (4px base unit)
- Smooth transitions and animations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for business development automation.

## Acknowledgments

- Built on [Replit](https://replit.com) with AI-powered development
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**ISI** - Transforming client conversations into actionable project plans.
