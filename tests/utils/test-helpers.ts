import { vi } from "vitest";
import type { Project, InsertProject } from "../../shared/schema";

/**
 * Mock AI service responses for deterministic testing
 */
export const mockAIResponses = {
  processRawInput: {
    parsedData: {
      mission: "Build a test application",
      objectives: ["Test objective 1", "Test objective 2"],
      constraints: ["Budget: $10k", "Timeline: 2 weeks"],
    },
  },
  generateEstimate: {
    estimateMarkdown: "# Test Estimate\n\nThis is a test estimate.",
    scenarioA: {
      name: "High-Tech Solution",
      totalCost: 50000,
      timeline: "12 weeks",
      features: ["Feature 1", "Feature 2"],
    },
    scenarioB: {
      name: "MVP Solution",
      totalCost: 25000,
      timeline: "6 weeks",
      features: ["Feature 1"],
    },
  },
};

/**
 * Create a mock project for testing
 */
export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "test-project-id",
    title: "Test Project",
    clientName: "Test Client",
    status: "draft",
    currentStage: 1,
    rawInput: "Test raw input",
    parsedData: null,
    estimateMarkdown: null,
    scenarioA: null,
    scenarioB: null,
    selectedScenario: null,
    roiAnalysis: null,
    proposalPdfUrl: null,
    internalReportPdfUrl: null,
    presentationUrl: null,
    coverImageUrl: null,
    emailContent: null,
    emailSentAt: null,
    emailOpened: false,
    emailClicked: false,
    vibecodeGuideA: null,
    vibecodeGuideB: null,
    pmBreakdown: null,
    attachments: null,
    clientEmail: null,
    marketResearch: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock insert project data
 */
export function createMockInsertProject(overrides: Partial<InsertProject> = {}): InsertProject {
  return {
    title: "Test Project",
    rawInput: "Test raw input",
    clientName: "Test Client",
    ...overrides,
  };
}

/**
 * Mock fetch for API testing
 */
export function mockFetch(response: any, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
}

/**
 * Wait for async operations
 */
export async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
