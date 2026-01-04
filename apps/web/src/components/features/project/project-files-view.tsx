import React from "react";
import { FolderOpen, FileText, Code2, ClipboardList, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@shared/schema";

interface ProjectFilesViewProps {
  project?: Project;
}

export function ProjectFilesView({ project }: ProjectFilesViewProps) {
  if (!project || project.status !== "complete") {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Project files will be available after final approval.</p>
      </div>
    );
  }

  const safeName = project.title.replace(/[^a-zA-Z0-9]/g, "_");

  const generateMarkdownFile = (title: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateConsolidatedMarkdown = React.useCallback(() => {
    let consolidated = `# ${project.title} - Complete Project Documentation\n\n`;
    consolidated += `**Client:** ${project.clientName || "N/A"}\n`;
    consolidated += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    consolidated += `---\n\n`;

    if (project.proposalPdfUrl) {
      consolidated += `* [Download Proposal PDF](${project.proposalPdfUrl})\n`;
    }
    consolidated += `\n---\n\n`;

    if (project.estimateMarkdown) {
      consolidated += `# Part 1: Project Proposal\n\n${project.estimateMarkdown}\n\n---\n\n`;
    }
    if (project.researchMarkdown) {
      consolidated += `# Part 2: Research & Analysis\n\n${project.researchMarkdown}\n\n---\n\n`;
    }
    if (project.vibecodeGuideA) {
      consolidated += `# Part 3: High-Code Execution Guide\n\n${project.vibecodeGuideA}\n\n---\n\n`;
    }
    if (project.vibecodeGuideB) {
      consolidated += `# Part 4: No-Code Execution Guide\n\n${project.vibecodeGuideB}\n\n---\n\n`;
    }
    if (project.pmBreakdown) {
      consolidated += `# Part 5: Project Management Breakdown\n\n${generatePMMarkdown(project.pmBreakdown as any)}\n`;
    }

    return consolidated;
  }, [
    project.title,
    project.clientName,
    project.estimateMarkdown,
    project.researchMarkdown,
    project.proposalPdfUrl,
    project.vibecodeGuideA,
    project.vibecodeGuideB,
    project.pmBreakdown,
  ]);

  const files = React.useMemo(
    () => [
      {
        name: "Proposal",
        icon: FileText,
        available: !!project.estimateMarkdown,
        content: project.estimateMarkdown || "",
        description: "Complete project proposal with estimates and ROI analysis",
        pdfUrl: project.proposalPdfUrl,
      },
      {
        name: "Research_Analysis",
        icon: FileText,
        available: !!project.researchMarkdown,
        content: project.researchMarkdown || "",
        description: "Deep dive market research and technical feasibility analysis",
        pdfUrl: null,
      },
      {
        name: "Internal_Report",
        icon: FileText,
        available: !!project.internalReportPdfUrl,
        content: "",
        description: "Internal project report with scenario comparison",
        pdfUrl: project.internalReportPdfUrl,
      },
      {
        name: "Guide_A_HighCode",
        icon: Code2,
        available: !!project.vibecodeGuideA,
        content: project.vibecodeGuideA || "",
        description: "High-code execution manual with prompts and best practices",
        pdfUrl: `/api/projects/${project.id}/execution-manual.pdf`,
      },
      {
        name: "Guide_B_NoCode",
        icon: Code2,
        available: !!project.vibecodeGuideB,
        content: project.vibecodeGuideB || "",
        description: "No-code execution manual with step-by-step instructions",
        pdfUrl: null,
      },
      {
        name: "PM_Breakdown",
        icon: ClipboardList,
        available: !!project.pmBreakdown,
        content: generatePMMarkdown(project.pmBreakdown as any),
        description: "Project management breakdown with phases, tasks, and checklists",
        pdfUrl: null,
      },
    ],
    [
      project.estimateMarkdown,
      project.researchMarkdown,
      project.proposalPdfUrl,
      project.internalReportPdfUrl,
      project.vibecodeGuideA,
      project.id,
      project.vibecodeGuideB,
      project.pmBreakdown,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6 text-primary" />
        <h2 className="text-lg font-semibold">Project Files</h2>
      </div>

      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Complete Project Package</p>
            <p className="text-xs text-muted-foreground mt-1">
              Markdown: All documents combined. PDF: Main proposal document.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => generateMarkdownFile("Complete", generateConsolidatedMarkdown())}
            data-testid="download-consolidated-md"
          >
            <Download className="h-4 w-4" />
            All (Markdown)
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-2"
            asChild
            data-testid="download-consolidated-pdf"
          >
            <a href={`/api/projects/${project.id}/consolidated.pdf`} download>
              <Download className="h-4 w-4" />
              Proposal (PDF)
            </a>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => {
          const Icon = file.icon;
          return (
            <Card key={file.name} className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{file.name.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {file.available && file.content ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => generateMarkdownFile(file.name, file.content)}
                    data-testid={`download-${file.name}-md`}
                  >
                    <Download className="h-4 w-4" />
                    Markdown
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex-1" disabled>
                    No Markdown
                  </Button>
                )}
                {file.available && file.pdfUrl ? (
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    asChild
                    data-testid={`download-${file.name}-pdf`}
                  >
                    <a href={file.pdfUrl} download>
                      <Download className="h-4 w-4" />
                      PDF
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" disabled>
                    No PDF
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function generatePMMarkdown(breakdown: any): string {
  if (!breakdown) return "";

  const phases = breakdown.phases || breakdown || [];
  if (!Array.isArray(phases)) return "";

  let md = "# Project Management Breakdown\n\n";

  phases.forEach((phase: any, index: number) => {
    md += `## Phase ${phase.phaseNumber || index + 1}: ${phase.phaseName}\n\n`;
    md += `**Duration:** ${phase.durationDays} days\n\n`;

    if (phase.objectives?.length) {
      md += "### Objectives\n";
      phase.objectives.forEach((obj: string) => {
        md += `- ${obj}\n`;
      });
      md += "\n";
    }

    if (phase.tasks?.length) {
      md += "### Tasks\n\n";
      phase.tasks.forEach((task: any) => {
        md += `#### ${task.name || task}\n`;
        if (task.description) md += `${task.description}\n`;
        if (task.estimatedHours) md += `**Estimated Hours:** ${task.estimatedHours}h\n`;

        if (task.checklist?.length) {
          md += "\n**Completion Checklist:**\n";
          task.checklist.forEach((item: any) => {
            md += `- [ ] ${item.action}\n`;
          });
        }
        md += "\n";
      });
    }

    if (phase.deliverables?.length) {
      md += "### Deliverables\n";
      phase.deliverables.forEach((del: string) => {
        md += `- ${del}\n`;
      });
      md += "\n";
    }

    md += "---\n\n";
  });

  return md;
}
