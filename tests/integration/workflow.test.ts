import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockProject, createMockInsertProject } from "../utils/test-helpers";

// Note: These are integration tests that require a running server
// Run with: npm run test:integration

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

describe("Multi-Stage Workflow Integration Tests", () => {
  let projectId: string;

  describe("Stage 1: Project Creation", () => {
    it("should create a new project", async () => {
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Integration Test Project",
          rawInput: "Build a test application for integration testing",
          clientName: "Test Client",
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data.title).toBe("Integration Test Project");
      expect(data.status).toBe("draft");
      expect(data.currentStage).toBe(1);

      projectId = data.id;
    });
  });

  describe("Stage 2: Estimate Generation", () => {
    it("should send a message to trigger estimate generation", async () => {
      const response = await fetch(`${BASE_URL}/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Please generate an estimate",
          role: "user",
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("id");
    });

    it("should poll for estimate completion", async () => {
      let estimateReady = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!estimateReady && attempts < maxAttempts) {
        const response = await fetch(`${BASE_URL}/api/projects/${projectId}`);
        const data = await response.json();

        if (data.estimateMarkdown) {
          estimateReady = true;
          expect(data.estimateMarkdown).toBeDefined();
          expect(data.scenarioA).toBeDefined();
          expect(data.scenarioB).toBeDefined();
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }
      }

      expect(estimateReady).toBe(true);
    }, 30000); // 30 second timeout
  });

  describe("Stage 3: PDF Generation", () => {
    it("should approve estimate and generate PDF", async () => {
      const response = await fetch(`${BASE_URL}/api/projects/${projectId}/approve-estimate`, {
        method: "POST",
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.proposalPdfUrl).toBeDefined();
      expect(data.currentStage).toBe(2);
      expect(data.status).toBe("estimate_generated");

      // Validate URL format (should be absolute)
      expect(data.proposalPdfUrl).toMatch(/^https?:\/\//);
    });

    it("should be able to download the PDF", async () => {
      const projectResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`);
      const project = await projectResponse.json();

      const pdfResponse = await fetch(project.proposalPdfUrl);
      expect(pdfResponse.ok).toBe(true);
      expect(pdfResponse.headers.get("content-type")).toContain("pdf");
    });
  });

  describe("Stage 4: Asset Generation", () => {
    it("should generate execution manual and guides", async () => {
      const response = await fetch(`${BASE_URL}/api/projects/${projectId}/generate-assets`, {
        method: "POST",
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.currentStage).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Stage 5: Email Sending", () => {
    it("should send proposal email", async () => {
      const response = await fetch(`${BASE_URL}/api/projects/${projectId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: "test@example.com",
          emailSubject: "Integration Test Proposal",
          emailBody: "This is a test email",
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.emailSentAt).toBeDefined();
    });
  });

  describe("URL Format Validation", () => {
    it("should return absolute URLs for all URL fields", async () => {
      const response = await fetch(`${BASE_URL}/api/projects/${projectId}`);
      const project = await response.json();

      // Check all URL fields are absolute
      if (project.proposalPdfUrl) {
        expect(project.proposalPdfUrl).toMatch(/^https?:\/\//);
      }
      if (project.internalReportPdfUrl) {
        expect(project.internalReportPdfUrl).toMatch(/^https?:\/\//);
      }
      if (project.presentationUrl) {
        expect(project.presentationUrl).toMatch(/^https?:\/\//);
      }
      if (project.coverImageUrl) {
        expect(project.coverImageUrl).toMatch(/^https?:\/\//);
      }
    });
  });
});
