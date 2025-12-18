import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockProject,
  createMockProjectWithEstimate,
  createMockMessage,
  createMockKnowledgeEntry,
  createMockApiHealthLog,
} from '../fixtures';

// Mock storage implementation for testing
class MockStorage {
  private projects: Map<string, any> = new Map();
  private messages: Map<string, any[]> = new Map();
  private knowledgeEntries: any[] = [];
  private apiHealthLogs: any[] = [];
  
  async createProject(data: any): Promise<any> {
    const id = 'proj-' + Math.random().toString(36).substr(2, 9);
    const project = {
      id,
      ...data,
      status: data.status || 'in_progress',
      currentStage: data.currentStage || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }
  
  async getProject(id: string): Promise<any | null> {
    return this.projects.get(id) || null;
  }
  
  async getProjects(): Promise<any[]> {
    return Array.from(this.projects.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async updateProject(id: string, data: any): Promise<any | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    
    const updated = {
      ...project,
      ...data,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return updated;
  }
  
  async deleteProject(id: string): Promise<boolean> {
    if (!this.projects.has(id)) return false;
    this.projects.delete(id);
    this.messages.delete(id);
    return true;
  }
  
  async createMessage(data: any): Promise<any> {
    const id = 'msg-' + Math.random().toString(36).substr(2, 9);
    const message = {
      id,
      ...data,
      timestamp: new Date(),
    };
    
    const projectMessages = this.messages.get(data.projectId) || [];
    projectMessages.push(message);
    this.messages.set(data.projectId, projectMessages);
    
    return message;
  }
  
  async getMessages(projectId: string): Promise<any[]> {
    return this.messages.get(projectId) || [];
  }
  
  async createKnowledgeEntry(data: any): Promise<any> {
    const id = 'know-' + Math.random().toString(36).substr(2, 9);
    const entry = {
      id,
      ...data,
      createdAt: new Date(),
    };
    this.knowledgeEntries.push(entry);
    return entry;
  }
  
  async searchKnowledge(query: string, projectId?: string): Promise<any[]> {
    return this.knowledgeEntries.filter(entry => {
      const matchesQuery = entry.content.toLowerCase().includes(query.toLowerCase());
      const matchesProject = !projectId || entry.projectId === projectId;
      return matchesQuery && matchesProject;
    });
  }
  
  async logApiHealth(data: any): Promise<any> {
    const id = 'health-' + Math.random().toString(36).substr(2, 9);
    const log = {
      id,
      ...data,
      timestamp: new Date(),
    };
    this.apiHealthLogs.push(log);
    return log;
  }
  
  async getApiHealthStatus(): Promise<any[]> {
    const latestByService = new Map<string, any>();
    
    for (const log of this.apiHealthLogs) {
      const existing = latestByService.get(log.service);
      if (!existing || log.timestamp > existing.timestamp) {
        latestByService.set(log.service, log);
      }
    }
    
    return Array.from(latestByService.values());
  }
  
  clear() {
    this.projects.clear();
    this.messages.clear();
    this.knowledgeEntries = [];
    this.apiHealthLogs = [];
  }
}

describe('Storage Operations', () => {
  let storage: MockStorage;
  
  beforeEach(() => {
    storage = new MockStorage();
  });
  
  describe('Project CRUD', () => {
    it('should create a new project', async () => {
      const projectData = {
        title: 'Test Project',
        clientName: 'Test Client',
        rawInput: 'Build an app',
      };
      
      const project = await storage.createProject(projectData);
      
      expect(project.id).toBeDefined();
      expect(project.title).toBe('Test Project');
      expect(project.status).toBe('in_progress');
      expect(project.currentStage).toBe(1);
      expect(project.createdAt).toBeInstanceOf(Date);
    });
    
    it('should retrieve a project by id', async () => {
      const created = await storage.createProject({ title: 'Test' });
      
      const retrieved = await storage.getProject(created.id);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
    });
    
    it('should return null for non-existent project', async () => {
      const project = await storage.getProject('non-existent-id');
      
      expect(project).toBeNull();
    });
    
    it('should list all projects sorted by updatedAt', async () => {
      await storage.createProject({ title: 'Project 1' });
      await new Promise(r => setTimeout(r, 10)); // Small delay
      await storage.createProject({ title: 'Project 2' });
      
      const projects = await storage.getProjects();
      
      expect(projects).toHaveLength(2);
      expect(projects[0].title).toBe('Project 2'); // Most recent first
    });
    
    it('should update a project', async () => {
      const created = await storage.createProject({ title: 'Original' });
      
      const updated = await storage.updateProject(created.id, { title: 'Updated' });
      
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).not.toEqual(created.updatedAt);
    });
    
    it('should return null when updating non-existent project', async () => {
      const updated = await storage.updateProject('non-existent', { title: 'Test' });
      
      expect(updated).toBeNull();
    });
    
    it('should delete a project', async () => {
      const created = await storage.createProject({ title: 'To Delete' });
      
      const deleted = await storage.deleteProject(created.id);
      const retrieved = await storage.getProject(created.id);
      
      expect(deleted).toBe(true);
      expect(retrieved).toBeNull();
    });
    
    it('should return false when deleting non-existent project', async () => {
      const deleted = await storage.deleteProject('non-existent');
      
      expect(deleted).toBe(false);
    });
    
    it('should cascade delete messages when project is deleted', async () => {
      const project = await storage.createProject({ title: 'Test' });
      await storage.createMessage({ projectId: project.id, content: 'Test message' });
      
      await storage.deleteProject(project.id);
      const messages = await storage.getMessages(project.id);
      
      expect(messages).toHaveLength(0);
    });
  });
  
  describe('Message Operations', () => {
    it('should create a message for a project', async () => {
      const project = await storage.createProject({ title: 'Test' });
      
      const message = await storage.createMessage({
        projectId: project.id,
        role: 'user',
        content: 'Hello',
      });
      
      expect(message.id).toBeDefined();
      expect(message.content).toBe('Hello');
      expect(message.projectId).toBe(project.id);
    });
    
    it('should retrieve messages for a project', async () => {
      const project = await storage.createProject({ title: 'Test' });
      await storage.createMessage({ projectId: project.id, content: 'Message 1' });
      await storage.createMessage({ projectId: project.id, content: 'Message 2' });
      
      const messages = await storage.getMessages(project.id);
      
      expect(messages).toHaveLength(2);
    });
    
    it('should return empty array for project with no messages', async () => {
      const project = await storage.createProject({ title: 'Test' });
      
      const messages = await storage.getMessages(project.id);
      
      expect(messages).toEqual([]);
    });
  });
  
  describe('Knowledge Base Operations', () => {
    it('should create a knowledge entry', async () => {
      const entry = await storage.createKnowledgeEntry({
        projectId: 'test-project',
        category: 'estimate',
        content: 'Test knowledge content',
      });
      
      expect(entry.id).toBeDefined();
      expect(entry.category).toBe('estimate');
    });
    
    it('should search knowledge by content', async () => {
      await storage.createKnowledgeEntry({
        projectId: 'proj-1',
        content: 'React development best practices',
      });
      await storage.createKnowledgeEntry({
        projectId: 'proj-2',
        content: 'Node.js backend architecture',
      });
      
      const results = await storage.searchKnowledge('React');
      
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('React');
    });
    
    it('should filter knowledge by project', async () => {
      await storage.createKnowledgeEntry({
        projectId: 'proj-1',
        content: 'Project 1 content',
      });
      await storage.createKnowledgeEntry({
        projectId: 'proj-2',
        content: 'Project 2 content',
      });
      
      const results = await storage.searchKnowledge('content', 'proj-1');
      
      expect(results).toHaveLength(1);
      expect(results[0].projectId).toBe('proj-1');
    });
  });
  
  describe('API Health Logging', () => {
    it('should log API health status', async () => {
      const log = await storage.logApiHealth({
        projectId: 'test-project',
        service: 'gemini',
        status: 'online',
        latencyMs: 150,
      });
      
      expect(log.id).toBeDefined();
      expect(log.service).toBe('gemini');
      expect(log.status).toBe('online');
    });
    
    it('should get latest health status per service', async () => {
      await storage.logApiHealth({ service: 'gemini', status: 'online', latencyMs: 100 });
      await storage.logApiHealth({ service: 'openai', status: 'online', latencyMs: 50 });
      await storage.logApiHealth({ service: 'gemini', status: 'error', latencyMs: 0 });
      
      const status = await storage.getApiHealthStatus();
      
      expect(status).toHaveLength(2);
      const geminiStatus = status.find(s => s.service === 'gemini');
      expect(geminiStatus?.status).toBe('error'); // Latest status
    });
    
    it('should track request counts', async () => {
      await storage.logApiHealth({ service: 'gemini', requestCount: 1 });
      await storage.logApiHealth({ service: 'gemini', requestCount: 2 });
      
      const status = await storage.getApiHealthStatus();
      const geminiStatus = status.find(s => s.service === 'gemini');
      
      expect(geminiStatus?.requestCount).toBe(2);
    });
  });
  
  describe('Data Integrity', () => {
    it('should maintain consistent project state', async () => {
      const project = await storage.createProject({
        title: 'Test',
        status: 'in_progress',
        currentStage: 1,
      });
      
      // Simulate stage progression
      await storage.updateProject(project.id, { currentStage: 2, status: 'estimate_generated' });
      await storage.updateProject(project.id, { currentStage: 3, status: 'assets_ready' });
      
      const final = await storage.getProject(project.id);
      
      expect(final?.currentStage).toBe(3);
      expect(final?.status).toBe('assets_ready');
    });
    
    it('should preserve all fields during partial update', async () => {
      const project = await storage.createProject({
        title: 'Test',
        clientName: 'Client',
        rawInput: 'Build something',
      });
      
      await storage.updateProject(project.id, { title: 'Updated Title' });
      
      const updated = await storage.getProject(project.id);
      
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.clientName).toBe('Client');
      expect(updated?.rawInput).toBe('Build something');
    });
  });
});
