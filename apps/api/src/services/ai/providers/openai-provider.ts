import OpenAI from "openai";
import { BaseAIProvider, AIResponseChunk } from "./base-provider.js";

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI | null = null;
  name = "openai";
  model = "gpt-4o"; // Fixed hallucinated gpt-5

  constructor() {
    super();
    const hasOpenAIIntegration = !!(
      (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) ||
      process.env.OPENAI_API_KEY
    );

    if (hasOpenAIIntegration) {
      this.client = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "",
      });
    }
  }

  async generateContent(
    projectId: string,
    prompt: string,
    operation: string,
    _stage: number,
  ): Promise<string> {
    if (!this.client) throw new Error("OpenAI provider not initialized");
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2048,
        response_format: operation === "estimate" ? { type: "json_object" } : undefined,
      });

      const content = response.choices[0]?.message?.content || "";
      await this.trackHealth(startTime);
      this.logUsage(projectId, prompt, content, operation);
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
    if (!this.client) throw new Error("OpenAI provider not initialized");
    const startTime = Date.now();
    let fullContent = "";

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_completion_tokens: 1024,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          yield { content, stage: _stage };
        }
      }

      await this.trackHealth(startTime);
      this.logUsage(projectId, prompt, fullContent, operation);
      yield { content: "", stage: _stage, isFinal: true };
    } catch (error) {
      await this.trackHealth(startTime, error as Error);
      throw error;
    }
  }
}
