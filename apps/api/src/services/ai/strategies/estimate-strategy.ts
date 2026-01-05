import { Project } from "@shared/schema";
import { aiOrchestrator } from "../orchestrator";
import { PromptBuilder } from "../prompts/prompt-builder";
import { DiagnosticErrorService } from "../fallbacks/diagnostics";
import { storage } from "../../../storage";

export class EstimateStrategy {
  private operation = "estimate";

  async run(project: Project): Promise<any> {
    const provider = aiOrchestrator.getProvider(this.operation);

    // 1. Ensure Research
    const researchMarkdown = await aiOrchestrator.ensureResearch(project);
    const pricingContext = "(Using standard ISI 2026 pricing matrix)"; // Could be expanded

    // 2. Fetch Learning Context (Approved Estimates)
    let learningContext = "No prior approved estimates available.";
    try {
      const approvedEstimates = await storage.getKnowledgeEntries("approved_estimate");
      if (approvedEstimates && approvedEstimates.length > 0) {
        // Take the 5 most recent approved estimates for better pattern recognition
        const recentLearnings = approvedEstimates
          .slice(0, 5)
          .map((e: any) => e.content)
          .join("\n\n---\n\n");
        learningContext = `
IMPORTANT - PRICING STANDARDIZATION:
The following are actual examples of projects the user has APPROVED recently.
You MUST align your pricing, hourly rates, and total costs with these examples.
If the current project is similar to one of these, use similar pricing.
Do not deviate significantly from these historical price points unless the scope is vastly different.

${recentLearnings}`;
      }
    } catch (err) {
      console.warn("Failed to fetch learning context:", err);
    }

    const parsedData = (project.parsedData as any) || {};
    const prompt = PromptBuilder.build("ESTIMATE", {
      title: project.title,
      mission: parsedData.mission || "Software development",
      objectives: parsedData.objectives || [],
      constraints: parsedData.constraints || [],
      targetBudget: project.targetBudget || "None provided",
      rawInput: project.rawInput || project.title,
      pricingContext,
      marketResearchContext: researchMarkdown,
      learningContext,
    });

    try {
      const result = await provider.generateContent(project.id, prompt, this.operation, 1);
      const data = JSON.parse(result);

      // Final update to project is still handled by aiService for now to maintain shared state logic
      return {
        ...data,
        researchMarkdown,
      };
    } catch (error) {
      const fix = DiagnosticErrorService.analyze(error, {
        service: provider.name,
        model: provider.model,
        operation: this.operation,
      });
      throw new Error(DiagnosticErrorService.formatAsSystemMessage(fix));
    }
  }
}
