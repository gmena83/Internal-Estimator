# Agent Workflow Refactor Plan

## Goal Description

Refactor the agent's workflow to align with the specific 5-step process defined by the user. This involves orchestrating AI services (Perplexity, OpenAI, Gamma) more tightly, automating transitions (Email -> Vibecoding), and updating the UI to reflect the "Draft Approval" -> "Final Approval" flow with specific logic for document visibility.

## User Review Required
>
> [!IMPORTANT]
> The workflow changes involve multiple external API calls (Perplexity, Gamma, OpenAI) in sequence. Latency may increase.
> "Draft Approval" now triggers Gamma presentation generation, which can take time. UI feedback (loaders) will be critical.

## Proposed Changes

### Backend Logic

#### [x] [routes.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/server/routes.ts)

- Update `/api/projects/:id/approve-draft` (New/Renamed Endpoint):
  - Instead of just setting status, it should ensure:
    - PDF Proposal is generated.
    - Gamma Presentation is generated (`gamma-service.ts`).
    - Research Markdown is saved.
  - Return references to both PDF and Presentation.
- Update `/api/projects/:id/send-email`:
  - Ensure it can handle multiple attachments (Proposal PDF + Presentation Link/PDF).
  - Upon success, trigger status update to allow "Vibecoding Guide" phase.

#### [x] [ai-service.ts](file:///d:/Menatech/Antigravity/Internal-Estimator/server/ai-service.ts)

- `generateEstimate`:
  - Verify `sonar-deep-research` usage (already in place, verify parameters).
  - Ensure "Research Markdown" is explicitly stored (e.g., in `knowledgeEntries` or a dedicated field `researchMarkdown` on Project).
  - Consolidate data for OpenAI Model 5 to strictly follow the "Proposal + Research" document structure.

### Frontend UI

#### [x] [action-buttons.tsx](file:///d:/Menatech/Antigravity/Internal-Estimator/client/src/components/action-buttons.tsx)

- **Draft Approval Button**:
  - Rename "Approve & Generate PDF" to "Draft Approval".
  - Color: Distinct (different from Final Approval).
  - Action: Trigger `approveDraft` -> Open Email Dialog.
- **Email Dialog**:
  - Show attachments: Proposal PDF, Presentation (link/file).
  - "Send" Action: Calls `sendEmail` -> Updates state -> Shows "Vibecoding Guide" CTA.
- **Vibecoding Guide CTA**:
  - Style: Same as "Final Approval" (Glassmorphism + Animation).
- **Download/Export**:
  - Ensure "Draft Approval" is distinct from "Export".

#### [x] [main-workspace.tsx](file:///d:/Menatech/Antigravity/Internal-Estimator/client/src/components/main-workspace.tsx)

- **PM Breakdown Tab**:
  - Ensure it is HIDDEN until "Final Approval" is clicked (or Stage 5 is active).
  - Currently logic checks `project.pmBreakdown`, need to strictly tie it to the workflow stage.
- **Project Files**:
  - "Complete Project Package": Ensure it merges:
    - Research Markdown
    - Proposal PDF/Markdown
    - Presentation
    - Vibecode Guides
    - PM Breakdown

## Verification Plan

### Automated Tests

- None (User "Hands on test" requested).

### Manual Verification

1. **Create Project**: Verify basic data.
2. **Generate Estimate**: Check console logs for Perplexity `sonar-deep-research` and OpenAI `gpt-5` usage.
3. **Draft Approval**:
    - Click "Draft Approval".
    - Verify Gamma Presentation generation starts.
    - Verify Email Popup opens with Proposal + Presentation attached.
4. **Send Email**:
    - Click Send.
    - Verify transition to "Vibecoding Guide" step.
    - Check Button Styling.
5. **Final Approval**:
    - Click "Final Approval".
    - Verify "PM Breakdown" tab appears.
6. **Downloads**:
    - Go to "Files" tab.
    - Download "Complete Project Package". Verify contents.
