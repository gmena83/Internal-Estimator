import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../../apps/api/src/routes";
import { storage } from "../../apps/api/src/storage";
import { aiService } from "../../apps/api/src/ai-service";
import * as gammaService from "../../apps/api/src/gamma-service";
import { createServer } from "http";
import { type Request, type Response, type NextFunction } from "express";

// Mock all external dependencies
vi.mock("../../apps/api/src/storage");
vi.mock("../../apps/api/src/ai-service");
vi.mock("../../apps/api/src/pdf-service");
vi.mock("../../apps/api/src/email-service");
vi.mock("../../apps/api/src/image-service");
vi.mock("../../apps/api/src/gamma-service");
vi.mock("../../apps/api/src/diagnostics-service");

// Mocking the response validator middleware since it might require a real DB or more setup
vi.mock("../../apps/api/src/middleware/response-validator", () => ({
  responseValidator: (req: Request, res: Response, next: NextFunction) => next(),
}));

describe("API Agent Battery - Logic, Consistency and Error Handling", () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Ensure async mocks return promises
    vi.mocked(aiService.processRawInput).mockResolvedValue(undefined);
    vi.mocked(aiService.processMessage).mockResolvedValue({ content: "test", stage: 1 });
    vi.mocked(aiService.generateEstimate).mockResolvedValue({} as any);
    vi.mocked(aiService.generateEmailContent).mockResolvedValue("test");
    vi.mocked(aiService.generateVibeGuides).mockResolvedValue({ guideA: "a", guideB: "b" });
    vi.mocked(aiService.generatePMBreakdown).mockResolvedValue({});

    vi.mocked(storage.createMessage).mockImplementation(
      async (data) => ({ id: "msg-" + Math.random(), ...data }) as any,
    );
    vi.mocked(storage.updateProject).mockImplementation(
      async (id, data) => ({ id, ...data }) as any,
    );
    vi.mocked(storage.getProject).mockImplementation(
      async (id) => ({ id, title: "Test Project", currentStage: 1 }) as any,
    );

    app = express();
    app.use(express.json());
    server = createServer(app);
    await registerRoutes(server, app);
  });

  const generateUUID = () => "test-uuid-" + Math.random().toString(36).substr(2, 9);

  /**
   * PERSONA: THE HAPPY PATH AGENT
   * Goal: Ensure smooth flow for valid inputs.
   */
  describe("Agent: Happy Path (Standard User)", () => {
    it("should successfully create a project and advance through stages", async () => {
      const projectId = generateUUID();
      const mockProject = {
        id: projectId,
        title: "E-commerce App",
        clientName: "John Doe",
        status: "draft",
        currentStage: 1,
        rawInput: "I want a simple e-commerce app with cart and checkout.",
      };

      vi.mocked(storage.createProject).mockResolvedValue(mockProject as any);
      vi.mocked(storage.getProject).mockResolvedValue(mockProject as any);
      vi.mocked(aiService.processMessage).mockResolvedValue({
        content: "I have processed your request.",
        stage: 1,
      });
      vi.mocked(aiService.generateEstimate).mockResolvedValue({
        markdown: "# Estimate",
        scenarioA: { id: "A", name: "Budget", totalCost: 5000 } as any,
        scenarioB: { id: "B", name: "Premium", totalCost: 15000 } as any,
        roiAnalysis: { paybackMonths: 6 } as any,
        parsedData: { mission: "Build an e-commerce app" },
      });

      // 1. Create Project
      const createRes = await request(app)
        .post("/api/projects")
        .send({ title: "E-commerce App", rawInput: "..." });

      expect(createRes.status).toBe(201);
      expect(createRes.body.id).toBe(projectId);

      // 2. Add Message
      const msgRes = await request(app)
        .post(`/api/projects/${projectId}/messages`)
        .send({ content: "Generate an estimate", role: "user" });

      expect(msgRes.status).toBe(200);
      expect(msgRes.body.assistantMessage.content).toBeDefined();

      // 3. Regenerate Estimate (Explicit trigger)
      const estRes = await request(app).post(`/api/projects/${projectId}/regenerate-estimate`);

      expect(estRes.status).toBe(200);
      expect(estRes.body.estimateMarkdown).toContain("# Estimate");
    });
  });

  /**
   * PERSONA: THE EDGE CASE AGENT
   * Goal: Test boundaries and unusual but valid inputs.
   */
  describe("Agent: Edge Case (Boundary Tester)", () => {
    it("should handle extremely long project titles and descriptions", async () => {
      const longTitle = "A".repeat(255);
      const longInput = "B".repeat(5000);
      const projectId = generateUUID();

      vi.mocked(storage.createProject).mockResolvedValue({
        id: projectId,
        title: longTitle,
      } as any);

      const res = await request(app)
        .post("/api/projects")
        .send({ title: longTitle, rawInput: longInput });

      expect(res.status).toBe(201);
      expect(res.body.title.length).toBe(255);
    });

    it("should handle empty raw input gracefully (if allowed by schema, or check error)", async () => {
      const res = await request(app).post("/api/projects").send({ title: "Empty Input Project" });

      // According to routes.ts, it uses insertProjectSchema.safeParse
      // If rawInput is optional, it should succeed.
      if (res.status === 400) {
        expect(res.body.error).toBeDefined();
      } else {
        expect(res.status).toBe(201);
      }
    });
  });

  /**
   * PERSONA: THE CHAOS AGENT
   * Goal: Ensure robust error handling for nonsense or invalid data.
   */
  describe("Agent: Chaos (Robustness Tester)", () => {
    it("should return 404 for operations on non-existent projects", async () => {
      vi.mocked(storage.getProject).mockResolvedValue(null);

      const res = await request(app).get("/api/projects/non-existent-id");
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Project not found");
    });

    it("should return 400 for malformed project creation (missing title)", async () => {
      const res = await request(app)
        .post("/api/projects")
        .send({ rawInput: "Some input without a title" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should handle server errors gracefully during AI processing", async () => {
      const projectId = generateUUID();
      vi.mocked(storage.getProject).mockResolvedValue({ id: projectId } as any);
      vi.mocked(storage.createMessage).mockImplementation(
        async (data) => ({ id: "msg-1", ...data }) as any,
      );
      // Simulate AI Failure
      vi.mocked(aiService.processMessage).mockRejectedValue(new Error("AI Model Timeout"));

      const res = await request(app)
        .post(`/api/projects/${projectId}/messages`)
        .send({ content: "This will fail", role: "user" });

      expect(res.status).toBe(200); // Route catches error and returns a fallback message
      expect(res.body.assistantMessage.content).toContain(
        "I encountered an error processing your request",
      );
    });
  });

  /**
   * PERSONA: THE BUSINESS LOGIC VALIDATOR
   * Goal: Verify consistency between calculations and relate objects.
   */
  describe("Agent: Logic Validator (Consistency Checker)", () => {
    it("should ensure that approving a draft advances the stage and generates asset URLs", async () => {
      const projectId = generateUUID();
      const mockProject = {
        id: projectId,
        estimateMarkdown: "# Valid Estimate",
        currentStage: 1,
      };

      vi.mocked(storage.getProject).mockResolvedValue(mockProject as any);
      vi.mocked(storage.updateProject).mockImplementation(
        async (id, data) => ({ ...mockProject, ...data }) as any,
      );
      vi.mocked(gammaService.generatePresentation).mockResolvedValue({
        success: true,
        embedUrl: "http://gamma.app/test",
      } as any);

      const res = await request(app).post(`/api/projects/${projectId}/approve-draft`);

      expect(res.status).toBe(200);
      expect(res.body.currentStage).toBe(2);
      expect(res.body.status).toBe("assets_ready");
      expect(res.body.proposalPdfUrl).toContain("proposal.pdf");
      expect(res.body.presentationUrl).toBeDefined();
    });

    it("should verify that PM breakdown contains logical phases", async () => {
      const projectId = generateUUID();
      vi.mocked(storage.getProject).mockResolvedValue({ id: projectId } as any);
      vi.mocked(aiService.generatePMBreakdown).mockResolvedValue({
        phases: [
          { phaseNumber: 1, phaseName: "Discovery", durationDays: 5 },
          { phaseNumber: 2, phaseName: "Development", durationDays: 20 },
        ],
      });

      const res = await request(app).post(`/api/projects/${projectId}/generate-pm-breakdown`);

      expect(res.status).toBe(200);
      expect(res.body.pmBreakdown.phases).toHaveLength(2);
      expect(res.body.currentStage).toBe(5);
    });
  });
});
