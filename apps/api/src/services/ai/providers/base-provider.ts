import { storage } from "../../../storage.js";
import { logApiUsage } from "../../../usage-tracker.js";

export interface AIResponseChunk {
  content: string;
  stage: number;
  isFinal?: boolean;
}

export interface IAIProvider {
  name: string;
  model: string;
  generateContent(
    projectId: string,
    prompt: string,
    operation: string,
    stage: number,
  ): Promise<string>;
  streamContent(
    projectId: string,
    prompt: string,
    operation: string,
    stage: number,
  ): AsyncGenerator<AIResponseChunk>;
}

export abstract class BaseAIProvider implements IAIProvider {
  abstract name: string;
  abstract model: string;

  async trackHealth(startTime: number, error?: Error): Promise<void> {
    const latencyMs = Date.now() - startTime;
    await storage.updateApiHealth({
      service: this.name,
      status: error ? "degraded" : "online",
      latencyMs,
      errorMessage: error?.message,
    });
  }

  protected logUsage(projectId: string, input: string, output: string, operation: string): void {
    logApiUsage({
      projectId,
      provider: this.name as any,
      model: this.model,
      inputText: input,
      outputText: output,
      operation: operation as any,
    });
  }

  abstract generateContent(
    projectId: string,
    prompt: string,
    operation: string,
    stage: number,
  ): Promise<string>;
  abstract streamContent(
    projectId: string,
    prompt: string,
    operation: string,
    stage: number,
  ): AsyncGenerator<AIResponseChunk>;
}
