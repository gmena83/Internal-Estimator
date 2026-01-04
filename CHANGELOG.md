# Changelog

## [Unreleased] - 2026-01-04

### Infrastructure Migration

- **Monorepo Transition**: Refactored monolithic structure into a Turborepo-managed monorepo.
  - `apps/web`: Frontend application.
  - `apps/api`: Backend application.
  - `packages/shared`: Shared schemas and types.
- **Runtime Swap**: Replaced Node.js with **Bun** for improved performance and native fetch/serve capabilities.
- **Backend Modernization**:
  - Refactored API entry point to use `Bun.serve()`.
  - Implemented workspace-aware directory structure.
  - Cleaned up legacy Express/Vite middleware.
- **Frontend Optimization**:
  - Upgraded to **Vite 6** for faster builds and modern plugin support.
  - Migrated to **Tailwind CSS 4**.
  - Transitioned theme configuration to CSS-native `@theme` blocks, removing `tailwind.config.ts`.

### Reliability & Type Safety

- **TypeScript Aliasing**: Established `@internal/shared` workspace alias for robust cross-package type resolution.
- **Consistent Compiler Options**: Enabled `forceConsistentCasingInFileNames` and `declaration: true` across all workspaces.
- **Build Verification**: Achieved a 'Green State' with successful `turbo build` across the entire monorepo.

### Technical Debt

- Removed legacy `server/vite.ts` and associated middleware dependencies.
- Standardized package manager to `bun@1.3.5`.
