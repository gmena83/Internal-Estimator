import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Projects table - main entity for ISI
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table - chat history per project
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  stage: integer("stage"), // Which stage this message relates to
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge base entries - for RAG system
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  category: text("category").notNull(), // 'estimate', 'tech_stack', 'hourly_rate', 'vibecode_prompt'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Additional structured data
  embedding: text("embedding"), // Will store serialized vector for similarity search
  createdAt: timestamp("created_at").defaultNow(),
});

// API health tracking
export const apiHealthLogs = pgTable("api_health_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull(), // 'gemini', 'claude', 'openai', 'pdf_co', 'resend', 'gamma', 'nano_banana'
  status: text("status").notNull(), // 'online', 'degraded', 'offline'
  latencyMs: integer("latency_ms"),
  errorMessage: text("error_message"),
  requestCount: integer("request_count").default(0),
  lastChecked: timestamp("last_checked").defaultNow(),
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

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type ApiHealthLog = typeof apiHealthLogs.$inferSelect;
export type InsertApiHealthLog = z.infer<typeof insertApiHealthLogSchema>;

// Scenario types
export type Scenario = {
  name: string;
  description: string;
  features: string[];
  techStack: string[];
  timeline: string;
  totalCost: number;
  hourlyRate: number;
  totalHours: number;
  pros: string[];
  cons: string[];
  recommended: boolean;
};

export type ROIAnalysis = {
  costOfDoingNothing: number;
  manualOperationalCost: number;
  projectedSavings: number;
  paybackPeriodMonths: number;
  threeYearROI: number;
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

export type PMTask = {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed';
  subtasks: PMSubtask[];
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
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  latencyMs?: number;
  requestCount?: number;
  lastChecked?: Date;
};

// Stage definitions
export const STAGES = [
  { number: 1, name: 'Dual Scenario Estimate', description: 'Analyze input and generate financial scenarios' },
  { number: 2, name: 'Production Assets', description: 'Generate PDFs and presentations' },
  { number: 3, name: 'Client Communication', description: 'Send proposal and track engagement' },
  { number: 4, name: 'Vibecoding Guide', description: 'Generate developer execution guides' },
  { number: 5, name: 'PM Breakdown', description: 'Create detailed project management plan' },
] as const;
