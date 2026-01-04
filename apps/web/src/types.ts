export interface Project {
  id: string;
  name: string;
  client: string;
  updatedAt: string;
  status: "active" | "completed" | "archived";
  currentStage: number; // 0-5
}

export enum StageStatus {
  TODO = "todo",
  RUNNING = "running",
  DONE = "done",
  ERROR = "error",
}

export interface Stage {
  id: string;
  label: string;
  status: StageStatus;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ApiHealth {
  provider: "Claude" | "OpenAI" | "Perplexity" | "Resend" | "Gamma";
  status: "healthy" | "degraded" | "down";
  latency: number; // ms
  errorRate: number; // percentage
}

export interface ProjectUsage {
  tokens: number;
  cost: number;
  storage: number; // MB
}
