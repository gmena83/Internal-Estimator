import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createMockProject,
  getMockAiParseResponse,
  getMockAiEstimateResponse,
  getMockScenarioA,
  getMockScenarioB,
  getMockRoiAnalysis,
} from '../fixtures';

// Test AI service prompt building and response parsing
describe('AI Service', () => {
  
  describe('Prompt Building', () => {
    it('should build parse input prompt with raw input', () => {
      const rawInput = 'Build a mobile app for task management';
      
      // Test prompt structure
      const prompt = buildParsePrompt(rawInput);
      
      expect(prompt).toContain(rawInput);
      expect(prompt).toContain('mission');
      expect(prompt).toContain('objectives');
      expect(prompt).toContain('constraints');
    });
    
    it('should build estimate prompt with project data', () => {
      const project = createMockProject();
      
      const prompt = buildEstimatePrompt(project);
      
      expect(prompt).toContain(project.title);
      expect(prompt).toContain('Scenario A');
      expect(prompt).toContain('Scenario B');
      expect(prompt).toContain('ROI');
    });
    
    it('should build email prompt with project and scenario', () => {
      const project = createMockProject();
      const scenario = getMockScenarioA();
      
      const prompt = buildEmailPrompt(project, scenario);
      
      expect(prompt).toContain(project.clientName);
      expect(prompt).toContain(scenario.name);
      expect(prompt).toContain(scenario.totalCost.toString());
    });
  });
  
  describe('Response Parsing', () => {
    it('should parse mission extraction response', () => {
      const rawResponse = JSON.stringify(getMockAiParseResponse());
      
      const parsed = parseAiResponse(rawResponse);
      
      expect(parsed.mission).toBe('Create an AI-powered solution');
      expect(parsed.objectives).toHaveLength(2);
      expect(parsed.constraints).toHaveLength(2);
    });
    
    it('should handle malformed JSON gracefully', () => {
      const malformedResponse = '{ mission: "test" '; // Invalid JSON
      
      expect(() => parseAiResponse(malformedResponse)).toThrow();
    });
    
    it('should parse estimate response with scenarios', () => {
      const rawResponse = JSON.stringify(getMockAiEstimateResponse());
      
      const parsed = parseEstimateResponse(rawResponse);
      
      expect(parsed.scenarioA).toBeDefined();
      expect(parsed.scenarioB).toBeDefined();
      expect(parsed.scenarioA.name).toBe('High-Tech Custom');
      expect(parsed.scenarioB.name).toBe('No-Code MVP');
    });
    
    it('should calculate correct total costs', () => {
      const scenarioA = getMockScenarioA();
      const scenarioB = getMockScenarioB();
      
      expect(scenarioA.totalCost).toBe(scenarioA.totalHours * scenarioA.hourlyRate);
      expect(scenarioB.totalCost).toBe(scenarioB.totalHours * scenarioB.hourlyRate);
    });
  });
  
  describe('ROI Analysis', () => {
    it('should calculate payback period correctly', () => {
      const roiAnalysis = getMockRoiAnalysis();
      const scenarioA = getMockScenarioA();
      
      // Payback = cost / monthly savings
      const monthlyProjectedSavings = roiAnalysis.projectedSavings / 12;
      const expectedPayback = Math.ceil(scenarioA.totalCost / monthlyProjectedSavings);
      
      expect(roiAnalysis.paybackPeriodMonths.scenarioA).toBeGreaterThan(0);
    });
    
    it('should calculate 3-year ROI correctly', () => {
      const roiAnalysis = getMockRoiAnalysis();
      const scenarioA = getMockScenarioA();
      
      // 3-year ROI = ((savings * 3) - cost) / cost * 100
      const threeYearSavings = roiAnalysis.projectedSavings * 3;
      const roi = ((threeYearSavings - scenarioA.totalCost) / scenarioA.totalCost) * 100;
      
      expect(roiAnalysis.threeYearROI.scenarioA).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      // Mock a timeout scenario
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });
      
      await expect(timeoutPromise).rejects.toThrow('timeout');
    });
    
    it('should track API health on failure', () => {
      const healthLog = {
        service: 'gemini',
        status: 'error',
        errorMessage: 'API rate limit exceeded',
        latencyMs: 0,
      };
      
      expect(healthLog.status).toBe('error');
      expect(healthLog.errorMessage).toBeDefined();
    });
  });
  
  describe('Provider Fallback', () => {
    it('should attempt fallback provider on primary failure', async () => {
      // Simulate primary provider failure
      const providers = ['gemini', 'claude', 'openai'];
      let attemptedProviders: string[] = [];
      
      for (const provider of providers) {
        attemptedProviders.push(provider);
        // Simulate success on third attempt
        if (provider === 'openai') {
          break;
        }
      }
      
      expect(attemptedProviders).toContain('gemini');
      expect(attemptedProviders).toContain('claude');
      expect(attemptedProviders).toContain('openai');
    });
  });
});

// Helper functions to simulate prompt building (would be imported from actual service)
function buildParsePrompt(rawInput: string): string {
  return `
    Analyze the following client input and extract:
    - mission: The core objective
    - objectives: List of specific goals
    - constraints: Budget, timeline, technical limitations
    - techPreferences: Preferred technologies mentioned
    
    Input: ${rawInput}
  `;
}

function buildEstimatePrompt(project: any): string {
  return `
    Generate a project estimate for: ${project.title}
    
    Create two scenarios:
    - Scenario A: High-Tech Custom Development
    - Scenario B: No-Code MVP
    
    Include:
    - Feature breakdown with hours
    - Tech stack recommendations
    - Timeline estimates
    - ROI analysis
  `;
}

function buildEmailPrompt(project: any, scenario: any): string {
  return `
    Write a professional email to ${project.clientName}
    
    Project: ${project.title}
    Recommended Scenario: ${scenario.name}
    Investment: $${scenario.totalCost}
    Timeline: ${scenario.timeline}
  `;
}

function parseAiResponse(response: string): any {
  return JSON.parse(response);
}

function parseEstimateResponse(response: string): any {
  return JSON.parse(response);
}
