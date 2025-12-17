import {
  projects,
  messages,
  knowledgeEntries,
  apiHealthLogs,
  type Project,
  type InsertProject,
  type Message,
  type InsertMessage,
  type KnowledgeEntry,
  type InsertKnowledgeEntry,
  type ApiHealthLog,
  type InsertApiHealthLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getRecentProjects(limit?: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

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
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async getRecentProjects(limit: number = 5): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt))
      .limit(limit);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
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
    const [created] = await db.insert(messages).values(message).returning();
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
          sql`LOWER(${knowledgeEntries.content}) LIKE ${searchPattern} AND ${knowledgeEntries.category} = ${category}`
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
    const services = ['gemini', 'claude', 'openai', 'pdf_co', 'resend', 'gamma', 'nano_banana'];
    const results: ApiHealthLog[] = [];
    
    for (const service of services) {
      const [log] = await db
        .select()
        .from(apiHealthLogs)
        .where(eq(apiHealthLogs.service, service))
        .orderBy(desc(apiHealthLogs.lastChecked))
        .limit(1);
      
      if (log) {
        results.push(log);
      } else {
        // Create default health entry
        const [created] = await db
          .insert(apiHealthLogs)
          .values({
            service,
            status: 'unknown',
            requestCount: 0,
          })
          .returning();
        results.push(created);
      }
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
}

export const storage = new DatabaseStorage();
