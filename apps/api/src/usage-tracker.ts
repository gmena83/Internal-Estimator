import { storage } from "./storage.js";

export type AIProvider = "gemini" | "claude" | "openai" | "perplexity";
export type OperationType =
  | "input_processing"
  | "estimate"
  | "chat"
  | "market_research"
  | "vibecode"
  | "pm_breakdown"
  | "image_generation"
  | "email";

const PRICING: Record<AIProvider, Record<string, { inputPer1M: number; outputPer1M: number }>> = {
  gemini: {
    "gemini-2.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
    "gemini-2.0-flash-exp": { inputPer1M: 0.1, outputPer1M: 0.4 },
    default: { inputPer1M: 0.1, outputPer1M: 0.4 },
  },
  claude: {
    "claude-3-5-sonnet-20241022": { inputPer1M: 3.0, outputPer1M: 15.0 },
    "claude-3-opus-20240229": { inputPer1M: 15.0, outputPer1M: 75.0 },
    default: { inputPer1M: 3.0, outputPer1M: 15.0 },
  },
  openai: {
    "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
    "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
    "gpt-4-turbo": { inputPer1M: 10.0, outputPer1M: 30.0 },
    default: { inputPer1M: 2.5, outputPer1M: 10.0 },
  },
  perplexity: {
    "sonar-deep-research": { inputPer1M: 2.0, outputPer1M: 8.0 },
    "llama-3.1-sonar-large-128k-online": { inputPer1M: 1.0, outputPer1M: 1.0 },
    "llama-3.1-sonar-small-128k-online": { inputPer1M: 0.2, outputPer1M: 0.2 },
    default: { inputPer1M: 2.0, outputPer1M: 8.0 },
  },
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateCost(
  provider: AIProvider,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const providerPricing = PRICING[provider];
  const modelPricing = providerPricing[model] || providerPricing.default;

  const inputCost = (inputTokens / 1_000_000) * modelPricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.outputPer1M;

  return inputCost + outputCost;
}

export interface UsageData {
  projectId: string;
  provider: AIProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  inputText?: string;
  outputText?: string;
  operation?: OperationType;
}

export function logApiUsage(data: UsageData): void {
  // Fire and forget - do not await
  (async () => {
    try {
      const inputTokens = data.inputTokens ?? (data.inputText ? estimateTokens(data.inputText) : 0);
      const outputTokens =
        data.outputTokens ?? (data.outputText ? estimateTokens(data.outputText) : 0);
      const totalTokens = inputTokens + outputTokens;
      const costUsd = calculateCost(data.provider, data.model, inputTokens, outputTokens);

      await storage.logApiUsage({
        projectId: data.projectId,
        provider: data.provider,
        model: data.model,
        inputTokens,
        outputTokens,
        totalTokens,
        costUsd: costUsd.toFixed(6),
        operation: data.operation,
      });
    } catch (error) {
      console.error("Failed to log API usage:", error);
    }
  })();
}

export function getModelForProvider(provider: AIProvider): string {
  switch (provider) {
    case "gemini":
      return "gemini-2.5-flash";
    case "claude":
      return "claude-3-5-sonnet-20241022";
    case "openai":
      return "gpt-4o";
    case "perplexity":
      return "sonar-deep-research";
    default:
      return "unknown";
  }
}
