import PdfPrinter from "pdfmake";
import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import type { Project } from "@shared/schema";

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

const COLORS = {
  primary: "#0A3A5A",
  accent: "#00B8D4",
  text: "#0f172a",
  textSecondary: "#475569",
  textTertiary: "#64748b",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  background: "#f8fafc",
  terminalBg: "#1e293b",
  terminalText: "#a5f3fc",
  terminalBorder: "#334155",
  tipBg: "#f0fdfa",
  tipBorder: "#0d9488",
  tipText: "#115e59",
  error: "#cc0000",
};

interface Scenario {
  name?: string;
  title?: string;
  description?: string;
  features?: string[];
  techStack?: string[];
  timeline?: string;
  totalCost?: number;
  hourlyRate?: number;
  totalHours?: number;
  pros?: string[];
  cons?: string[];
  recommended?: boolean;
}

interface ROIAnalysis {
  costOfDoingNothing?: number;
  manualOperationalCost?: number;
  projectedSavings?: number;
  paybackPeriodMonths?: number;
  threeYearROI?: number;
}

interface PMPhase {
  phaseNumber: number;
  phaseName: string;
  objectives?: string[];
  durationDays?: number;
  tasks?: { id: string; name: string; estimatedHours?: number }[];
  deliverables?: string[];
}

function createTerminalBox(command: string, label?: string): Content[] {
  const content: Content[] = [];
  
  if (label) {
    content.push({
      text: label.toUpperCase(),
      fontSize: 8,
      bold: true,
      color: COLORS.textTertiary,
      margin: [0, 10, 0, 3] as [number, number, number, number],
    });
  }
  
  content.push({
    table: {
      widths: ["*"],
      body: [[
        {
          text: `$ ${command}`,
          font: "Helvetica",
          fontSize: 10,
          color: COLORS.terminalText,
          fillColor: COLORS.terminalBg,
          margin: [12, 10, 12, 10] as [number, number, number, number],
        }
      ]],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => COLORS.terminalBorder,
      vLineColor: () => COLORS.terminalBorder,
    },
    margin: [0, 0, 0, 10] as [number, number, number, number],
  });
  
  return content;
}

function createTipBox(text: string): Content {
  return {
    table: {
      widths: [3, "*"],
      body: [[
        { text: "", fillColor: COLORS.tipBorder },
        {
          text: text,
          fontSize: 11,
          color: COLORS.tipText,
          fillColor: COLORS.tipBg,
          margin: [8, 8, 8, 8] as [number, number, number, number],
        }
      ]],
    },
    layout: "noBorders",
    margin: [0, 5, 0, 15] as [number, number, number, number],
  };
}

function createSectionHeader(text: string, subtitle?: string): Content {
  const headerContent: any[][] = [[
    {
      text: text.toUpperCase(),
      fontSize: 12,
      bold: true,
      color: "#ffffff",
    },
  ]];

  if (subtitle) {
    headerContent[0].push({
      text: subtitle,
      fontSize: 10,
      color: "rgba(255,255,255,0.7)",
      alignment: "right",
    });
  }

  return {
    table: {
      widths: subtitle ? ["*", "auto"] : ["*"],
      body: headerContent,
    },
    layout: {
      fillColor: () => COLORS.primary,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 12,
      paddingRight: () => 12,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    },
    margin: [0, 25, 0, 18] as [number, number, number, number],
  };
}

function createPhaseBlock(phaseTitle: string, steps: { title: string; description: string; prompt?: string; tip?: string }[]): Content[] {
  const content: Content[] = [
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 2, y2: 0, lineWidth: 2, lineColor: COLORS.border }
      ],
    },
    {
      text: phaseTitle.toUpperCase(),
      fontSize: 12,
      bold: true,
      color: COLORS.accent,
      margin: [15, 15, 0, 12] as [number, number, number, number],
    },
  ];

  steps.forEach(step => {
    content.push({
      text: step.title,
      fontSize: 12,
      bold: true,
      color: COLORS.text,
      margin: [15, 0, 0, 4] as [number, number, number, number],
    });
    
    content.push({
      text: step.description,
      fontSize: 11,
      color: COLORS.textSecondary,
      margin: [15, 0, 0, 8] as [number, number, number, number],
    });
    
    if (step.prompt) {
      content.push(...createTerminalBox(step.prompt, "PROMPT").map(c => ({
        ...c,
        margin: [15, 0, 0, 8] as [number, number, number, number],
      })));
    }
    
    if (step.tip) {
      content.push({
        ...createTipBox(step.tip),
        margin: [15, 0, 0, 15] as [number, number, number, number],
      });
    }
  });

  return content;
}

function createModuleCard(title: string, items: string[]): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [{
          text: title,
          fontSize: 11,
          bold: true,
          color: COLORS.text,
          fillColor: COLORS.background,
          margin: [10, 8, 10, 8] as [number, number, number, number],
        }],
        [{
          ul: items.map(item => ({
            text: item,
            fontSize: 10,
            color: COLORS.textSecondary,
            margin: [0, 3, 0, 3] as [number, number, number, number],
          })),
          margin: [10, 10, 10, 10] as [number, number, number, number],
        }],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => COLORS.border,
      vLineColor: () => COLORS.border,
    },
  };
}

export async function generateProposalPdf(project: Project): Promise<Buffer> {
  const scenarioA = project.scenarioA as Scenario | null;
  const scenarioB = project.scenarioB as Scenario | null;
  const roiAnalysis = project.roiAnalysis as ROIAnalysis | null;
  const selectedScenario = project.selectedScenario === "A" ? scenarioA : scenarioB;

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: "Helvetica",
      fontSize: 11,
      lineHeight: 1.5,
      color: COLORS.text,
    },
    pageMargins: [40, 50, 40, 50],
    content: [
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: COLORS.primary }
        ],
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
      {
        text: "PROJECT PROPOSAL // MENATECH",
        fontSize: 9,
        bold: true,
        color: COLORS.accent,
        letterSpacing: 2,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      {
        text: project.title,
        fontSize: 22,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 25] as [number, number, number, number],
      },
      {
        text: `This proposal presents our strategic approach for ${project.title}. After careful analysis of your requirements and market conditions, we recommend ${selectedScenario?.name || "a tailored solution"} that balances innovation with practical implementation.`,
        fontSize: 12,
        color: COLORS.textSecondary,
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      {
        columns: [
          { text: `Prepared for: ${project.clientName || "Valued Client"}`, width: "*", fontSize: 10 },
          { text: `Date: ${new Date().toLocaleDateString()}`, width: "auto", fontSize: 10, alignment: "right" },
        ],
        margin: [0, 0, 0, 30] as [number, number, number, number],
      },
      createSectionHeader("Recommended Approach"),
      {
        table: {
          widths: ["35%", "*"],
          body: [
            [
              { text: "Approach", bold: true, fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: selectedScenario?.name || "Selected Scenario", bold: true, margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "Timeline", bold: true, fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: selectedScenario?.timeline || "To be determined", margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "Investment", bold: true, fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: selectedScenario?.totalCost ? `$${selectedScenario.totalCost.toLocaleString()}` : "To be discussed", margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "Estimated Hours", bold: true, fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: selectedScenario?.totalHours?.toString() || "TBD", margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      createSectionHeader("Key Features"),
      {
        ul: (selectedScenario?.features || ["Feature details to be defined"]).map(f => ({
          text: f,
          margin: [0, 3, 0, 3] as [number, number, number, number],
        })),
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      createSectionHeader("Technology Stack"),
      {
        text: selectedScenario?.techStack?.join(" | ") || "To be determined based on requirements",
        fontSize: 11,
        color: COLORS.textSecondary,
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      createSectionHeader("ROI Analysis"),
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "Metric", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: "Value", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "Cost of Doing Nothing", margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: roiAnalysis?.costOfDoingNothing ? `$${roiAnalysis.costOfDoingNothing.toLocaleString()}/year` : "N/A", margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "Projected Annual Savings", fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: roiAnalysis?.projectedSavings ? `$${roiAnalysis.projectedSavings.toLocaleString()}/year` : "N/A", fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "Payback Period", margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: roiAnalysis?.paybackPeriodMonths ? `${roiAnalysis.paybackPeriodMonths} months` : "N/A", margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
            [
              { text: "3-Year ROI", fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
              { text: roiAnalysis?.threeYearROI ? `${roiAnalysis.threeYearROI}%` : "N/A", fillColor: COLORS.background, margin: [8, 6, 8, 6] as [number, number, number, number] },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
        margin: [0, 0, 0, 25] as [number, number, number, number],
      },
      createSectionHeader("Next Steps"),
      {
        ol: [
          { text: "Review this proposal and provide feedback", margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: "Schedule a kickoff meeting to align on requirements", margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: "Sign statement of work to begin development", margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: "Weekly progress updates throughout development", margin: [0, 3, 0, 3] as [number, number, number, number] },
        ],
        margin: [0, 0, 0, 40] as [number, number, number, number],
      },
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: COLORS.border }
        ],
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      {
        text: `Generated by Menatech AI Workflow | Confidential | ${new Date().getFullYear()}`,
        alignment: "center",
        fontSize: 9,
        color: COLORS.textMuted,
      },
    ],
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateInternalReportPdf(project: Project): Promise<Buffer> {
  const scenarioA = project.scenarioA as Scenario | null;
  const scenarioB = project.scenarioB as Scenario | null;
  const roiAnalysis = project.roiAnalysis as ROIAnalysis | null;

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: "Helvetica",
      fontSize: 10,
      lineHeight: 1.4,
      color: COLORS.text,
    },
    pageMargins: [40, 50, 40, 50],
    content: [
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: COLORS.primary }
        ],
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
      {
        text: "INTERNAL PROJECT REPORT // MENATECH",
        fontSize: 9,
        bold: true,
        color: COLORS.accent,
        letterSpacing: 2,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      {
        text: project.title,
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
      {
        columns: [
          { text: `Client: ${project.clientName || "TBD"}`, width: "*", fontSize: 10 },
          { text: `Status: ${project.status}`, width: "*", alignment: "right", fontSize: 10 },
        ],
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      {
        columns: [
          { text: `Stage: ${project.currentStage}/5`, width: "*", fontSize: 10 },
          { text: `Date: ${new Date().toLocaleDateString()}`, width: "*", alignment: "right", fontSize: 10 },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      createSectionHeader("Scenario Comparison"),
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              { text: "Metric", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: "Scenario A (High-Code)", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: "Scenario B (No-Code)", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Total Cost", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioA?.totalCost ? `$${scenarioA.totalCost.toLocaleString()}` : "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioB?.totalCost ? `$${scenarioB.totalCost.toLocaleString()}` : "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Timeline", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioA?.timeline || "N/A", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioB?.timeline || "N/A", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Hours", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioA?.totalHours?.toString() || "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioB?.totalHours?.toString() || "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Hourly Rate", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioA?.hourlyRate ? `$${scenarioA.hourlyRate}` : "N/A", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioB?.hourlyRate ? `$${scenarioB.hourlyRate}` : "N/A", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Recommended", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioA?.recommended ? "Yes" : "No", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: scenarioB?.recommended ? "Yes" : "No", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      createSectionHeader("Selected Approach"),
      {
        text: project.selectedScenario === "A" 
          ? `Scenario A: ${scenarioA?.name || "High-Code"}` 
          : `Scenario B: ${scenarioB?.name || "No-Code"}`,
        bold: true,
        fontSize: 12,
        color: COLORS.accent,
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
      createSectionHeader("ROI Summary"),
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "Metric", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: "Value", bold: true, fillColor: COLORS.primary, color: "#fff", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Cost of Doing Nothing", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: roiAnalysis?.costOfDoingNothing ? `$${roiAnalysis.costOfDoingNothing.toLocaleString()}/year` : "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Manual Operational Cost", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: roiAnalysis?.manualOperationalCost ? `$${roiAnalysis.manualOperationalCost.toLocaleString()}/year` : "N/A", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Projected Savings", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: roiAnalysis?.projectedSavings ? `$${roiAnalysis.projectedSavings.toLocaleString()}/year` : "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "Payback Period", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: roiAnalysis?.paybackPeriodMonths ? `${roiAnalysis.paybackPeriodMonths} months` : "N/A", fillColor: COLORS.background, margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
            [
              { text: "3-Year ROI", margin: [6, 5, 6, 5] as [number, number, number, number] },
              { text: roiAnalysis?.threeYearROI ? `${roiAnalysis.threeYearROI}%` : "N/A", margin: [6, 5, 6, 5] as [number, number, number, number] },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      createSectionHeader("Project Timeline"),
      {
        ul: [
          { text: `Stage 1 (Estimate): ${project.estimateMarkdown ? "Complete" : "Pending"}`, margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: `Stage 2 (Assets): ${project.proposalPdfUrl ? "Complete" : "Pending"}`, margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: `Stage 3 (Email): ${project.emailSentAt ? "Sent" : "Pending"}`, margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: `Stage 4 (Vibe Guide): ${project.vibecodeGuideA ? "Complete" : "Pending"}`, margin: [0, 3, 0, 3] as [number, number, number, number] },
          { text: `Stage 5 (PM Breakdown): ${project.pmBreakdown ? "Complete" : "Pending"}`, margin: [0, 3, 0, 3] as [number, number, number, number] },
        ],
        margin: [0, 0, 0, 30] as [number, number, number, number],
      },
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: COLORS.border }
        ],
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      {
        text: "CONFIDENTIAL - Internal Use Only",
        alignment: "center",
        fontSize: 8,
        bold: true,
        color: COLORS.error,
      },
      {
        text: `Generated by Menatech AI Workflow | ${new Date().getFullYear()}`,
        alignment: "center",
        fontSize: 8,
        color: COLORS.textMuted,
        margin: [0, 5, 0, 0] as [number, number, number, number],
      },
    ],
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateExecutionManualPdf(project: Project): Promise<Buffer> {
  const scenarioA = project.scenarioA as Scenario | null;
  const scenarioB = project.scenarioB as Scenario | null;
  const vibeGuideA = project.vibecodeGuideA as string | null;
  const vibeGuideB = project.vibecodeGuideB as string | null;
  const pmBreakdown = project.pmBreakdown as { phases?: PMPhase[] } | null;

  const content: Content[] = [
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: COLORS.primary }
      ],
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
    {
      text: "TECHNICAL EXECUTION MANUAL // MENATECH",
      fontSize: 9,
      bold: true,
      color: COLORS.accent,
      letterSpacing: 2,
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      text: project.title,
      fontSize: 22,
      bold: true,
      color: COLORS.primary,
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },
    {
      text: "This document contains the detailed technical roadmap for project implementation. Includes engineering prompts for code generation and configuration logic for no-code tools.",
      fontSize: 12,
      color: COLORS.textSecondary,
      margin: [0, 0, 0, 30] as [number, number, number, number],
    },
  ];

  content.push(createSectionHeader(scenarioA?.title || scenarioA?.name || "Manual A: High-Code Approach", "CURSOR | REPLIT | WINDSURF"));

  if (vibeGuideA) {
    const lines = vibeGuideA.split("\n");
    let currentPhase = "";
    let currentSteps: { title: string; description: string; prompt?: string; tip?: string }[] = [];

    lines.forEach(line => {
      if (line.startsWith("## ")) {
        if (currentPhase && currentSteps.length > 0) {
          content.push(...createPhaseBlock(currentPhase, currentSteps));
          currentSteps = [];
        }
        currentPhase = line.replace("## ", "");
      } else if (line.startsWith("### ")) {
        currentSteps.push({
          title: line.replace("### ", ""),
          description: "",
        });
      } else if (line.startsWith("```") && currentSteps.length > 0) {
      } else if (line.startsWith("$ ") && currentSteps.length > 0) {
        currentSteps[currentSteps.length - 1].prompt = line.replace("$ ", "");
      } else if (line.startsWith("> ") && currentSteps.length > 0) {
        currentSteps[currentSteps.length - 1].tip = line.replace("> ", "");
      } else if (line.trim() && currentSteps.length > 0) {
        currentSteps[currentSteps.length - 1].description += (currentSteps[currentSteps.length - 1].description ? " " : "") + line.trim();
      }
    });

    if (currentPhase && currentSteps.length > 0) {
      content.push(...createPhaseBlock(currentPhase, currentSteps));
    }
  } else {
    content.push({
      text: "High-code execution guide will be generated after the vibe guide stage.",
      fontSize: 11,
      color: COLORS.textSecondary,
      margin: [0, 0, 0, 20] as [number, number, number, number],
    });
  }

  content.push({ text: "", pageBreak: "before" });

  const noCodeHeader = createSectionHeader(scenarioB?.title || scenarioB?.name || "Manual B: No-Code Approach", "AIRTABLE | MAKE | SOFTR") as any;
  noCodeHeader.layout.fillColor = () => "#0891b2";
  content.push(noCodeHeader);

  if (vibeGuideB) {
    const modules: { title: string; items: string[] }[] = [];
    let currentModule = "";
    let currentItems: string[] = [];

    vibeGuideB.split("\n").forEach(line => {
      if (line.startsWith("## ")) {
        if (currentModule && currentItems.length > 0) {
          modules.push({ title: currentModule, items: currentItems });
          currentItems = [];
        }
        currentModule = line.replace("## ", "");
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        currentItems.push(line.replace(/^[-*]\s*/, ""));
      }
    });

    if (currentModule && currentItems.length > 0) {
      modules.push({ title: currentModule, items: currentItems });
    }

    if (modules.length > 0) {
      const rows: Content[] = [];
      for (let i = 0; i < modules.length; i += 2) {
        const row: Content = {
          columns: [
            { width: "*", ...createModuleCard(modules[i].title, modules[i].items) },
            { width: 15, text: "" },
            modules[i + 1] 
              ? { width: "*", ...createModuleCard(modules[i + 1].title, modules[i + 1].items) }
              : { width: "*", text: "" },
          ],
          margin: [0, 0, 0, 15] as [number, number, number, number],
        };
        rows.push(row);
      }
      content.push(...rows);
    }
  } else {
    content.push({
      text: "No-code execution guide will be generated after the vibe guide stage.",
      fontSize: 11,
      color: COLORS.textSecondary,
      margin: [0, 0, 0, 20] as [number, number, number, number],
    });
  }

  content.push(
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: COLORS.border }
      ],
      margin: [0, 30, 0, 10] as [number, number, number, number],
    },
    {
      text: `Generated by Menatech AI Workflow | Confidential Internal Use | ${new Date().getFullYear()}`,
      alignment: "center",
      fontSize: 9,
      color: COLORS.textMuted,
    }
  );

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: "Helvetica",
      fontSize: 11,
      lineHeight: 1.5,
      color: COLORS.text,
    },
    pageMargins: [40, 50, 40, 50],
    content,
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
