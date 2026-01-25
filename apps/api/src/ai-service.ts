import { Project } from "@internal/shared";
import { storage } from "./storage.js";
import { ChatStrategy } from "./services/ai/strategies/chat-strategy.js";
import { EstimateStrategy } from "./services/ai/strategies/estimate-strategy.js";
import { ExecutionStrategy } from "./services/ai/strategies/execution-strategy.js";
import { InputProcessingStrategy } from "./services/ai/strategies/input-strategy.js";
import { AIResponseChunk } from "./services/ai/providers/base-provider.js";

// Instantiate strategies
const chatStrategy = new ChatStrategy();
const estimateStrategy = new EstimateStrategy();
const executionStrategy = new ExecutionStrategy();
const inputStrategy = new InputProcessingStrategy();

export const aiService = {
  // 1. Process Raw Input
  async processRawInput(projectId: string, rawInput: string): Promise<void> {
    try {
      const parsedData = await inputStrategy.run(projectId, rawInput);

      await storage.updateProject(projectId, {
        parsedData: parsedData || {},
        clientName: parsedData?.clientName || undefined,
      });

      // Generate initial estimate
      const project = await storage.getProject(projectId);
      if (project) {
        await this.generateEstimate(project);
      }
    } catch (error) {
      console.error("Error processing raw input:", error);
      const project = await storage.getProject(projectId);
      if (project) await this.generateEstimate(project);
    }
  },

  // 2. Chat Messaging (Legacy/Sync)
  async processMessage(
    project: Project,
    userMessage: string,
  ): Promise<{ content: string; stage: number }> {
    return await chatStrategy.process(project, userMessage);
  },

  // 3. Chat Streaming
  async *streamMessage(project: Project, userMessage: string): AsyncGenerator<AIResponseChunk> {
    yield* chatStrategy.stream(project, userMessage);
  },

  // 4. Estimate Generation
  async generateEstimate(project: Project): Promise<any> {
    const result = await estimateStrategy.run(project);

    // Final persistence to storage
    await storage.updateProject(project.id, {
      estimateMarkdown: result.scenarios?.markdown || result.markdown, // Handle varying provider outputs
      researchMarkdown: result.researchMarkdown,
      scenarioA: result.scenarios?.scenarioA || result.scenarioA,
      scenarioB: result.scenarios?.scenarioB || result.scenarioB,
      roiAnalysis: result.scenarios?.roiAnalysis || result.roiAnalysis,
      status: "estimate_generated",
    });

    return result;
  },

  // 5. Execution Guides (Merged)
  async generateVibeGuides(project: Project): Promise<{ guideA: string; guideB: string }> {
    return await executionStrategy.generateGuides(project);
  },

  // 6. PM Breakdown
  async generatePMBreakdown(project: Project): Promise<any> {
    return await executionStrategy.generatePM(project);
  },

  /**
   * Note: generateEmail and other small helpers can be added here
   * or moved to CommunicationStrategy if they grow.
   */
  async generateEmailContent(_project: Project): Promise<string> {
    return "Email generation is being refactored into ExecutionStrategy delivery phase.";
  },
};

// Re-export fallback helpers if needed by other services
export { getStageAwareResponse } from "./services/ai/fallbacks/defaults.js"; // Create this
