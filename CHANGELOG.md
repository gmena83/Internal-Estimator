# CHANGELOG

## [2026-01-05] - Forensic & Stability Sprint

### Fixed

- **Bun/Express Runtime Conflict**: Resolved critical `readonly property 'url'` error by switching from native `Bun.serve` to `app.listen` in `apps/api/src/index.ts`.
- **AI Model Hallucination**: Corrected `gpt-5` hallucination in `OpenAIProvider` to `gpt-4o`, resolving `401 Unauthorized` background failures.
- **Route Integrity**: Standardized `generateVibeGuides` naming across service and route layers, fixing `TypeError` red herrings.
- **Static Asset Serving**: Restored missing `serveStatic` hook in API entry point to enable client-side routing and file serving.

### Enhanced

- **Forensic Suite**: Injected diagnostic telemetry into AI strategies for better runtime observability.
- **Reproduction Infrastructure**: Created `repro_script.ps1` for reliable end-to-end testing of project flows.

### Known Issues

- Type-check errors remaining in `@internal/web` regarding shared schema visibility (TS6307).
- Portable type inference issue in `asset.service.ts`.
