# ISI System Architecture

## Overview

ISI is a monolithic application with a clear separation between Client (React) and Server (Express).

## Dependency Graph

```mermaid
graph TD
    Client[Client (React/Vite)] --> |HTTP API| Server[Server (Express)]

    subgraph Client Layer
        Components[UI Components] --> Hooks[Custom Hooks]
        Hooks --> ApiClient[TanStack Query]
    end

    subgraph Server Layer
        Routes[Routes (routes.ts)] --> Storage[Storage (storage.ts/DB)]
        Routes --> AIService[AI Service (ai-service.ts)]
        Routes --> PDFService[PDF Service (pdf-service.ts)]
        Routes --> EmailService[Email Service (email-service.ts)]
        Routes --> ImageService[Image Service (image-service.ts)]

        AIService --> Gemini[Google Gemini API]
        AIService --> OpenAI[OpenAI API (Fallback)]
        AIService --> Pricing[Pricing Matrix (pricing-matrix.ts)]
        Pricing --> Excel[ExcelJS / Knowledge Base]

        PDFService --> PDFMake[pdfmake]
        ImageService --> GeminiFlash[Gemini 2.0 Flash]
    end

    subgraph Data Layer
        Storage --> Postgres[PostgreSQL Database]
        Storage --> Schema[Drizzle Schema]
    end
```

## Module Interactions

### 1. Project Initialization

- User Interface -> `POST /api/projects`
- Server -> `aiService.processRawInput` -> `Gemini 2.5 Flash` -> `parsedData`

### 2. Estimation Engine

- User Interface -> Chat -> `aiService.generateEstimate`
- `aiService` -> `pricingMatrix.loadPricingMatrix` (Excel Knowledge Base)
- `aiService` -> `Gemini` (Reasoning strict JSON)
- `aiService` -> `storage.updateProject`

### 3. Asset Generation

- `pdf-service` consumes `Project` state to render PDFs.
- `image-service` uses `Gemini 2.0 Flash-Exp` for cover art.
