import { OpenAIProvider } from "./providers/openai-provider";
import { GeminiProvider } from "./providers/gemini-provider";
import { IAIProvider } from "./providers/base-provider";
import { conductMarketResearch, formatMarketResearchMarkdown } from "../../perplexity-service";
import { storage } from "../../storage";
import { Project } from "@shared/schema";

export class AIOrchestrator {
  private openai = new OpenAIProvider();
  private gemini = new GeminiProvider();

  /**
   * Selects the best provider for the operation.
   * Decisions are hardcoded for consistency as requested.
   */
  getProvider(operation: string): IAIProvider {
    switch (operation) {
      case "estimate":
      case "chat":
        return this.openai;
      case "execution":
      case "pm":
        return this.gemini;
      default:
        return this.openai;
    }
  }

  /**
   * Ensures research is conducted if missing.
   */
  async ensureResearch(project: Project): Promise<string> {
    const parsedData = (project.parsedData as any) || {};
    if (parsedData.marketResearch) {
      return formatMarketResearchMarkdown(parsedData.marketResearch);
    }

    // Trigger Perplexity automatically as requested
    console.log(
      `[Orchestrator] Missing research for project ${project.id}, triggering Perplexity...`,
    );
    const projectType = parsedData?.mission || project.title || "software development";
    const projectDesc = project.rawInput || project.title || "";

    try {
      const research = await conductMarketResearch(projectType, projectDesc, project.id);
      // Update project with research so we don't repeat it
      await storage.updateProject(project.id, {
        parsedData: { ...parsedData, marketResearch: research },
      });
      return formatMarketResearchMarkdown(research);
    } catch (error) {
      console.error("[Orchestrator] Research failed:", error);
      return "*Research unavailable due to automated service error.*";
    }
  }
}

export const aiOrchestrator = new AIOrchestrator();
