import {
  projects,
  messages,
  knowledgeEntries,
  apiHealthLogs,
  apiUsageLogs,
  diagnosticReports,
  type Project,
  type InsertProject,
  type Message,
  type InsertMessage,
  type KnowledgeEntry,
  type InsertKnowledgeEntry,
  type ApiHealthLog,
  type InsertApiHealthLog,
  type ApiUsageLog,
  type InsertApiUsageLog,
  type ProjectApiUsageStats,
  type DiagnosticReport,
  type InsertDiagnosticReport,
  users,
  type User,
  type InsertUser,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, sql, sum, count } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const PostgresSessionStore = connectPgSimple(session);

export type ProjectSummary = Pick<
  Project,
  "id" | "title" | "status" | "updatedAt" | "clientName" | "currentStage" | "rawInput"
>;

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<ProjectSummary[]>;
  getRecentProjects(limit?: number): Promise<ProjectSummary[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  getProjectDashboard(id: string): Promise<any>;

  // Messages
  getMessages(projectId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Knowledge Entries
  getKnowledgeEntries(category?: string): Promise<KnowledgeEntry[]>;
  createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry>;
  searchKnowledgeEntries(query: string, category?: string): Promise<KnowledgeEntry[]>;

  // API Health
  getApiHealth(): Promise<ApiHealthLog[]>;
  updateApiHealth(log: InsertApiHealthLog): Promise<ApiHealthLog>;

  // API Usage
  logApiUsage(usage: InsertApiUsageLog): Promise<ApiUsageLog>;
  getProjectApiUsage(projectId: string): Promise<ApiUsageLog[]>;
  getProjectApiUsageStats(projectId: string): Promise<ProjectApiUsageStats[]>;

  // Diagnostic Reports
  getDiagnosticReport(id: string): Promise<DiagnosticReport | undefined>;
  getDiagnosticReports(): Promise<DiagnosticReport[]>;
  createDiagnosticReport(report: InsertDiagnosticReport): Promise<DiagnosticReport>;
  updateDiagnosticReport(
    id: string,
    updates: Partial<InsertDiagnosticReport>,
  ): Promise<DiagnosticReport | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjects(): Promise<ProjectSummary[]> {
    const result = await db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        updatedAt: projects.updatedAt,
        clientName: projects.clientName,
        currentStage: projects.currentStage,
        rawInput: projects.rawInput,
      })
      .from(projects)
      .orderBy(desc(projects.updatedAt));
    return result;
  }

  async getRecentProjects(limit: number = 5): Promise<ProjectSummary[]> {
    const result = await db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        updatedAt: projects.updatedAt,
        clientName: projects.clientName,
        currentStage: projects.currentStage,
        rawInput: projects.rawInput,
      })
      .from(projects)
      .orderBy(desc(projects.updatedAt))
      .limit(limit);
    return result;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db
      .insert(projects)
      .values(project as any)
      .returning();
    return created;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectDashboard(id: string): Promise<any> {
    const [project, messagesData, stats] = await Promise.all([
      this.getProject(id),
      this.getMessages(id),
      this.getProjectApiUsageStats(id),
    ]);

    if (!project) return null;

    return {
      project,
      messages: messagesData,
      usage: stats,
    };
  }

  // Messages
  async getMessages(projectId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db
      .insert(messages)
      .values(message as any)
      .returning();
    return created;
  }

  // Knowledge Entries
  async getKnowledgeEntries(category?: string): Promise<KnowledgeEntry[]> {
    if (category) {
      return await db
        .select()
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.category, category))
        .orderBy(desc(knowledgeEntries.createdAt));
    }
    return await db.select().from(knowledgeEntries).orderBy(desc(knowledgeEntries.createdAt));
  }

  async createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry> {
    const [created] = await db.insert(knowledgeEntries).values(entry).returning();
    return created;
  }

  async searchKnowledgeEntries(query: string, category?: string): Promise<KnowledgeEntry[]> {
    const searchPattern = `%${query.toLowerCase()}%`;

    if (category) {
      return await db
        .select()
        .from(knowledgeEntries)
        .where(
          sql`LOWER(${knowledgeEntries.content}) LIKE ${searchPattern} AND ${knowledgeEntries.category} = ${category}`,
        )
        .orderBy(desc(knowledgeEntries.createdAt));
    }

    return await db
      .select()
      .from(knowledgeEntries)
      .where(sql`LOWER(${knowledgeEntries.content}) LIKE ${searchPattern}`)
      .orderBy(desc(knowledgeEntries.createdAt));
  }

  // API Health
  async getApiHealth(): Promise<ApiHealthLog[]> {
    const services = [
      "gemini",
      "claude",
      "openai",
      "perplexity",
      "pdf_co",
      "resend",
      "gamma",
      "nano_banana",
    ];

    // Optimized: Fetch all latest health logs in one query using PostgreSQL DISTINCT ON
    const logs = await db
      .select()
      .from(apiHealthLogs)
      .orderBy(
        sql`DISTINCT ON (${apiHealthLogs.service}) ${apiHealthLogs.service}`,
        desc(apiHealthLogs.lastChecked),
      );

    const logMap = new Map(logs.map((l) => [l.service, l]));
    const results: ApiHealthLog[] = [];
    const missingServices: string[] = [];

    for (const service of services) {
      const log = logMap.get(service);
      if (log) {
        results.push(log);
      } else {
        missingServices.push(service);
      }
    }

    // Handle missing services by inserting them in bulk if any
    if (missingServices.length > 0) {
      const newLogs = await db
        .insert(apiHealthLogs)
        .values(
          missingServices.map((service) => ({
            service,
            status: "unknown",
            requestCount: 0,
          })),
        )
        .returning();
      results.push(...newLogs);
    }

    return results;
  }

  async updateApiHealth(log: InsertApiHealthLog): Promise<ApiHealthLog> {
    // Try to update existing
    const [existing] = await db
      .select()
      .from(apiHealthLogs)
      .where(eq(apiHealthLogs.service, log.service));

    if (existing) {
      const [updated] = await db
        .update(apiHealthLogs)
        .set({
          status: log.status,
          latencyMs: log.latencyMs,
          errorMessage: log.errorMessage,
          requestCount: (existing.requestCount || 0) + 1,
          lastChecked: new Date(),
        })
        .where(eq(apiHealthLogs.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(apiHealthLogs).values(log).returning();
    return created;
  }

  // API Usage
  async logApiUsage(usage: InsertApiUsageLog): Promise<ApiUsageLog> {
    const [created] = await db.insert(apiUsageLogs).values(usage).returning();
    return created;
  }

  async getProjectApiUsage(projectId: string): Promise<ApiUsageLog[]> {
    return await db
      .select()
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.projectId, projectId))
      .orderBy(desc(apiUsageLogs.createdAt));
  }

  async getProjectApiUsageStats(projectId: string): Promise<ProjectApiUsageStats[]> {
    // Optimized: SQL-level aggregation instead of in-memory JS processing
    const stats = await db
      .select({
        provider: apiUsageLogs.provider,
        totalInputTokens: sum(apiUsageLogs.inputTokens),
        totalOutputTokens: sum(apiUsageLogs.outputTokens),
        totalTokens: sum(apiUsageLogs.totalTokens),
        totalCostUsd: sum(sql`CAST(${apiUsageLogs.costUsd} AS DECIMAL)`),
        callCount: count(apiUsageLogs.id),
        model: sql`MAX(${apiUsageLogs.model})`,
      })
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.projectId, projectId))
      .groupBy(apiUsageLogs.provider);

    const providerDisplayNames: Record<string, string> = {
      gemini: "Google Gemini",
      claude: "Anthropic Claude",
      openai: "OpenAI",
      perplexity: "Perplexity",
    };

    return stats.map((s) => ({
      provider: s.provider as string,
      displayName: providerDisplayNames[s.provider as string] || (s.provider as string),
      model: (s.model as string) || "Default",
      totalInputTokens: Number(s.totalInputTokens) || 0,
      totalOutputTokens: Number(s.totalOutputTokens) || 0,
      totalTokens: Number(s.totalTokens) || 0,
      totalCostUsd: Number(s.totalCostUsd) || 0,
      callCount: Number(s.callCount) || 0,
    }));
  }

  // Diagnostic Reports
  async getDiagnosticReport(id: string): Promise<DiagnosticReport | undefined> {
    const [report] = await db.select().from(diagnosticReports).where(eq(diagnosticReports.id, id));
    return report || undefined;
  }

  async getDiagnosticReports(): Promise<DiagnosticReport[]> {
    return await db.select().from(diagnosticReports).orderBy(desc(diagnosticReports.createdAt));
  }

  async createDiagnosticReport(report: InsertDiagnosticReport): Promise<DiagnosticReport> {
    const [created] = await db
      .insert(diagnosticReports)
      .values(report as any)
      .returning();
    return created;
  }

  async updateDiagnosticReport(
    id: string,
    updates: Partial<InsertDiagnosticReport>,
  ): Promise<DiagnosticReport | undefined> {
    const [updated] = await db
      .update(diagnosticReports)
      .set(updates as any)
      .where(eq(diagnosticReports.id, id))
      .returning();
    return updated || undefined;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }
}

export const storage = new DatabaseStorage();
