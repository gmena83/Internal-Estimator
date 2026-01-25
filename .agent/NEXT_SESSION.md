# NEXT_SESSION.md

## The Vibe Summary

We have successfully transitioned the project from a state of "Ghost Bug" uncertainty to a stable, forensically verified baseline. The architectural direction is now centered on standard Node/Express patterns within the Bun runtime to avoid immutable request conflicts. The AI layer is fully unblocked from model hallucinations.

## Active Workstreams

- **Forensic Fixes (100%)**: Bun/Express mismatch and gpt-5 hallucination are purged.
- **Database Schema (100%)**: Synced with Supabase.
- **Internal Web Types (80%)**: Type resolution between `@internal/web` and `@internal/shared` needs a `tsconfig` inclusion tweak to remove TS6307.

## Unresolved Context

- **TS6307**: The web app builds but reports that `schema.ts` is outside the project root. This is a configuration ghost left from the monorepo migration.
- **Portable Types**: `asset.service.ts` has an inferred type issue that might cause issues with library consumers (non-blocking for dev).

## Instructional Hook

To resume the current flow and verify the web app's connection to the fixed API:

> **Resume Command**: `bun run dev` at root, then run `powershell ./repro_script.ps1` to confirm project-to-asset end-to-end stability.

## Context Backup

- **Artifacts Dir**: [586a45f3-c808-4f0c-96ad-c6193b296464]
- **Key Files**: `apps/api/src/index.ts`, `apps/api/src/ai-service.ts`, `BUG_AUTOPSY.md`.
