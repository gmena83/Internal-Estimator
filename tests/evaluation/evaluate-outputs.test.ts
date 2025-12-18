import { describe, it, expect } from 'vitest';
import {
  allSampleOutputs,
  validateEstimate,
  validatePmBreakdown,
  validateEmail,
  sampleEstimateMarkdown,
  samplePmBreakdown,
  sampleEmailContent,
} from '../outputs/sample-outputs';
import {
  createMockProject,
  createMockProjectWithEstimate,
  createMockProjectComplete,
  getMockScenarioA,
  getMockScenarioB,
  getMockRoiAnalysis,
} from '../fixtures';

describe('Output Evaluation Tests', () => {
  describe('Estimate Output Validation', () => {
    it('should validate a complete estimate object', () => {
      const estimate = {
        estimateMarkdown: sampleEstimateMarkdown,
        scenarioA: getMockScenarioA(),
        scenarioB: getMockScenarioB(),
        roiAnalysis: getMockRoiAnalysis(),
      };
      
      const result = validateEstimate(estimate);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect missing estimate markdown', () => {
      const estimate = {
        scenarioA: getMockScenarioA(),
        scenarioB: getMockScenarioB(),
        roiAnalysis: getMockRoiAnalysis(),
      };
      
      const result = validateEstimate(estimate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing estimate markdown');
    });
    
    it('should detect missing scenarios', () => {
      const estimate = {
        estimateMarkdown: 'Test',
        roiAnalysis: getMockRoiAnalysis(),
      };
      
      const result = validateEstimate(estimate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing Scenario A');
      expect(result.errors).toContain('Missing Scenario B');
    });
    
    it('should detect missing ROI analysis', () => {
      const estimate = {
        estimateMarkdown: 'Test',
        scenarioA: getMockScenarioA(),
        scenarioB: getMockScenarioB(),
      };
      
      const result = validateEstimate(estimate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing ROI analysis');
    });
    
    it('should detect missing total cost in scenarios', () => {
      const estimate = {
        estimateMarkdown: 'Test',
        scenarioA: { ...getMockScenarioA(), totalCost: undefined },
        scenarioB: getMockScenarioB(),
        roiAnalysis: getMockRoiAnalysis(),
      };
      
      const result = validateEstimate(estimate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Scenario A missing total cost');
    });
  });
  
  describe('PM Breakdown Validation', () => {
    it('should validate a complete PM breakdown', () => {
      const result = validatePmBreakdown(samplePmBreakdown);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect missing phases array', () => {
      const breakdown = {};
      
      const result = validatePmBreakdown(breakdown);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid phases array');
    });
    
    it('should detect phases without names', () => {
      const breakdown = {
        phases: [
          { tasks: [{ name: 'Task 1' }], deliverables: ['D1'] },
        ],
      };
      
      const result = validatePmBreakdown(breakdown);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Phase 1 missing name');
    });
    
    it('should detect phases without tasks', () => {
      const breakdown = {
        phases: [
          { phaseName: 'Phase 1', tasks: [], deliverables: ['D1'] },
        ],
      };
      
      const result = validatePmBreakdown(breakdown);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Phase 1 missing tasks');
    });
    
    it('should detect phases without deliverables', () => {
      const breakdown = {
        phases: [
          { phaseName: 'Phase 1', tasks: [{ name: 'Task 1' }], deliverables: [] },
        ],
      };
      
      const result = validatePmBreakdown(breakdown);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Phase 1 missing deliverables');
    });
  });
  
  describe('Email Content Validation', () => {
    it('should validate a complete email', () => {
      const result = validateEmail(sampleEmailContent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect missing subject line', () => {
      const email = 'Dear Client,\n\nHere is our proposal...';
      
      const result = validateEmail(email);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing subject line');
    });
    
    it('should detect missing greeting', () => {
      const email = 'Subject: Proposal\n\nHere is our proposal for $50,000...';
      
      const result = validateEmail(email);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing greeting');
    });
    
    it('should detect missing pricing information', () => {
      const email = 'Subject: Proposal\n\nDear Client,\n\nHere is our proposal...';
      
      const result = validateEmail(email);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing pricing information');
    });
  });
  
  describe('Scenario A Validation', () => {
    it('should have all required fields', () => {
      const scenario = getMockScenarioA();
      
      expect(scenario.name).toBeDefined();
      expect(scenario.description).toBeDefined();
      expect(scenario.techStack).toBeInstanceOf(Array);
      expect(scenario.features).toBeInstanceOf(Array);
      expect(scenario.timeline).toBeDefined();
      expect(scenario.totalHours).toBeGreaterThan(0);
      expect(scenario.hourlyRate).toBeGreaterThan(0);
      expect(scenario.totalCost).toBeGreaterThan(0);
      expect(scenario.pros).toBeInstanceOf(Array);
      expect(scenario.cons).toBeInstanceOf(Array);
    });
    
    it('should calculate cost correctly', () => {
      const scenario = getMockScenarioA();
      
      expect(scenario.totalCost).toBe(scenario.totalHours * scenario.hourlyRate);
    });
    
    it('should be more expensive than Scenario B', () => {
      const scenarioA = getMockScenarioA();
      const scenarioB = getMockScenarioB();
      
      expect(scenarioA.totalCost).toBeGreaterThan(scenarioB.totalCost);
    });
  });
  
  describe('Scenario B Validation', () => {
    it('should have all required fields', () => {
      const scenario = getMockScenarioB();
      
      expect(scenario.name).toBeDefined();
      expect(scenario.description).toBeDefined();
      expect(scenario.techStack).toBeInstanceOf(Array);
      expect(scenario.features).toBeInstanceOf(Array);
      expect(scenario.timeline).toBeDefined();
      expect(scenario.totalHours).toBeGreaterThan(0);
      expect(scenario.hourlyRate).toBeGreaterThan(0);
      expect(scenario.totalCost).toBeGreaterThan(0);
    });
    
    it('should have faster timeline than Scenario A', () => {
      const scenarioA = getMockScenarioA();
      const scenarioB = getMockScenarioB();
      
      // Extract weeks from timeline strings
      const getWeeks = (timeline: string) => {
        const match = timeline.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      expect(getWeeks(scenarioB.timeline)).toBeLessThan(getWeeks(scenarioA.timeline));
    });
  });
  
  describe('ROI Analysis Validation', () => {
    it('should have all required metrics', () => {
      const roi = getMockRoiAnalysis();
      
      expect(roi.costOfDoingNothing).toBeGreaterThan(0);
      expect(roi.projectedSavings).toBeGreaterThan(0);
      expect(roi.paybackPeriodMonths).toBeDefined();
      expect(roi.threeYearROI).toBeDefined();
    });
    
    it('should have shorter payback for Scenario B', () => {
      const roi = getMockRoiAnalysis();
      
      expect(roi.paybackPeriodMonths.scenarioB).toBeLessThan(
        roi.paybackPeriodMonths.scenarioA
      );
    });
    
    it('should have higher 3-year ROI for Scenario B', () => {
      const roi = getMockRoiAnalysis();
      
      expect(roi.threeYearROI.scenarioB).toBeGreaterThan(
        roi.threeYearROI.scenarioA
      );
    });
  });
  
  describe('Complete Project Output Validation', () => {
    it('should validate all outputs of a complete project', () => {
      const project = createMockProjectComplete();
      
      // Check estimate
      const estimateResult = validateEstimate({
        estimateMarkdown: project.estimateMarkdown,
        scenarioA: project.scenarioA,
        scenarioB: project.scenarioB,
        roiAnalysis: project.roiAnalysis,
      });
      expect(estimateResult.valid).toBe(true);
      
      // Check PM breakdown
      const pmResult = validatePmBreakdown(project.pmBreakdown);
      expect(pmResult.valid).toBe(true);
      
      // Check PDF URLs
      expect(project.proposalPdfUrl).toBeDefined();
      expect(project.internalReportPdfUrl).toBeDefined();
      
      // Check guides
      expect(project.vibecodeGuideA).toBeDefined();
      expect(project.vibecodeGuideB).toBeDefined();
    });
    
    it('should have valid stage progression', () => {
      const project = createMockProjectComplete();
      
      expect(project.currentStage).toBe(5);
      expect(project.status).toBe('complete');
    });
  });
  
  describe('Markdown Format Validation', () => {
    it('should have proper markdown structure in estimate', () => {
      const markdown = sampleEstimateMarkdown;
      
      // Check for headers
      expect(markdown).toMatch(/^# /m);
      expect(markdown).toMatch(/^## /m);
      
      // Check for tables
      expect(markdown).toMatch(/\|.*\|/);
      
      // Check for lists
      expect(markdown).toMatch(/^- /m);
    });
    
    it('should include all required sections', () => {
      const markdown = sampleEstimateMarkdown;
      
      expect(markdown).toContain('Executive Summary');
      expect(markdown).toContain('Scenario A');
      expect(markdown).toContain('Scenario B');
      expect(markdown).toContain('ROI');
      expect(markdown).toContain('Recommendation');
    });
    
    it('should include pricing information', () => {
      const markdown = sampleEstimateMarkdown;
      
      expect(markdown).toMatch(/\$[\d,]+/);
      expect(markdown).toContain('Total Investment');
    });
  });
  
  describe('Vibecode Guide Validation', () => {
    it('should include proper prompts in guide A', () => {
      const outputs = allSampleOutputs;
      const guide = outputs.vibecodeGuideA;
      
      // Should have VIBECODE PROMPT sections
      expect(guide).toContain('VIBECODE PROMPT');
      
      // Should include tech stack
      expect(guide).toContain('Tech Stack');
      
      // Should include testing checklist
      expect(guide).toContain('Testing Checklist');
    });
    
    it('should have no-code instructions in guide B', () => {
      const outputs = allSampleOutputs;
      const guide = outputs.vibecodeGuideB;
      
      // Should reference no-code platforms
      expect(guide.toLowerCase()).toContain('no-code');
      
      // Should include setup instructions
      expect(guide).toContain('Setup');
    });
  });
});

describe('Output Quality Metrics', () => {
  it('should meet minimum content length requirements', () => {
    const outputs = allSampleOutputs;
    
    // Estimate should be substantial
    expect(outputs.estimateMarkdown.length).toBeGreaterThan(2000);
    
    // Email should be concise but complete
    expect(outputs.emailContent.length).toBeGreaterThan(500);
    expect(outputs.emailContent.length).toBeLessThan(3000);
    
    // Guides should be detailed
    expect(outputs.vibecodeGuideA.length).toBeGreaterThan(1500);
    expect(outputs.vibecodeGuideB.length).toBeGreaterThan(1000);
  });
  
  it('should have realistic cost estimates', () => {
    const scenarioA = getMockScenarioA();
    const scenarioB = getMockScenarioB();
    
    // Reasonable hourly rates
    expect(scenarioA.hourlyRate).toBeGreaterThanOrEqual(100);
    expect(scenarioA.hourlyRate).toBeLessThanOrEqual(300);
    expect(scenarioB.hourlyRate).toBeGreaterThanOrEqual(50);
    expect(scenarioB.hourlyRate).toBeLessThanOrEqual(150);
    
    // Reasonable total costs
    expect(scenarioA.totalCost).toBeGreaterThan(10000);
    expect(scenarioB.totalCost).toBeGreaterThan(5000);
  });
  
  it('should have reasonable timelines', () => {
    const scenarioA = getMockScenarioA();
    const scenarioB = getMockScenarioB();
    
    // Extract minimum weeks
    const getMinWeeks = (timeline: string) => {
      const match = timeline.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    // Reasonable timelines
    expect(getMinWeeks(scenarioA.timeline)).toBeGreaterThanOrEqual(4);
    expect(getMinWeeks(scenarioA.timeline)).toBeLessThanOrEqual(24);
    expect(getMinWeeks(scenarioB.timeline)).toBeGreaterThanOrEqual(2);
    expect(getMinWeeks(scenarioB.timeline)).toBeLessThanOrEqual(12);
  });
});
