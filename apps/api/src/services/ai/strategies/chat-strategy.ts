import { Project } from "@shared/schema";
import { aiOrchestrator } from "../orchestrator";
import { PromptBuilder } from "../prompts/prompt-builder";
import { DiagnosticErrorService } from "../fallbacks/diagnostics";
import { AIResponseChunk } from "../providers/base-provider";

export class ChatStrategy {
  private operation = "chat";

  async *stream(project: Project, userMessage: string): AsyncGenerator<AIResponseChunk> {
    const provider = aiOrchestrator.getProvider(this.operation);
    const prompt =
      PromptBuilder.build("CHAT_SYSTEM", {
        title: project.title,
        currentStage: project.currentStage,
        status: project.status,
      }) + `\n\nUser: ${userMessage}`;

    try {
      yield* provider.streamContent(project.id, prompt, this.operation, project.currentStage);
    } catch (error) {
      const fix = DiagnosticErrorService.analyze(error, {
        service: provider.name,
        model: provider.model,
        operation: this.operation,
      });
      yield {
        content: DiagnosticErrorService.formatAsSystemMessage(fix),
        stage: project.currentStage,
        isFinal: true,
      };
    }
  }

  async process(
    project: Project,
    userMessage: string,
  ): Promise<{ content: string; stage: number }> {
    const provider = aiOrchestrator.getProvider(this.operation);
    const prompt =
      PromptBuilder.build("CHAT_SYSTEM", {
        title: project.title,
        currentStage: project.currentStage,
        status: project.status,
      }) + `\n\nUser: ${userMessage}`;

    try {
      const content = await provider.generateContent(
        project.id,
        prompt,
        this.operation,
        project.currentStage,
      );
      return { content, stage: project.currentStage };
    } catch (error) {
      const fix = DiagnosticErrorService.analyze(error, {
        service: provider.name,
        model: provider.model,
        operation: this.operation,
      });
      return {
        content: DiagnosticErrorService.formatAsSystemMessage(fix),
        stage: project.currentStage,
      };
    }
  }
}
