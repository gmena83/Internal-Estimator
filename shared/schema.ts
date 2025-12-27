import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Projects table - main entity for ISI
export const projects = pgTable("projects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  clientName: text("client_name"),
  status: text("status").notNull().default("draft"), // draft, estimate_generated, assets_ready, email_sent, accepted, in_progress, completed
  currentStage: integer("current_stage").notNull().default(1), // 1-5
  rawInput: text("raw_input"), // Original email/notes pasted
  parsedData: jsonb("parsed_data"), // Mission, objectives, constraints extracted
  estimateMarkdown: text("estimate_markdown"), // Stage 1 output
  scenarioA: jsonb("scenario_a"), // High-Tech/Custom scenario
  scenarioB: jsonb("scenario_b"), // No-Code/MVP scenario
  selectedScenario: text("selected_scenario"), // 'A' or 'B'
  roiAnalysis: jsonb("roi_analysis"),
  proposalPdfUrl: text("proposal_pdf_url"),
  internalReportPdfUrl: text("internal_report_pdf_url"),
  presentationUrl: text("presentation_url"),
  coverImageUrl: text("cover_image_url"),
  emailContent: text("email_content"),
  emailSentAt: timestamp("email_sent_at"),
  emailOpened: boolean("email_opened").default(false),
  emailClicked: boolean("email_clicked").default(false),
  vibecodeGuideA: text("vibecode_guide_a"), // Manual A (High-Code)
  vibecodeGuideB: text("vibecode_guide_b"), // Manual B (No-Code)
  pmBreakdown: jsonb("pm_breakdown"), // Project management tasks
  attachments: jsonb("attachments").$type<Attachment[]>(), // Uploaded meeting notes, documents
  clientEmail: text("client_email"), // Client email for communication
  marketResearch: jsonb("market_research"), // Perplexity deep research results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table - chat history per project
export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  stage: integer("stage"), // Which stage this message relates to
  attachments: jsonb("attachments").$type<Attachment[]>(), // File attachments
  createdAt: timestamp("created_at").defaultNow(),
});

// Attachment type for reference documents
export type Attachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
};

// Knowledge base entries - for RAG system
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  category: text("category").notNull(), // 'estimate', 'tech_stack', 'hourly_rate', 'vibecode_prompt'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Additional structured data
  embedding: text("embedding"), // Will store serialized vector for similarity search
  createdAt: timestamp("created_at").defaultNow(),
});

// API health tracking
export const apiHealthLogs = pgTable("api_health_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  service: text("service").notNull(), // 'gemini', 'claude', 'openai', 'perplexity', 'pdf_co', 'resend', 'gamma', 'nano_banana'
  status: text("status").notNull(), // 'online', 'degraded', 'offline'
  latencyMs: integer("latency_ms"),
  errorMessage: text("error_message"),
  requestCount: integer("request_count").default(0),
  lastChecked: timestamp("last_checked").defaultNow(),
});

// Diagnostic reports table for repository audits
export const diagnosticReports = pgTable("diagnostic_reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  repoUrl: text("repo_url").notNull(),
  repoOwner: text("repo_owner").notNull(),
  repoName: text("repo_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, analyzing, completed, failed
  healthAssessment: text("health_assessment"), // Executive summary paragraph
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),
  findings: jsonb("findings").$type<DiagnosticFinding[]>(),
  correctedSnippets: jsonb("corrected_snippets").$type<CorrectedSnippet[]>(),
  fullReportMarkdown: text("full_report_markdown"),
  analyzedFiles: jsonb("analyzed_files").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Diagnostic finding type
export type DiagnosticFinding = {
  file: string;
  line?: number;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  recommendation: string;
};

// Corrected code snippet type
export type CorrectedSnippet = {
  file: string;
  language: string;
  original?: string;
  corrected: string;
  description: string;
};

// API usage tracking per project
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'gemini', 'claude', 'openai', 'perplexity'
  model: text("model").notNull(), // e.g., 'gemini-2.0-flash-exp', 'claude-3-opus', 'gpt-4o'
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  costUsd: text("cost_usd").notNull().default("0"), // stored as string for precision
  operation: text("operation"), // 'estimate', 'chat', 'market_research', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  messages: many(messages),
  knowledgeEntries: many(knowledgeEntries),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
}));

export const knowledgeEntriesRelations = relations(knowledgeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [knowledgeEntries.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertApiHealthLogSchema = createInsertSchema(apiHealthLogs).omit({
  id: true,
  lastChecked: true,
});

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({
  id: true,
  createdAt: true,
});

export const insertDiagnosticReportSchema = createInsertSchema(diagnosticReports).omit({
  id: true,
  createdAt: true,
});

// RPC Schemas
export const emailUpdateSchema = z.object({
  email: z.string().email(),
});

export const scenarioSelectionSchema = z.object({
  scenario: z.enum(["A", "B"]),
});

export const imageApprovalSchema = z.object({
  imageId: z.string().optional(),
  imageUrl: z.string().optional(),
}).refine(data => data.imageId || data.imageUrl, {
  message: "Either imageId or imageUrl must be provided",
});


// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type ApiHealthLog = typeof apiHealthLogs.$inferSelect;
export type InsertApiHealthLog = z.infer<typeof insertApiHealthLogSchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type DiagnosticReport = typeof diagnosticReports.$inferSelect;
export type InsertDiagnosticReport = z.infer<typeof insertDiagnosticReportSchema>;

// Scenario types
export type Scenario = {
  name: string;
  description: string;
  features: string[];
  featureBreakdown?: FeatureBreakdown[];
  techStack: string[];
  timeline: string;
  totalCost: number;
  hourlyRate: number;
  totalHours: number;
  pros: string[];
  cons: string[];
  recommended: boolean;
  ongoingCosts?: OngoingCosts;
  regionalAlternatives?: RegionalAlternative[];
  multipliers?: PricingMultipliers;
  rateJustification?: string;
};

export type ROIAnalysis = {
  costOfDoingNothing: number;
  manualOperationalCost: number;
  projectedSavings: number;
  paybackPeriodMonths: number;
  threeYearROI: number;
  methodology?: string;
};

export type OngoingCosts = {
  annualMaintenanceLow: number;
  annualMaintenanceHigh: number;
  monthlyCloudInfraLow: number;
  monthlyCloudInfraHigh: number;
  monthlyAiApiLow: number;
  monthlyAiApiHigh: number;
  monthlyMonitoringLow: number;
  monthlyMonitoringHigh: number;
};

export type RegionalAlternative = {
  region: string;
  multiplier: number;
  adjustedCost: number;
  notes: string;
};

export type FeatureBreakdown = {
  feature: string;
  hours: number;
  cost: number;
  expectedRangeLow: number;
  expectedRangeHigh: number;
};

export type PricingMultipliers = {
  complexity: { factor: string; description: string };
  data: { factor: string; description: string };
  integration: { factor: string; description: string };
  customization: { factor: string; description: string };
  timeline: { factor: string; description: string };
};

export type PMPhase = {
  phaseNumber: number;
  phaseName: string;
  objectives: string[];
  deliverables: string[];
  tasks: PMTask[];
  durationDays: number;
  dependencies: string[];
};

export type PMTaskChecklistItem = {
  id: string;
  action: string;
  completed: boolean;
};

export type PMTask = {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  assignee?: string;
  status: "pending" | "in_progress" | "completed";
  subtasks: PMSubtask[];
  checklist: PMTaskChecklistItem[];
};

export type PMSubtask = {
  id: string;
  name: string;
  completed: boolean;
};

// API Health types
export type ServiceStatus = {
  service: string;
  displayName: string;
  status: "online" | "degraded" | "offline" | "unknown";
  latencyMs?: number;
  requestCount?: number;
  lastChecked?: Date;
};

// API Usage aggregated stats per project
export type ProjectApiUsageStats = {
  provider: string;
  displayName: string;
  model: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  callCount: number;
};

// Stage definitions
export const STAGES = [
  {
    number: 1,
    name: "Dual Scenario Estimate",
    description: "Analyze input and generate financial scenarios",
  },
  { number: 2, name: "Production Assets", description: "Generate PDFs and presentations" },
  { number: 3, name: "Client Communication", description: "Send proposal and track engagement" },
  { number: 4, name: "Vibecoding Guide", description: "Generate developer execution guides" },
  { number: 5, name: "PM Breakdown", description: "Create detailed project management plan" },
] as const;
