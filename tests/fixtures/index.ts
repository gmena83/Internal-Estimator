import type { Project, Message, KnowledgeEntry, ApiHealthLog } from "../../shared/schema";

// Base project fixture
export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: "test-project-" + Math.random().toString(36).substr(2, 9),
  title: "Test Project",
  clientName: "Test Client",
  status: "in_progress",
  currentStage: 1,
  rawInput: "Build a mobile app for task management with AI features",
  parsedData: {
    mission: "Create an AI-powered task management solution",
    objectives: ["Task tracking", "AI prioritization", "Team collaboration"],
    constraints: ["Budget under $50k", "3 month timeline"],
    techPreferences: ["React Native", "Node.js"],
    timeline: "3 months",
    estimatedBudget: "$50,000",
    clientName: "Test Client",
  },
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
});

// Project with estimate generated
export const createMockProjectWithEstimate = (): Project =>
  createMockProject({
    currentStage: 2,
    status: "estimate_generated",
    estimateMarkdown: getMockEstimateMarkdown(),
    scenarioA: getMockScenarioA(),
    scenarioB: getMockScenarioB(),
    roiAnalysis: getMockRoiAnalysis(),
  });

// Project with full data
export const createMockProjectComplete = (): Project =>
  createMockProject({
    currentStage: 5,
    status: "complete",
    estimateMarkdown: getMockEstimateMarkdown(),
    scenarioA: getMockScenarioA(),
    scenarioB: getMockScenarioB(),
    roiAnalysis: getMockRoiAnalysis(),
    proposalPdfUrl: "/api/projects/test-id/proposal.pdf",
    internalReportPdfUrl: "/api/projects/test-id/internal-report.pdf",
    presentationUrl: "https://gamma.app/test",
    emailContent: "Dear Test Client,\n\nPlease find attached our proposal...",
    emailSentAt: new Date(),
    vibecodeGuideA: getMockVibecodeGuide("A"),
    vibecodeGuideB: getMockVibecodeGuide("B"),
    pmBreakdown: getMockPmBreakdown(),
    clientEmail: "client@example.com",
  });

// Scenario A fixture
export const getMockScenarioA = () => ({
  name: "High-Tech Custom",
  description: "Full custom development with maximum flexibility",
  recommended: true,
  techStack: ["React", "Node.js", "PostgreSQL", "AWS"],
  features: [
    "Custom UI Development (80 hrs)",
    "Backend API Development (120 hrs)",
    "AI Integration (60 hrs)",
    "Testing & QA (40 hrs)",
  ],
  timeline: "8-12 weeks",
  totalHours: 300,
  hourlyRate: 150,
  totalCost: 45000,
  pros: ["Complete ownership", "Maximum flexibility", "Scalable architecture"],
  cons: ["Higher initial cost", "Longer timeline"],
});

// Scenario B fixture
export const getMockScenarioB = () => ({
  name: "No-Code MVP",
  description: "Rapid development using no-code platforms",
  recommended: false,
  techStack: ["Bubble", "Zapier", "Airtable", "OpenAI API"],
  features: [
    "No-code UI Setup (40 hrs)",
    "Workflow Automation (30 hrs)",
    "AI Integration via API (20 hrs)",
    "Testing & Launch (20 hrs)",
  ],
  timeline: "4-6 weeks",
  totalHours: 110,
  hourlyRate: 75,
  totalCost: 8250,
  pros: ["Lower cost", "Faster launch", "Easy to iterate"],
  cons: ["Limited customization", "Platform dependencies"],
});

// ROI Analysis fixture
export const getMockRoiAnalysis = () => ({
  costOfDoingNothing: 30000,
  manualOperationalCost: 25000,
  projectedSavings: 40000,
  paybackPeriodMonths: { scenarioA: 14, scenarioB: 3 },
  threeYearROI: { scenarioA: 167, scenarioB: 345 },
  projectedSavingsDescription: "Annual savings from automation and efficiency gains",
  manualOperationalCostDescription: "Current annual cost of manual processes",
});

// Estimate markdown fixture
export const getMockEstimateMarkdown = () => `
# Project Estimate: Test Project

## Executive Summary

This estimate presents two strategic approaches for your project.

### Mission
Create an AI-powered task management solution

### Objectives
- Task tracking
- AI prioritization
- Team collaboration

---

## Scenario Comparison

### Scenario A: High-Tech Custom

**Full custom development with maximum flexibility**

| Metric | Value |
|--------|-------|
| Timeline | 8-12 weeks |
| Total Hours | 300 |
| Hourly Rate | $150 |
| **Total Investment** | **$45,000** |

### Scenario B: No-Code MVP

**Rapid development using no-code platforms**

| Metric | Value |
|--------|-------|
| Timeline | 4-6 weeks |
| Total Hours | 110 |
| Hourly Rate | $75 |
| **Total Investment** | **$8,250** |

---

## ROI Analysis

| Metric | Annual Value |
|--------|--------------|
| Cost of Doing Nothing | $30,000/year |
| Manual Operational Cost | $25,000/year |
| Projected Savings | $40,000/year |

---

*Estimate generated by ISI Agent*
`;

// Vibecode guide fixture
export const getMockVibecodeGuide = (scenario: "A" | "B") => `
# Manual ${scenario}: ${scenario === "A" ? "High-Code" : "No-Code"} Approach

## Project: Test Project

## Tech Stack
${scenario === "A" ? "- React\n- Node.js\n- PostgreSQL\n- AWS" : "- Bubble\n- Zapier\n- Airtable"}

## Setup Instructions

### Step 1: Initialize Project
\`\`\`
VIBECODE PROMPT:
Create a new ${scenario === "A" ? "full-stack application" : "no-code workflow"}
\`\`\`

## Testing Checklist
- [ ] All features work correctly
- [ ] Error handling is in place
`;

// PM Breakdown fixture
export const getMockPmBreakdown = () => ({
  phases: [
    {
      phaseNumber: 1,
      phaseName: "Discovery & Planning",
      objectives: ["Gather requirements", "Define scope"],
      deliverables: ["Project Brief", "Technical Spec"],
      durationDays: 5,
      dependencies: [],
      tasks: [
        { id: "1.1", name: "Stakeholder interviews", estimatedHours: 8 },
        { id: "1.2", name: "Requirements documentation", estimatedHours: 12 },
      ],
    },
    {
      phaseNumber: 2,
      phaseName: "Development",
      objectives: ["Build core features", "Integration"],
      deliverables: ["Working MVP", "API Documentation"],
      durationDays: 20,
      dependencies: [1],
      tasks: [
        { id: "2.1", name: "Frontend development", estimatedHours: 80 },
        { id: "2.2", name: "Backend development", estimatedHours: 120 },
      ],
    },
  ],
});

// Message fixture
export const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: "test-message-" + Math.random().toString(36).substr(2, 9),
  projectId: "test-project-id",
  role: "user",
  content: "Test message content",
  timestamp: new Date(),
  attachments: null,
  metadata: null,
  ...overrides,
});

// Knowledge entry fixture
export const createMockKnowledgeEntry = (
  overrides: Partial<KnowledgeEntry> = {},
): KnowledgeEntry => ({
  id: "test-knowledge-" + Math.random().toString(36).substr(2, 9),
  projectId: "test-project-id",
  category: "estimate",
  content: "Test knowledge content",
  metadata: null,
  createdAt: new Date(),
  ...overrides,
});

// API Health Log fixture
export const createMockApiHealthLog = (overrides: Partial<ApiHealthLog> = {}): ApiHealthLog => ({
  id: "test-health-" + Math.random().toString(36).substr(2, 9),
  projectId: "test-project-id",
  service: "gemini",
  status: "online",
  latencyMs: 150,
  requestCount: 1,
  errorMessage: null,
  timestamp: new Date(),
  ...overrides,
});

// AI Response fixtures
export const getMockAiParseResponse = () => ({
  mission: "Create an AI-powered solution",
  objectives: ["Objective 1", "Objective 2"],
  constraints: ["Budget: $50k", "Timeline: 3 months"],
  techPreferences: ["React", "Node.js"],
  timeline: "3 months",
  estimatedBudget: "$50,000",
  clientName: "Test Client",
});

export const getMockAiEstimateResponse = () => ({
  estimateMarkdown: getMockEstimateMarkdown(),
  scenarioA: getMockScenarioA(),
  scenarioB: getMockScenarioB(),
  roiAnalysis: getMockRoiAnalysis(),
});

// API Health status fixtures
export const getMockHealthStatus = () => [
  { service: "gemini", displayName: "Gemini", status: "online", latencyMs: 150, requestCount: 5 },
  { service: "claude", displayName: "Claude", status: "online", latencyMs: 200, requestCount: 3 },
  { service: "openai", displayName: "OpenAI", status: "online", latencyMs: 100, requestCount: 7 },
  {
    service: "perplexity",
    displayName: "Perplexity",
    status: "error",
    latencyMs: 0,
    requestCount: 1,
  },
];
