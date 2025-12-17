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

interface Scenario {
  name?: string;
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

export async function generateProposalPdf(project: Project): Promise<Buffer> {
  const scenarioA = project.scenarioA as Scenario | null;
  const scenarioB = project.scenarioB as Scenario | null;
  const roiAnalysis = project.roiAnalysis as ROIAnalysis | null;
  const selectedScenario = project.selectedScenario === "A" ? scenarioA : scenarioB;

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: "Helvetica",
      fontSize: 11,
      lineHeight: 1.4,
    },
    pageMargins: [50, 60, 50, 60],
    content: [
      {
        text: "PROJECT PROPOSAL",
        style: "header",
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
      {
        text: project.title,
        style: "title",
        alignment: "center",
        margin: [0, 0, 0, 30],
      },
      {
        text: `Prepared for: ${project.clientName || "Valued Client"}`,
        alignment: "center",
        margin: [0, 0, 0, 5],
      },
      {
        text: `Date: ${new Date().toLocaleDateString()}`,
        alignment: "center",
        margin: [0, 0, 0, 40],
      },
      { text: "Executive Summary", style: "sectionHeader" },
      {
        text: `This proposal presents our recommended approach for ${project.title}. After careful analysis, we recommend ${selectedScenario?.name || "the selected approach"} which balances time-to-market with long-term scalability.`,
        margin: [0, 0, 0, 20],
      },
      { text: "Recommended Approach", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "Approach", style: "tableHeader" },
              { text: selectedScenario?.name || "Selected Scenario", style: "tableValue" },
            ],
            [
              { text: "Timeline", style: "tableHeader" },
              { text: selectedScenario?.timeline || "To be determined", style: "tableValue" },
            ],
            [
              { text: "Investment", style: "tableHeader" },
              { text: selectedScenario?.totalCost ? `$${selectedScenario.totalCost.toLocaleString()}` : "To be discussed", style: "tableValue" },
            ],
            [
              { text: "Estimated Hours", style: "tableHeader" },
              { text: selectedScenario?.totalHours?.toString() || "TBD", style: "tableValue" },
            ],
          ],
        },
        margin: [0, 0, 0, 20],
      },
      { text: "Key Features", style: "sectionHeader" },
      {
        ul: selectedScenario?.features || ["Feature details to be defined"],
        margin: [0, 0, 0, 20],
      },
      { text: "Technology Stack", style: "sectionHeader" },
      {
        text: selectedScenario?.techStack?.join(", ") || "To be determined based on requirements",
        margin: [0, 0, 0, 20],
      },
      { text: "ROI Analysis", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "Metric", style: "tableHeader" },
              { text: "Value", style: "tableHeader" },
            ],
            [
              "Cost of Doing Nothing",
              roiAnalysis?.costOfDoingNothing ? `$${roiAnalysis.costOfDoingNothing.toLocaleString()}/year` : "N/A",
            ],
            [
              "Projected Annual Savings",
              roiAnalysis?.projectedSavings ? `$${roiAnalysis.projectedSavings.toLocaleString()}/year` : "N/A",
            ],
            [
              "Payback Period",
              roiAnalysis?.paybackPeriodMonths ? `${roiAnalysis.paybackPeriodMonths} months` : "N/A",
            ],
            [
              "3-Year ROI",
              roiAnalysis?.threeYearROI ? `${roiAnalysis.threeYearROI}%` : "N/A",
            ],
          ],
        },
        margin: [0, 0, 0, 30],
      },
      { text: "Next Steps", style: "sectionHeader" },
      {
        ol: [
          "Review this proposal and provide feedback",
          "Schedule a kickoff meeting to align on requirements",
          "Sign statement of work to begin development",
          "Weekly progress updates throughout development",
        ],
        margin: [0, 0, 0, 30],
      },
      {
        text: "Generated by ISI Agent",
        alignment: "center",
        fontSize: 9,
        color: "#888888",
        margin: [0, 20, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 12,
        bold: true,
        color: "#666666",
      },
      title: {
        fontSize: 24,
        bold: true,
        color: "#333333",
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 15, 0, 10] as [number, number, number, number],
        color: "#2563eb",
      },
      tableHeader: {
        bold: true,
        fillColor: "#f3f4f6",
      },
      tableValue: {
        bold: true,
      },
    },
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
      lineHeight: 1.3,
    },
    pageMargins: [40, 50, 40, 50],
    content: [
      {
        text: "INTERNAL PROJECT REPORT",
        style: "header",
        alignment: "center",
        margin: [0, 0, 0, 5],
      },
      {
        text: project.title,
        style: "title",
        alignment: "center",
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          { text: `Client: ${project.clientName || "TBD"}`, width: "*" },
          { text: `Status: ${project.status}`, width: "*", alignment: "right" },
        ],
        margin: [0, 0, 0, 5],
      },
      {
        columns: [
          { text: `Stage: ${project.currentStage}/5`, width: "*" },
          { text: `Date: ${new Date().toLocaleDateString()}`, width: "*", alignment: "right" },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: "Scenario Comparison", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              { text: "Metric", style: "tableHeader" },
              { text: "Scenario A (High-Code)", style: "tableHeader" },
              { text: "Scenario B (No-Code)", style: "tableHeader" },
            ],
            [
              "Total Cost",
              scenarioA?.totalCost ? `$${scenarioA.totalCost.toLocaleString()}` : "N/A",
              scenarioB?.totalCost ? `$${scenarioB.totalCost.toLocaleString()}` : "N/A",
            ],
            [
              "Timeline",
              scenarioA?.timeline || "N/A",
              scenarioB?.timeline || "N/A",
            ],
            [
              "Hours",
              scenarioA?.totalHours?.toString() || "N/A",
              scenarioB?.totalHours?.toString() || "N/A",
            ],
            [
              "Hourly Rate",
              scenarioA?.hourlyRate ? `$${scenarioA.hourlyRate}` : "N/A",
              scenarioB?.hourlyRate ? `$${scenarioB.hourlyRate}` : "N/A",
            ],
            [
              "Recommended",
              scenarioA?.recommended ? "Yes" : "No",
              scenarioB?.recommended ? "Yes" : "No",
            ],
          ],
        },
        margin: [0, 0, 0, 20],
      },
      { text: "Selected Approach", style: "sectionHeader" },
      {
        text: project.selectedScenario === "A" 
          ? `Scenario A: ${scenarioA?.name || "High-Code"}` 
          : `Scenario B: ${scenarioB?.name || "No-Code"}`,
        bold: true,
        margin: [0, 0, 0, 15],
      },
      { text: "ROI Summary", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              { text: "Metric", style: "tableHeader" },
              { text: "Value", style: "tableHeader" },
            ],
            ["Cost of Doing Nothing", roiAnalysis?.costOfDoingNothing ? `$${roiAnalysis.costOfDoingNothing.toLocaleString()}/year` : "N/A"],
            ["Manual Operational Cost", roiAnalysis?.manualOperationalCost ? `$${roiAnalysis.manualOperationalCost.toLocaleString()}/year` : "N/A"],
            ["Projected Savings", roiAnalysis?.projectedSavings ? `$${roiAnalysis.projectedSavings.toLocaleString()}/year` : "N/A"],
            ["Payback Period", roiAnalysis?.paybackPeriodMonths ? `${roiAnalysis.paybackPeriodMonths} months` : "N/A"],
            ["3-Year ROI", roiAnalysis?.threeYearROI ? `${roiAnalysis.threeYearROI}%` : "N/A"],
          ],
        },
        margin: [0, 0, 0, 20],
      },
      { text: "Project Timeline", style: "sectionHeader" },
      {
        ul: [
          `Stage 1 (Estimate): ${project.estimateMarkdown ? "Complete" : "Pending"}`,
          `Stage 2 (Assets): ${project.proposalPdfUrl ? "Complete" : "Pending"}`,
          `Stage 3 (Email): ${project.emailSentAt ? "Sent" : "Pending"}`,
          `Stage 4 (Vibe Guide): ${project.vibecodeGuideA ? "Complete" : "Pending"}`,
          `Stage 5 (PM Breakdown): ${project.pmBreakdown ? "Complete" : "Pending"}`,
        ],
        margin: [0, 0, 0, 20],
      },
      {
        text: "CONFIDENTIAL - Internal Use Only",
        alignment: "center",
        fontSize: 8,
        color: "#cc0000",
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 10,
        bold: true,
        color: "#666666",
      },
      title: {
        fontSize: 18,
        bold: true,
        color: "#333333",
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 8] as [number, number, number, number],
        color: "#1e40af",
      },
      tableHeader: {
        bold: true,
        fillColor: "#e5e7eb",
        fontSize: 9,
      },
    },
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
