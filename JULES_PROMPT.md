<instruction>You are an expert software engineer. You are working on a WIP branch. Please run `git status` and `git diff` to understand the changes and the current state of the code. Analyze the workspace context and complete the mission brief.</instruction>
<workspace_context>
<artifacts>
--- CURRENT TASK CHECKLIST ---

# Tasks

- [ ] Research existing codebase for estimation and approval logic <!-- id: 0 -->
  - [ ] Locate `routes.ts` and `ai-service.ts` <!-- id: 1 -->
  - [ ] Analyze `generateEstimate` function <!-- id: 2 -->
  - [ ] Analyze approval endpoints <!-- id: 3 -->
- [x] Create Implementation Plan <!-- id: 4 -->
  - [x] Define data structure for "Learnings" <!-- id: 5 -->
  - [x] Design feedback loop into `generateEstimate` prompt <!-- id: 6 -->
  - [x] Define backend API changes <!-- id: 7 -->
- [x] Implement Backend Changes <!-- id: 8 -->
  - [x] Create/Update schema for storing approved project pricing data <!-- id: 9 -->
  - [x] Update approval route to save learning data <!-- id: 10 -->
  - [x] Update `generateEstimate` to inject historical pricing data <!-- id: 11 -->
- [ ] Implement Frontend Changes <!-- id: 12 -->
  - [ ] (Optional) Admin view to see what the agent has "learned" <!-- id: 13 -->
- [ ] Verify <!-- id: 14 -->
  - [ ] Test approval flow triggers learning <!-- id: 15 -->
  - [ ] Test new estimates reflect learned pricing <!-- id: 16 -->

--- IMPLEMENTATION PLAN ---

# Deep Sweep Implementation Plan

## Goal Description

Conduct a comprehensive "Deep Sweep" of the codebase to maximize cleanliness, performance, and stability. This operation uses a multi-agent persona approach:

- **Agent A (Janitor)**: Code hygiene and standardization.
- **Agent B (Tuner)**: Performance optimization.
- **Agent C (Tester)**: rigorous automated QA.

## User Review Required

> [!IMPORTANT]
> **Integration Paused**: The previous "Learning Loop" work on the Frontend is paused to prioritize this Sweep.
> **Destructive Actions**: Agent A may delete unused files. Please ensure all WIP code is committed or tracked.

## Proposed Changes (By Agent)

### 🧹 Agent A: The Janitor

#### [MODIFY] [All TS Files]

- Run `eslint --fix` across `apps/web` and `apps/api`.
- Manually remove `console.log` statements in production code (keeping `qaLogger` related logs).
- Consolidate common types in `packages/shared/schema.ts` if duplicates exist.

#### [DELETE] [Unused Files]

- Scan for files not imported by entry points.

### ⚡ Agent B: The Performance Tuner

#### [MODIFY] [storage.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/apps/api/src/storage.ts)

- Review `getApiHealth` and `getProjectApiUsageStats` for SQL efficiency. Current implementation uses JS-side filtering/mapping which is fine for small scale, but we will ensure indices or SQL grouping is strict.

#### [MODIFY] [scenario-comparison.tsx](file:///d:/Menatech/Antigravity/Internal-Estimator/apps/web/src/components/features/estimate/scenario-comparison.tsx)

- Wrap `ScenarioCard` in `React.memo` to prevent re-renders when parent state changes.

### 🧪 Agent C: The Stress Tester

#### [NEW] [stress-test.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/scripts/stress-test.ts)

- A script to:
  1. Create 50 projects in parallel.
  2. Simulate "Estimate Generation" via mock-AI (to save tokens).
  3. Verify database integrity.

#### [Browser Automation]

- **Scenario 1**: Create Project -> Generate Estimate -> Approve (Happy Path).
- **Scenario 2**: Responsive checks (Resize window).

## Verification Plan

### Automated Tests

- **Terminal**: Run `npx tsx scripts/stress-test.ts`. Expect "0 failed".
- **Browser**: Run standard `browser_subagent` flows.

### Manual Verification

- Review `walkthrough.md` for the "Before vs After" report.
  </artifacts>
  </workspace_context>
  <mission_brief>[Describe your task here...]</mission_brief>
