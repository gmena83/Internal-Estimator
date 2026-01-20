import { Project } from "@internal/shared";
import { storage } from "./storage";
import { ChatStrategy } from "./services/ai/strategies/chat-strategy";
import { EstimateStrategy } from "./services/ai/strategies/estimate-strategy";
import { ExecutionStrategy } from "./services/ai/strategies/execution-strategy";
import { InputProcessingStrategy } from "./services/ai/strategies/input-strategy";
import { AIResponseChunk } from "./services/ai/providers/base-provider";

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
  async generateEmailContent(project: Project): Promise<string> {
    const provider = new (await import("./services/ai/providers/openai-provider")).OpenAIProvider();
    const scenario = project.selectedScenario === 'A' 
      ? project.scenarioA as any
      : project.scenarioB as any;
    
    const roiAnalysis = project.roiAnalysis as any;
    
    const { PromptBuilder } = await import("./services/ai/prompts/prompt-builder");
    const prompt = PromptBuilder.build('EMAIL_CONTENT', {
      title: project.title,
      clientName: project.clientName || 'Valued Client',
      selectedScenario: project.selectedScenario === 'A' ? 'High-Tech Custom Development' : 'No-Code MVP Solution',
      totalCost: scenario?.totalCost?.toLocaleString() || 'To be discussed',
      timeline: scenario?.timeline || 'To be discussed',
      features: scenario?.features?.slice(0, 5)?.join(', ') || 'Tailored to your needs',
      roiHighlights: roiAnalysis?.projectedSavings 
        ? `Projected annual savings of $${roiAnalysis.projectedSavings.toLocaleString()} with a payback period of ${roiAnalysis.paybackPeriodMonths || 'N/A'} months`
        : 'Significant efficiency improvements expected',
    });
    
    try {
      const content = await provider.generateContent(project.id, prompt, 'email', 3);
      return content;
    } catch (error) {
      console.error('Email generation failed:', error);
      // Return a sensible fallback
      return `Thank you for considering us for your ${project.title} project.

Based on our analysis, we've prepared a comprehensive proposal that outlines ${project.selectedScenario === 'A' ? 'a custom high-tech solution' : 'an efficient no-code approach'} tailored to your specific needs.

The attached proposal includes detailed breakdowns of features, timeline, and investment. We believe this solution will deliver significant value to your organization.

We would welcome the opportunity to discuss this proposal with you and answer any questions you may have.`;
    }
  },
};

// Re-export fallback helpers if needed by other services
export { getStageAwareResponse } from "./services/ai/fallbacks/defaults"; // Create this
