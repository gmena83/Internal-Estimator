import type { Project } from "@shared/schema";

interface ExportConfig {
  label: string;
  getValue: (project: Project) => string;
}

const EXPORT_CONFIG: ExportConfig[] = [
  { label: "Project Title", getValue: (p) => p.title },
  { label: "Client Name", getValue: (p) => p.clientName || "N/A" },
  { label: "Current Stage", getValue: (p) => p.currentStage.toString() },
  { label: "Status", getValue: (p) => p.status },
  { label: "Total Cost (A)", getValue: (p) => (p.scenarioA as any)?.totalCost?.toString() || "0" },
  { label: "Timeline (A)", getValue: (p) => (p.scenarioA as any)?.timeline || "N/A" },
  { label: "Total Cost (B)", getValue: (p) => (p.scenarioB as any)?.totalCost?.toString() || "0" },
  { label: "Timeline (B)", getValue: (p) => (p.scenarioB as any)?.timeline || "N/A" },
  {
    label: "ROI Payback (mos)",
    getValue: (p) => (p.roiAnalysis as any)?.paybackPeriodMonths?.toString() || "N/A",
  },
  {
    label: "ROI 3-Year %",
    getValue: (p) => (p.roiAnalysis as any)?.threeYearROI?.toString() || "N/A",
  },
];

export class ExportService {
  /**
   * Generates CSV content using configuration-driven mapping.
   */
  mapToCsv(project: Project): string {
    const headers = EXPORT_CONFIG.map((c) => c.label);
    const values = EXPORT_CONFIG.map((c) => {
      try {
        const val = c.getValue(project);
        return `"${String(val).replace(/"/g, '""')}"`;
      } catch {
        return '""';
      }
    });

    return [headers.join(","), values.join(",")].join("\n");
  }

  /**
   * Generates a comprehensive JSON export.
   */
  mapToJson(project: Project, messages: any[]): any {
    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "2.0.0",
      },
      project,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      })),
    };
  }
}

export const exportService = new ExportService();
