import { Project, Scenario } from "@shared/schema";
import { aiOrchestrator } from "../orchestrator";
import { PromptBuilder } from "../prompts/prompt-builder";
import { DiagnosticErrorService } from "../fallbacks/diagnostics";

export class ExecutionStrategy {
  private operation = "execution";

  async generateGuides(project: Project): Promise<{ guideA: string; guideB: string }> {
    const provider = aiOrchestrator.getProvider(this.operation);
    const scenarioA = project.scenarioA as Scenario;
    const scenarioB = project.scenarioB as Scenario;

    const prompt = PromptBuilder.build("EXECUTION_GUIDES", {
      title: project.title,
      mission: (project.parsedData as any)?.mission || "Build solution",
      requirements: (project.parsedData as any)?.requirements || [],
      techStackA: scenarioA?.techStack,
      featuresA: scenarioA?.features,
      timelineA: scenarioA?.timeline,
      techStackB: scenarioB?.techStack,
      featuresB: scenarioB?.features,
      timelineB: scenarioB?.timeline,
    });

    try {
      const result = await provider.generateContent(project.id, prompt, this.operation, 4);
      return JSON.parse(result);
    } catch (error) {
      const fix = DiagnosticErrorService.analyze(error, {
        service: provider.name,
        model: provider.model,
        operation: this.operation,
      });
      return {
        guideA: DiagnosticErrorService.formatAsSystemMessage(fix),
        guideB: "Fix required in Guide A diagnostic.",
      };
    }
  }

  async generatePM(project: Project): Promise<any> {
    const provider = aiOrchestrator.getProvider("pm");
    const selectedScenario =
      project.selectedScenario === "A" ? project.scenarioA : project.scenarioB;

    const prompt = PromptBuilder.build("PM_BREAKDOWN", {
      title: project.title,
      approach: project.selectedScenario === "A" ? "High-Code Custom" : "No-Code MVP",
      scenarioDetails: selectedScenario,
      timeline: (selectedScenario as Scenario)?.timeline || "8 weeks",
    });

    try {
      const result = await provider.generateContent(project.id, prompt, "pm", 5);
      return JSON.parse(result);
    } catch (error) {
      const fix = DiagnosticErrorService.analyze(error, {
        service: provider.name,
        model: provider.model,
        operation: "pm",
      });
      return { error: DiagnosticErrorService.formatAsSystemMessage(fix) };
    }
  }
}
