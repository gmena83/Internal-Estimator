import { aiOrchestrator } from "../orchestrator.js";
import { PromptBuilder } from "../prompts/prompt-builder.js";

export class InputProcessingStrategy {
  private operation = "input_processing";

  async run(projectId: string, rawInput: string): Promise<any> {
    const provider = aiOrchestrator.getProvider(this.operation);
    const prompt = PromptBuilder.build("INPUT_PROCESSING", { rawInput });

    try {
      const result = await provider.generateContent(projectId, prompt, this.operation, 1);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      console.error("[InputStrategy] AI Error:", error);
      // For input processing, we don't return a system message in the data,
      // but we log it and let the caller handle the fallback.
      return null;
    }
  }
}
