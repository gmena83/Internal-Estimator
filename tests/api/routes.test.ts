import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { 
  createMockProject, 
  createMockProjectWithEstimate, 
  createMockMessage,
  getMockAiParseResponse,
  getMockAiEstimateResponse,
} from '../fixtures';

// Mock the storage module
vi.mock('../../server/storage', () => ({
  storage: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getMessages: vi.fn(),
    createMessage: vi.fn(),
    createKnowledgeEntry: vi.fn(),
    getApiHealthStatus: vi.fn(),
    logApiHealth: vi.fn(),
    getProjectUsageStats: vi.fn(),
  },
}));

// Mock the AI service
vi.mock('../../server/ai-service', () => ({
  parseClientInput: vi.fn(),
  generateEstimate: vi.fn(),
  generateEmailContent: vi.fn(),
  generatePresentationContent: vi.fn(),
  generateVibecodeGuide: vi.fn(),
  generatePmBreakdown: vi.fn(),
  performMarketResearch: vi.fn(),
}));

// Mock PDF generator
vi.mock('../../server/pdf-generator', () => ({
  generateProposalPdf: vi.fn(),
  generateInternalReportPdf: vi.fn(),
}));

import { storage } from '../../server/storage';
import * as aiService from '../../server/ai-service';
import * as pdfGenerator from '../../server/pdf-generator';

// Create a minimal test app
const createTestApp = async () => {
  const app = express();
  app.use(express.json());
  
  // Import and apply routes - simplified version for testing
  // In reality, you'd import the actual routes
  
  // Projects endpoints
  app.get('/api/projects', async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });
  
  app.get('/api/projects/:id', async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  });
  
  app.post('/api/projects', async (req, res) => {
    const project = await storage.createProject(req.body);
    res.status(201).json(project);
  });
  
  app.patch('/api/projects/:id', async (req, res) => {
    const project = await storage.updateProject(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  });
  
  app.delete('/api/projects/:id', async (req, res) => {
    const deleted = await storage.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  });
  
  // Messages endpoint
  app.get('/api/projects/:id/messages', async (req, res) => {
    const messages = await storage.getMessages(req.params.id);
    res.json(messages);
  });
  
  app.post('/api/projects/:id/messages', async (req, res) => {
    const message = await storage.createMessage({
      projectId: req.params.id,
      ...req.body,
    });
    res.status(201).json(message);
  });
  
  // Parse input endpoint
  app.post('/api/projects/:id/parse', async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const parsedData = await aiService.parseClientInput(project.rawInput);
    const updated = await storage.updateProject(req.params.id, { parsedData });
    res.json(updated);
  });
  
  // Generate estimate endpoint
  app.post('/api/projects/:id/generate-estimate', async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const estimate = await aiService.generateEstimate(project);
    const updated = await storage.updateProject(req.params.id, {
      estimateMarkdown: estimate.estimateMarkdown,
      scenarioA: estimate.scenarioA,
      scenarioB: estimate.scenarioB,
      roiAnalysis: estimate.roiAnalysis,
    });
    res.json(updated);
  });
  
  // Approve estimate endpoint
  app.post('/api/projects/:id/approve-estimate', async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const proposalPdfUrl = `/api/projects/${req.params.id}/proposal.pdf`;
    const updated = await storage.updateProject(req.params.id, {
      currentStage: 2,
      status: 'estimate_generated',
      proposalPdfUrl,
    });
    
    res.json({ ...updated, proposalPdfUrl });
  });
  
  // Reset project endpoint
  app.post('/api/projects/:id/reset', async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const updated = await storage.updateProject(req.params.id, {
      currentStage: 1,
      status: 'in_progress',
      estimateMarkdown: null,
      scenarioA: null,
      scenarioB: null,
      roiAnalysis: null,
      proposalPdfUrl: null,
      internalReportPdfUrl: null,
    });
    
    res.json(updated);
  });
  
  // PDF download endpoint
  app.get('/api/projects/:id/proposal.pdf', async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const pdfBuffer = await pdfGenerator.generateProposalPdf(project);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposal.pdf"`);
    res.send(pdfBuffer);
  });
  
  // Health endpoint
  app.get('/api/health', async (req, res) => {
    const status = await storage.getApiHealthStatus();
    res.json(status);
  });
  
  return app;
};

describe('API Routes', () => {
  let app: express.Express;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createTestApp();
  });
  
  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const mockProjects = [createMockProject(), createMockProject()];
      vi.mocked(storage.getProjects).mockResolvedValue(mockProjects);
      
      const res = await request(app).get('/api/projects');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(storage.getProjects).toHaveBeenCalledOnce();
    });
    
    it('should return empty array when no projects exist', async () => {
      vi.mocked(storage.getProjects).mockResolvedValue([]);
      
      const res = await request(app).get('/api/projects');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
  
  describe('GET /api/projects/:id', () => {
    it('should return a project by id', async () => {
      const mockProject = createMockProject({ id: 'test-123' });
      vi.mocked(storage.getProject).mockResolvedValue(mockProject);
      
      const res = await request(app).get('/api/projects/test-123');
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('test-123');
      expect(storage.getProject).toHaveBeenCalledWith('test-123');
    });
    
    it('should return 404 for non-existent project', async () => {
      vi.mocked(storage.getProject).mockResolvedValue(null);
      
      const res = await request(app).get('/api/projects/non-existent');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });
  });
  
  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const newProject = { title: 'New Project', rawInput: 'Build an app' };
      const createdProject = createMockProject(newProject);
      vi.mocked(storage.createProject).mockResolvedValue(createdProject);
      
      const res = await request(app)
        .post('/api/projects')
        .send(newProject);
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Project');
      expect(storage.createProject).toHaveBeenCalledWith(newProject);
    });
  });
  
  describe('PATCH /api/projects/:id', () => {
    it('should update an existing project', async () => {
      const updatedProject = createMockProject({ id: 'test-123', title: 'Updated Title' });
      vi.mocked(storage.updateProject).mockResolvedValue(updatedProject);
      
      const res = await request(app)
        .patch('/api/projects/test-123')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });
    
    it('should return 404 when updating non-existent project', async () => {
      vi.mocked(storage.updateProject).mockResolvedValue(null);
      
      const res = await request(app)
        .patch('/api/projects/non-existent')
        .send({ title: 'Updated' });
      
      expect(res.status).toBe(404);
    });
  });
  
  describe('DELETE /api/projects/:id', () => {
    it('should delete an existing project', async () => {
      vi.mocked(storage.deleteProject).mockResolvedValue(true);
      
      const res = await request(app).delete('/api/projects/test-123');
      
      expect(res.status).toBe(204);
      expect(storage.deleteProject).toHaveBeenCalledWith('test-123');
    });
    
    it('should return 404 when deleting non-existent project', async () => {
      vi.mocked(storage.deleteProject).mockResolvedValue(false);
      
      const res = await request(app).delete('/api/projects/non-existent');
      
      expect(res.status).toBe(404);
    });
  });
  
  describe('GET /api/projects/:id/messages', () => {
    it('should return messages for a project', async () => {
      const mockMessages = [
        createMockMessage({ content: 'Message 1' }),
        createMockMessage({ content: 'Message 2' }),
      ];
      vi.mocked(storage.getMessages).mockResolvedValue(mockMessages);
      
      const res = await request(app).get('/api/projects/test-123/messages');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });
  
  describe('POST /api/projects/:id/messages', () => {
    it('should create a new message', async () => {
      const newMessage = createMockMessage({ content: 'New message' });
      vi.mocked(storage.createMessage).mockResolvedValue(newMessage);
      
      const res = await request(app)
        .post('/api/projects/test-123/messages')
        .send({ role: 'user', content: 'New message' });
      
      expect(res.status).toBe(201);
      expect(res.body.content).toBe('New message');
    });
  });
  
  describe('POST /api/projects/:id/parse', () => {
    it('should parse client input and update project', async () => {
      const mockProject = createMockProject();
      const parsedData = getMockAiParseResponse();
      const updatedProject = createMockProject({ parsedData });
      
      vi.mocked(storage.getProject).mockResolvedValue(mockProject);
      vi.mocked(aiService.parseClientInput).mockResolvedValue(parsedData);
      vi.mocked(storage.updateProject).mockResolvedValue(updatedProject);
      
      const res = await request(app).post('/api/projects/test-123/parse');
      
      expect(res.status).toBe(200);
      expect(res.body.parsedData).toBeDefined();
      expect(aiService.parseClientInput).toHaveBeenCalledWith(mockProject.rawInput);
    });
    
    it('should return 404 for non-existent project', async () => {
      vi.mocked(storage.getProject).mockResolvedValue(null);
      
      const res = await request(app).post('/api/projects/non-existent/parse');
      
      expect(res.status).toBe(404);
    });
  });
  
  describe('POST /api/projects/:id/generate-estimate', () => {
    it('should generate estimate and update project', async () => {
      const mockProject = createMockProject();
      const estimateResponse = getMockAiEstimateResponse();
      const updatedProject = createMockProjectWithEstimate();
      
      vi.mocked(storage.getProject).mockResolvedValue(mockProject);
      vi.mocked(aiService.generateEstimate).mockResolvedValue(estimateResponse);
      vi.mocked(storage.updateProject).mockResolvedValue(updatedProject);
      
      const res = await request(app).post('/api/projects/test-123/generate-estimate');
      
      expect(res.status).toBe(200);
      expect(res.body.estimateMarkdown).toBeDefined();
      expect(res.body.scenarioA).toBeDefined();
      expect(res.body.scenarioB).toBeDefined();
    });
  });
  
  describe('POST /api/projects/:id/approve-estimate', () => {
    it('should approve estimate and advance stage', async () => {
      const mockProject = createMockProjectWithEstimate();
      const updatedProject = { ...mockProject, currentStage: 2, status: 'estimate_generated' };
      
      vi.mocked(storage.getProject).mockResolvedValue(mockProject);
      vi.mocked(storage.updateProject).mockResolvedValue(updatedProject);
      
      const res = await request(app).post('/api/projects/test-123/approve-estimate');
      
      expect(res.status).toBe(200);
      expect(res.body.proposalPdfUrl).toBe('/api/projects/test-123/proposal.pdf');
      expect(res.body.currentStage).toBe(2);
    });
  });
  
  describe('POST /api/projects/:id/reset', () => {
    it('should reset project to initial state', async () => {
      const mockProject = createMockProjectWithEstimate();
      const resetProject = createMockProject({ 
        id: mockProject.id, 
        currentStage: 1, 
        status: 'in_progress' 
      });
      
      vi.mocked(storage.getProject).mockResolvedValue(mockProject);
      vi.mocked(storage.updateProject).mockResolvedValue(resetProject);
      
      const res = await request(app).post('/api/projects/test-123/reset');
      
      expect(res.status).toBe(200);
      expect(res.body.currentStage).toBe(1);
      expect(res.body.estimateMarkdown).toBeNull();
    });
    
    it('should return 404 for non-existent project', async () => {
      vi.mocked(storage.getProject).mockResolvedValue(null);
      
      const res = await request(app).post('/api/projects/non-existent/reset');
      
      expect(res.status).toBe(404);
    });
  });
  
  describe('GET /api/projects/:id/proposal.pdf', () => {
    it('should generate and return PDF', async () => {
      const mockProject = createMockProjectWithEstimate();
      const mockPdfBuffer = Buffer.from('PDF content');
      
      vi.mocked(storage.getProject).mockResolvedValue(mockProject);
      vi.mocked(pdfGenerator.generateProposalPdf).mockResolvedValue(mockPdfBuffer);
      
      const res = await request(app).get('/api/projects/test-123/proposal.pdf');
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
    });
    
    it('should return 404 for non-existent project', async () => {
      vi.mocked(storage.getProject).mockResolvedValue(null);
      
      const res = await request(app).get('/api/projects/non-existent/proposal.pdf');
      
      expect(res.status).toBe(404);
    });
  });
  
  describe('GET /api/health', () => {
    it('should return API health status', async () => {
      const mockHealthStatus = [
        { service: 'gemini', status: 'online', latencyMs: 150 },
        { service: 'openai', status: 'online', latencyMs: 100 },
      ];
      vi.mocked(storage.getApiHealthStatus).mockResolvedValue(mockHealthStatus);
      
      const res = await request(app).get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].service).toBe('gemini');
    });
  });
});
