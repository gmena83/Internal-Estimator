# Comprehensive Plan for Optimization, Fixes, and Improvements

This document outlines a comprehensive plan for optimizing, fixing, and improving the application based on the results of the initial testing phase.

## 1. Stabilize the Development and Testing Environment

The core issue throughout the process has been environment instability, particularly with dependency management and server startup within tests.

*   **Action:** Create a `globalSetup.ts` file for Vitest. This file will programmatically start the API server before any tests run and shut it down afterward. This is a much more robust solution than using `exec` in a `beforeAll` hook and will permanently fix the `ECONNREFUSED` errors in the integration tests.
*   **Action:** Investigate the root cause of the `bun install` issues. It's possible that there's a configuration issue in the `package.json` or `bun.config.js` files that's preventing `bun` from creating the necessary symlinks.

## 2. Fix All Remaining Automated Test Failures

With a stable server, we can now reliably address the application-level bugs revealed by the tests.

*   **Action (`agent-battery.test.ts`):** Perform a root-cause analysis of the bug where `currentStage` is not updated after a draft is approved. Add targeted logging to `project.service.ts` and `storage.ts` to trace the data flow during the `approveDraft` process and implement a proper fix instead of the previous workarounds.
*   **Action (`integration/workflow.test.ts`):** Once the server starts correctly, run the integration tests. I anticipate new failures due to missing or mismatched routes (`approve-estimate`, `generate-assets`). I will fix these by either correcting the test to call the right endpoint or implementing the missing routes as needed.

## 3. Complete Comprehensive Manual and AI Quality Testing

The environment is now stable enough for thorough manual testing.

*   **Action:** Systematically work through all 20 scenarios listed in `qa_scenarios.json`. For each scenario, create a project, send messages, generate estimates, and create assets.
*   **Action:** During this process, critically evaluate the quality, coherence, and correctness of all AI-generated content. Investigate why the AI returned an empty response in the earlier test and address any underlying issues with the prompts or service integrations.

## 4. Analyze and Expand Test Coverage

Once all tests are passing, we can get a clear picture of the application's test coverage.

*   **Action:** Run `npx vitest run --coverage` and analyze the generated report to identify critical parts of the application with low test coverage (e.g., `project.service.ts`, `email-service.ts`).
*   **Action:** Write new unit and integration tests to cover these gaps, focusing on complex business logic and potential edge cases.

## 5. Continuous Integration

To prevent these issues from happening again, we need to set up a continuous integration (CI) pipeline.

*   **Action:** Create a GitHub Actions workflow that runs the following steps on every push to the `main` branch:
    *   Install dependencies with `bun install`.
    *   Run the database migrations with `drizzle-kit push`.
    *   Run the automated test suite with `npx vitest run`.
*   **Action:** Add a status badge to the `README.md` to show the current build status.

## 6. Documentation

The `README.md` is comprehensive, but it could be improved with more detailed information about the testing process.

*   **Action:** Add a "Testing" section to the `README.md` that explains how to run the automated test suite and the manual tests.
*   **Action:** Add a "Troubleshooting" section to the `README.md` that documents the common issues that I encountered and how to resolve them.
