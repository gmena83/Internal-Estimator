import { GoogleGenAI } from "@google/genai";
import { BaseAIProvider, AIResponseChunk } from "./base-provider";

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenAI | null = null;
  name = "gemini";
  model = "gemini-2.5-flash";

  constructor() {
    super();
    const hasGeminiIntegration = !!(
      (process.env.AI_INTEGRATIONS_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) ||
      process.env.GEMINI_API_KEY
    );

    if (hasGeminiIntegration) {
      this.client = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
        httpOptions: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
          ? {
              apiVersion: "",
              baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
            }
          : undefined,
      });
    }
  }

  async generateContent(
    projectId: string,
    prompt: string,
    operation: string,
    _stage: number,
  ): Promise<string> {
    if (!this.client) throw new Error("Gemini provider not initialized");
    const startTime = Date.now();

    try {
      // Note: The Google SDK structure in the codebase (ai-service.ts) shows:
      // await gemini.models.generateContent({ model: "gemini-3-pro-preview", contents: ... })

      const response = await (this.client as any).models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const content = response.text || "";
      await this.trackHealth(startTime);
      await this.logUsage(projectId, prompt, content, operation);
      return content;
    } catch (error) {
      await this.trackHealth(startTime, error as Error);
      throw error;
    }
  }

  async *streamContent(
    projectId: string,
    prompt: string,
    operation: string,
    _stage: number,
  ): AsyncGenerator<AIResponseChunk> {
    if (!this.client) throw new Error("Gemini provider not initialized");
    const startTime = Date.now();

    try {
      // For now, if Gemini doesn't support streaming in this specific SDK version easily,
      // we'll emulate it or implement ifSDK supports it.
      // Based on ai-service.ts, Gemini was NOT being streamed.
      const response = await this.generateContent(projectId, prompt, operation, _stage);
      yield { content: response, stage: _stage, isFinal: true };
    } catch (error) {
      await this.trackHealth(startTime, error as Error);
      throw error;
    }
  }
}
