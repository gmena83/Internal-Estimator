import { Project } from "@shared/schema";
import { aiOrchestrator } from "../orchestrator";
import { PromptBuilder } from "../prompts/prompt-builder";
import { DiagnosticErrorService } from "../fallbacks/diagnostics";

export class EstimateStrategy {
  private operation = "estimate";

  async run(project: Project): Promise<any> {
    const provider = aiOrchestrator.getProvider(this.operation);

    // 1. Ensure Research
    const researchMarkdown = await aiOrchestrator.ensureResearch(project);
    const pricingContext = "(Using standard ISI 2026 pricing matrix)"; // Could be expanded

    const parsedData = (project.parsedData as any) || {};
    const prompt = PromptBuilder.build("ESTIMATE", {
      title: project.title,
      mission: parsedData.mission || "Software development",
      objectives: parsedData.objectives || [],
      constraints: parsedData.constraints || [],
      rawInput: project.rawInput || project.title,
      pricingContext,
      marketResearchContext: researchMarkdown,
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
