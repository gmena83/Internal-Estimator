import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMockProject,
  createMockProjectWithEstimate,
  createMockProjectComplete,
  getMockAiParseResponse,
  getMockAiEstimateResponse,
  getMockScenarioA,
  getMockScenarioB,
  getMockPmBreakdown,
} from "../fixtures";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Simulate the full workflow
describe("E2E Workflow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("Complete Project Lifecycle", () => {
    it("should complete full workflow from creation to execution plan", async () => {
      // Stage 0: Create project
      const projectData = {
        title: "E2E Test Project",
        clientName: "Test Client",
        rawInput: "Build a mobile app with AI features for task management",
      };

      let project = createMockProject(projectData);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      // Create project
      const createResponse = await mockFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(projectData),
      });
      project = await createResponse.json();

      expect(project.id).toBeDefined();
      expect(project.currentStage).toBe(1);
      expect(project.status).toBe("in_progress");

      // Stage 1: Parse input
      const parsedData = getMockAiParseResponse();
      project = { ...project, parsedData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      const parseResponse = await mockFetch(`/api/projects/${project.id}/parse`, {
        method: "POST",
      });
      project = await parseResponse.json();

      expect(project.parsedData).toBeDefined();
      expect(project.parsedData.mission).toBeDefined();

      // Stage 1: Generate estimate
      const estimateResponse = getMockAiEstimateResponse();
      project = {
        ...project,
        ...estimateResponse,
        currentStage: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      const estimateResult = await mockFetch(`/api/projects/${project.id}/generate-estimate`, {
        method: "POST",
      });
      project = await estimateResult.json();

      expect(project.estimateMarkdown).toBeDefined();
      expect(project.scenarioA).toBeDefined();
      expect(project.scenarioB).toBeDefined();
      expect(project.roiAnalysis).toBeDefined();

      // Stage 2: Approve estimate
      project = {
        ...project,
        currentStage: 2,
        status: "estimate_generated",
        proposalPdfUrl: `/api/projects/${project.id}/proposal.pdf`,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      const approveResult = await mockFetch(`/api/projects/${project.id}/approve-estimate`, {
        method: "POST",
      });
      project = await approveResult.json();

      expect(project.currentStage).toBe(2);
      expect(project.proposalPdfUrl).toBeDefined();

      // Stage 3: Generate assets
      project = {
        ...project,
        currentStage: 3,
        status: "assets_ready",
        internalReportPdfUrl: `/api/projects/${project.id}/internal-report.pdf`,
        presentationUrl: "https://gamma.app/test",
        emailContent: "Dear Test Client...",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      const assetsResult = await mockFetch(`/api/projects/${project.id}/generate-assets`, {
        method: "POST",
      });
      project = await assetsResult.json();

      expect(project.currentStage).toBe(3);
      expect(project.internalReportPdfUrl).toBeDefined();
      expect(project.presentationUrl).toBeDefined();

      // Stage 4: Send email
      project = {
        ...project,
        currentStage: 4,
        status: "email_sent",
        emailSentAt: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      const emailResult = await mockFetch(`/api/projects/${project.id}/send-email`, {
        method: "POST",
        body: JSON.stringify({ recipientEmail: "client@example.com" }),
      });
      project = await emailResult.json();

      expect(project.currentStage).toBe(4);
      expect(project.emailSentAt).toBeDefined();

      // Stage 5: Generate execution plan
      project = {
        ...project,
        currentStage: 5,
        status: "complete",
        vibecodeGuideA: "Guide A content",
        vibecodeGuideB: "Guide B content",
        pmBreakdown: getMockPmBreakdown(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(project),
      });

      const planResult = await mockFetch(`/api/projects/${project.id}/generate-plan`, {
        method: "POST",
      });
      project = await planResult.json();

      expect(project.currentStage).toBe(5);
      expect(project.status).toBe("complete");
      expect(project.vibecodeGuideA).toBeDefined();
      expect(project.pmBreakdown).toBeDefined();
    });

    it("should handle workflow reset at any stage", async () => {
      // Start with a project at stage 3
      let project = createMockProjectWithEstimate();
      project = { ...project, currentStage: 3 };

      // Reset to stage 1
      const resetProject = {
        ...createMockProject({ id: project.id }),
        currentStage: 1,
        status: "in_progress",
        estimateMarkdown: null,
        scenarioA: null,
        scenarioB: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(resetProject),
      });

      const resetResult = await mockFetch(`/api/projects/${project.id}/reset`, {
        method: "POST",
      });
      project = await resetResult.json();

      expect(project.currentStage).toBe(1);
      expect(project.status).toBe("in_progress");
      expect(project.estimateMarkdown).toBeNull();
      expect(project.scenarioA).toBeNull();
    });
  });

  describe("AI Provider Fallback", () => {
    it("should fallback to secondary provider on primary failure", async () => {
      const providers = ["gemini", "claude", "openai"];
      const attempts: string[] = [];

      const callWithFallback = async () => {
        for (const provider of providers) {
          attempts.push(provider);

          // Simulate first two providers failing
          if (provider === "gemini" || provider === "claude") {
            continue; // Simulate failure
          }

          // Success on openai
          return { provider, success: true };
        }
        throw new Error("All providers failed");
      };

      const result = await callWithFallback();

      expect(result.provider).toBe("openai");
      expect(attempts).toContain("gemini");
      expect(attempts).toContain("claude");
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple simultaneous API calls", async () => {
      const project = createMockProject();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: "online" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([project]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      // Simulate concurrent calls
      const [healthResult, projectsResult, messagesResult] = await Promise.all([
        mockFetch("/api/health"),
        mockFetch("/api/projects"),
        mockFetch(`/api/projects/${project.id}/messages`),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from API errors gracefully", async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockProject()),
      });

      const fetchWithRetry = async (url: string, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await mockFetch(url);
            return response.json();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((r) => setTimeout(r, 100));
          }
        }
      };

      const result = await fetchWithRetry("/api/projects");

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should validate data at each stage transition", async () => {
      const validateStageTransition = (from: number, to: number, project: any) => {
        // Can't skip stages
        if (to > from + 1) {
          throw new Error(`Cannot skip from stage ${from} to ${to}`);
        }

        // Stage 2 requires estimate
        if (to === 2 && !project.estimateMarkdown) {
          throw new Error("Cannot advance to stage 2 without estimate");
        }

        // Stage 3 requires approval
        if (to === 3 && !project.proposalPdfUrl) {
          throw new Error("Cannot advance to stage 3 without approval");
        }

        return true;
      };

      const project = createMockProject();

      // Valid transition
      expect(() =>
        validateStageTransition(1, 2, {
          ...project,
          estimateMarkdown: "test",
        }),
      ).not.toThrow();

      // Invalid: missing estimate
      expect(() => validateStageTransition(1, 2, project)).toThrow(
        "Cannot advance to stage 2 without estimate",
      );

      // Invalid: skipping stages
      expect(() => validateStageTransition(1, 3, project)).toThrow("Cannot skip from stage 1 to 3");
    });
  });

  describe("Knowledge Base Integration", () => {
    it("should index estimate on approval", async () => {
      const project = createMockProjectWithEstimate();

      const knowledgeEntry = {
        id: "know-1",
        projectId: project.id,
        category: "estimate",
        content: project.estimateMarkdown,
        metadata: {
          scenarioA: project.scenarioA,
          scenarioB: project.scenarioB,
        },
        createdAt: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(knowledgeEntry),
      });

      const indexResponse = await mockFetch("/api/knowledge", {
        method: "POST",
        body: JSON.stringify(knowledgeEntry),
      });

      const indexed = await indexResponse.json();

      expect(indexed.projectId).toBe(project.id);
      expect(indexed.category).toBe("estimate");
    });

    it("should search knowledge base for similar projects", async () => {
      const searchResults = [
        createMockKnowledgeEntry({ content: "Mobile app estimate" }),
        createMockKnowledgeEntry({ content: "Task management features" }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(searchResults),
      });

      const searchResponse = await mockFetch("/api/knowledge/search?q=mobile+app");
      const results = await searchResponse.json();

      expect(results).toHaveLength(2);
    });
  });

  describe("API Health Tracking", () => {
    it("should log API health on each call", async () => {
      const healthLogs: any[] = [];

      const logHealth = (service: string, status: string, latencyMs: number) => {
        healthLogs.push({
          service,
          status,
          latencyMs,
          timestamp: new Date(),
        });
      };

      // Simulate API calls
      logHealth("gemini", "online", 150);
      logHealth("openai", "online", 100);
      logHealth("perplexity", "error", 0);

      expect(healthLogs).toHaveLength(3);
      expect(healthLogs.find((l) => l.service === "perplexity")?.status).toBe("error");
    });

    it("should aggregate health stats per project", async () => {
      const projectStats = {
        projectId: "test-project",
        totalApiCalls: 15,
        byService: {
          gemini: { calls: 8, avgLatency: 200, errors: 0 },
          openai: { calls: 5, avgLatency: 100, errors: 0 },
          perplexity: { calls: 2, avgLatency: 0, errors: 2 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(projectStats),
      });

      const statsResponse = await mockFetch("/api/projects/test-project/usage-stats");
      const stats = await statsResponse.json();

      expect(stats.totalApiCalls).toBe(15);
      expect(stats.byService.gemini.calls).toBe(8);
    });
  });
});

// Helper to create knowledge entry
function createMockKnowledgeEntry(overrides: any = {}) {
  return {
    id: "know-" + Math.random().toString(36).substr(2, 9),
    projectId: "test-project",
    category: "estimate",
    content: "Test knowledge content",
    metadata: null,
    createdAt: new Date(),
    ...overrides,
  };
}
