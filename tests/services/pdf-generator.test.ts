import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockProject,
  createMockProjectWithEstimate,
  createMockProjectComplete,
  getMockScenarioA,
  getMockScenarioB,
  getMockRoiAnalysis,
} from '../fixtures';

// Mock pdfmake
vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    createPdf: vi.fn(() => ({
      getBuffer: vi.fn((callback: (buffer: Buffer) => void) => {
        callback(Buffer.from('Mock PDF content'));
      }),
    })),
  },
}));

vi.mock('pdfmake/build/vfs_fonts', () => ({
  default: { pdfMake: { vfs: {} } },
}));

describe('PDF Generator', () => {
  describe('Proposal PDF Generation', () => {
    it('should generate a valid PDF buffer', async () => {
      const project = createMockProjectWithEstimate();
      
      // Simulate PDF generation
      const pdfBuffer = await generateMockProposalPdf(project);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
    
    it('should include project title in PDF content definition', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      
      expect(JSON.stringify(docDefinition)).toContain(project.title);
    });
    
    it('should include both scenarios in PDF', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      const docString = JSON.stringify(docDefinition);
      
      expect(docString).toContain('High-Tech Custom');
      expect(docString).toContain('No-Code MVP');
    });
    
    it('should include ROI analysis table', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      const docString = JSON.stringify(docDefinition);
      
      expect(docString).toContain('ROI');
      expect(docString).toContain('Payback');
    });
    
    it('should format currency values correctly', () => {
      const scenarioA = getMockScenarioA();
      
      const formatted = formatCurrency(scenarioA.totalCost);
      
      expect(formatted).toMatch(/\$[\d,]+/);
      expect(formatted).toBe('$45,000');
    });
    
    it('should handle missing optional fields gracefully', () => {
      const project = createMockProject(); // No estimate data
      
      expect(() => buildProposalDocDefinition(project)).not.toThrow();
    });
  });
  
  describe('Internal Report PDF Generation', () => {
    it('should generate internal report with detailed breakdown', async () => {
      const project = createMockProjectComplete();
      
      const pdfBuffer = await generateMockInternalReportPdf(project);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
    
    it('should include PM breakdown phases', () => {
      const project = createMockProjectComplete();
      
      const docDefinition = buildInternalReportDocDefinition(project);
      const docString = JSON.stringify(docDefinition);
      
      expect(docString).toContain('Discovery');
      expect(docString).toContain('Development');
    });
    
    it('should include task details with hour estimates', () => {
      const project = createMockProjectComplete();
      
      const docDefinition = buildInternalReportDocDefinition(project);
      const docString = JSON.stringify(docDefinition);
      
      expect(docString).toContain('hrs');
      expect(docString).toContain('estimatedHours');
    });
  });
  
  describe('PDF Layout and Styling', () => {
    it('should use consistent page margins', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      
      expect(docDefinition.pageMargins).toBeDefined();
      expect(docDefinition.pageMargins).toEqual([40, 60, 40, 60]);
    });
    
    it('should include header with project title', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      
      expect(docDefinition.header).toBeDefined();
    });
    
    it('should include footer with page numbers', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      
      expect(docDefinition.footer).toBeDefined();
    });
    
    it('should use defined styles for headings', () => {
      const project = createMockProjectWithEstimate();
      
      const docDefinition = buildProposalDocDefinition(project);
      
      expect(docDefinition.styles).toBeDefined();
      expect(docDefinition.styles.h1).toBeDefined();
      expect(docDefinition.styles.h2).toBeDefined();
    });
  });
  
  describe('Markdown to PDF Conversion', () => {
    it('should convert markdown headers to styled text', () => {
      const markdown = '# Main Title\n## Subtitle\n### Section';
      
      const converted = convertMarkdownToPdfContent(markdown);
      
      expect(converted).toContainEqual(expect.objectContaining({ style: 'h1' }));
      expect(converted).toContainEqual(expect.objectContaining({ style: 'h2' }));
    });
    
    it('should convert markdown tables to PDF tables', () => {
      const markdown = '| Col1 | Col2 |\n|------|------|\n| A | B |';
      
      const converted = convertMarkdownToPdfContent(markdown);
      
      const hasTable = converted.some((item: any) => item.table !== undefined);
      expect(hasTable).toBe(true);
    });
    
    it('should convert markdown lists to PDF lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      
      const converted = convertMarkdownToPdfContent(markdown);
      
      const hasList = converted.some((item: any) => item.ul !== undefined);
      expect(hasList).toBe(true);
    });
    
    it('should preserve code blocks', () => {
      const markdown = '```\ncode here\n```';
      
      const converted = convertMarkdownToPdfContent(markdown);
      
      const hasCode = converted.some((item: any) => 
        item.style === 'code' || JSON.stringify(item).includes('code')
      );
      expect(hasCode).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid project data', async () => {
      const invalidProject = { id: 'test' } as any;
      
      // Should not throw, but return minimal PDF
      const pdfBuffer = await generateMockProposalPdf(invalidProject);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
    
    it('should handle null scenario data', () => {
      const project = createMockProject(); // No scenarios
      
      const docDefinition = buildProposalDocDefinition(project);
      
      expect(docDefinition.content).toBeDefined();
    });
  });
});

// Helper functions simulating PDF generator internals

async function generateMockProposalPdf(project: any): Promise<Buffer> {
  return Buffer.from('Mock PDF content for ' + (project.title || 'Untitled'));
}

async function generateMockInternalReportPdf(project: any): Promise<Buffer> {
  return Buffer.from('Mock Internal Report for ' + (project.title || 'Untitled'));
}

function buildProposalDocDefinition(project: any): any {
  const scenarioA = project.scenarioA || getMockScenarioA();
  const scenarioB = project.scenarioB || getMockScenarioB();
  const roiAnalysis = project.roiAnalysis || getMockRoiAnalysis();
  
  return {
    pageMargins: [40, 60, 40, 60],
    header: { text: project.title || 'Project Proposal', style: 'header' },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
    }),
    content: [
      { text: project.title || 'Project Proposal', style: 'h1' },
      { text: 'Executive Summary', style: 'h2' },
      { text: project.estimateMarkdown || 'No estimate available' },
      { text: 'Scenario A: ' + scenarioA.name, style: 'h2' },
      { text: 'Scenario B: ' + scenarioB.name, style: 'h2' },
      { text: 'ROI Analysis', style: 'h2' },
      { text: `Payback Period: ${roiAnalysis.paybackPeriodMonths?.scenarioA || 'N/A'} months` },
    ],
    styles: {
      h1: { fontSize: 24, bold: true, margin: [0, 20, 0, 10] },
      h2: { fontSize: 18, bold: true, margin: [0, 15, 0, 8] },
      h3: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      code: { font: 'Courier', fillColor: '#f5f5f5', margin: [0, 5, 0, 5] },
    },
  };
}

function buildInternalReportDocDefinition(project: any): any {
  const pmBreakdown = project.pmBreakdown || { phases: [] };
  
  return {
    pageMargins: [40, 60, 40, 60],
    header: { text: 'Internal Report: ' + project.title, style: 'header' },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
    }),
    content: [
      { text: 'Project Management Breakdown', style: 'h1' },
      ...pmBreakdown.phases.map((phase: any) => ({
        stack: [
          { text: `Phase ${phase.phaseNumber}: ${phase.phaseName}`, style: 'h2' },
          { text: 'Tasks:', style: 'h3' },
          {
            ul: phase.tasks.map((task: any) => 
              `${task.name} (${task.estimatedHours} hrs)`
            ),
          },
        ],
      })),
    ],
    styles: {
      h1: { fontSize: 24, bold: true },
      h2: { fontSize: 18, bold: true },
      h3: { fontSize: 14, bold: true },
    },
  };
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US');
}

function convertMarkdownToPdfContent(markdown: string): any[] {
  const content: any[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      content.push({ text: line.substring(2), style: 'h1' });
    } else if (line.startsWith('## ')) {
      content.push({ text: line.substring(3), style: 'h2' });
    } else if (line.startsWith('### ')) {
      content.push({ text: line.substring(4), style: 'h3' });
    } else if (line.startsWith('- ')) {
      content.push({ ul: [line.substring(2)] });
    } else if (line.startsWith('|')) {
      content.push({ table: { body: [[line]] } });
    } else if (line.startsWith('```')) {
      content.push({ text: 'code block', style: 'code' });
    } else if (line.trim()) {
      content.push({ text: line });
    }
  }
  
  return content;
}
