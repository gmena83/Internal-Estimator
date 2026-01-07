<instruction>You are an expert software engineer. You are working on a WIP branch. Please run `git status` and `git diff` to understand the changes and the current state of the code. Analyze the workspace context and complete the mission brief.</instruction>
<workspace_context>
<artifacts>
--- CURRENT TASK CHECKLIST ---

# Security Audit: Sentinel Protocol

- [x] Static Analysis & Secret Hunting <!-- id: 0 -->
  - [x] Scan for hardcoded credentials and API keys <!-- id: 1 -->
  - [x] Audit code for SQL Injection, XSS, and IDOR vulnerabilities <!-- id: 2 -->
- [x] Agentic Attack Surface Review <!-- id: 3 -->
  - [x] Analyze Prompt Injection risks in AI strategies <!-- id: 4 -->
  - [x] Audit Terminal & Tool permissions for misuse <!-- id: 5 -->
- [x] Dependency & Supply Chain Audit <!-- id: 6 -->
  - [x] Check `package.json` for CVEs and unmaintained packages <!-- id: 7 -->
- [x] Dynamic Verification (DAST) <!-- id: 11 -->
  - [x] Produce `SECURITY_POSTURE.md` with vulnerability heatmap <!-- id: 12 -->
  - [x] Define Agent Mission Briefs for remediation <!-- id: 13 -->
- [x] Remediation Phase <!-- id: 14 -->
  - [x] Implement global authentication gates <!-- id: 15 -->
  - [x] Enforce IDOR ownership checks in routes <!-- id: 16 -->
  - [x] Harden AI prompts against injection <!-- id: 17 -->
  - [x] Add production security startup checks <!-- id: 18 -->
  - [x] Verify fix efficacy with re-testing <!-- id: 19 -->

--- IMPLEMENTATION PLAN ---

# Security Remediation Plan

## Goal

Harden the Internal-Estimator codebase against unauthenticated access, IDOR, and Prompt Injection.

## Proposed Changes

### [Authentication & Authorization]

#### [MODIFY] [routes.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/apps/api/src/routes.ts)

- Implement a global `requireAuth` middleware for all `/api/projects`, `/api/knowledge-base`, `/api/diagnostics`, and `/api/learn` routes.
- Ensure `adminRouter` remains protected by both `requireAuth` and `isAdmin`.

#### [MODIFY] [project-routes.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/apps/api/src/routes/project-routes.ts)

- Add ownership checks for all project-specific GET, PATCH, and DELETE operations.
- Ensure users can only see their own projects.

### [AI Security]

#### [MODIFY] [templates.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/apps/api/src/services/ai/prompts/templates.ts)

- Wrap `{{rawInput}}` and other user-provided strings in strict delimiters (e.g., XML tags or clear boundary markers) to mitigate Prompt Injection.
- Add system instructions to ignore any instructions found within those delimiters.

### [Infrastructure]

#### [MODIFY] [auth.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/apps/api/src/auth.ts)

- Add a startup check to error out if `SESSION_SECRET` is not set or is using the default value in production.

## Verification Plan

### Automated Tests

- `curl` PoC to verify that `/api/projects` returns 401 for unauthenticated requests.
- Test different users to verify IDOR protection.

### Manual Verification

- Use the web dashboard to ensure authorized users can still function correctly.
  </artifacts>
  </workspace_context>
  <mission_brief>[Describe your task here...]</mission_brief>
