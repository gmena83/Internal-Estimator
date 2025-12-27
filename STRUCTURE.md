# Project Structure and Architecture

## Overview

This project, **Internal-Estimator** (also known as **ISI - Intelligent Strategy Interface**), is an AI-powered business development agent designed to automate project estimation, proposal generation, and technical planning.

## Directory Structure

```
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI Components (shadcn/ui based)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (queryClient, utils)
│   │   ├── pages/          # Route pages (Home, Diagnostician)
│   │   └── App.tsx         # Main App component & Routing
│   └── index.html          # Entry HTML
│
├── server/                 # Backend (Node.js + Express)
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API Route definitions
│   ├── storage.ts          # Database Access Layer (Drizzle ORM)
│   ├── ai-service.ts       # AI Integration (Gemini, Claude, OpenAI)
│   ├── pdf-service.ts      # PDF Generation logic (pdfmake)
│   ├── diagnostics-service.ts # GitHub Repo Analyzer
│   ├── pricing-matrix.ts   # Logic for calculating estimates using Excel data
│   └── vite.ts             # Vite middleware integration
│
├── shared/                 # Shared Code (Frontend <-> Backend)
│   └── schema.ts           # Database Schema (Drizzle) & Types (Zod)
│
├── tests/                  # Test Suite (Vitest)
│   ├── api/                # API Route tests
│   ├── services/           # Service unit tests
│   └── e2e/                # End-to-End workflow tests
│
├── drizzle.config.ts       # Drizzle Configuration
├── postcss.config.js       # PostCSS Configuration
├── tailwind.config.ts      # Tailwind CSS Configuration
└── vite.config.ts          # Vite Configuration
```

## Key Technologies

### Frontend

- **React 18**: UI Library
- **Vite**: Build Tool & Dev Server
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component Library (Radix UI based)
- **TanStack Query (React Query)**: Data Fetching
- **wouter**: Lightweight Routing

### Backend

- **Node.js**: Runtime
- **Express**: Web Framework
- **Drizzle ORM**: Type-safe SQL ORM
- **PostgreSQL**: Database (via `pg`)
- **Zod**: Schema Validation
- **Multer**: File Uploads (if applicable, or potential use)

### AI & Services

- **Google Gemini**: Primary AI Model
- **Anthropic Claude**: Secondary AI Model
- **OpenAI**: Fallback AI Model
- **Perplexity**: Market Research

## Data Flow

1. **Input**: User enters project details (or Voice Input).
2. **AI Analysis**: `ai-service.ts` processes input to extract mission, objectives, and constraints.
3. **Estimation**: `pricing-matrix.ts` (using `xlsx` data) + AI logic estimates effort and cost for High-Code vs No-Code scenarios.
4. **Storage**: `storage.ts` saves project state to PostgreSQL.
5. **Generation**:
    - **Proposal**: `pdf-service.ts` generates PDF proposals.
    - **Vibe Guide**: AI generates technical implementation guides ("vibecoding").
6. **Output**: User downloads PDFs, CSVs, or views reports in UI.

## Security & Operations

- **Environment Variables**: Managed via `.env` (not committed).
- **Linting & Formatting**: ESLint (Flat Config) + Prettier.
- **Type Safety**: Strict TypeScript configuration in `tsconfig.json`.
- **Known Vulnerabilities**:
  - `xlsx`: Used for pricing matrix. Contains known high-severity vulnerabilities. Recommendation: Migrate to `exceljs` or convert to JSON.

## Development Workflow

- `npm run dev`: Start backend + frontend dev server (concurrently).
- `npm run build`: Build frontend for production.
- `npm run check`: Type-check code.
- `npm run lint`: Run ESLint.
- `npm run format`: Format code with Prettier.
- `npm test`: Run test suite.
