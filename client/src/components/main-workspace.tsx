import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, FileText, Presentation, Code2, ClipboardList, Paperclip, Download, FileIcon, Image, FolderOpen, CheckCircle2, Circle, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StageProgress } from "@/components/stage-progress";
import { ChatInterface } from "@/components/chat-interface";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { ActionButtons } from "@/components/action-buttons";
import { ScenarioComparison } from "@/components/scenario-comparison";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, Scenario, ROIAnalysis, Attachment, PMTaskChecklistItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

interface MainWorkspaceProps {
  projectId: string | null;
}

export function MainWorkspace({ projectId }: MainWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("chat");

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const selectScenario = useMutation({
    mutationFn: async (scenario: "A" | "B") => {
      return await apiRequest("POST", `/api/projects/${projectId}/select-scenario`, {
        scenario,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  if (!projectId) {
    return (
      <div className="flex flex-col h-full">
        <ChatInterface projectId={null} />
      </div>
    );
  }

  const currentStage = project?.currentStage || 1;
  // When project is complete, include stage 5 in completed stages
  const isProjectComplete = project?.status === "complete";
  const completedStages = Array.from(
    { length: isProjectComplete ? 5 : currentStage - 1 },
    (_, i) => i + 1
  );

  const scenarioA = project?.scenarioA as Scenario | null;
  const scenarioB = project?.scenarioB as Scenario | null;
  const roiAnalysis = project?.roiAnalysis as ROIAnalysis | null;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-background">
        <div className="px-6 pt-4">
          {isLoading ? (
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          ) : project ? (
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-xl font-semibold">{project.title}</h1>
              {project.clientName && (
                <span className="text-sm text-muted-foreground">
                  for {project.clientName}
                </span>
              )}
            </div>
          ) : null}
          <StageProgress
            currentStage={currentStage}
            completedStages={completedStages}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="h-auto p-1 gap-1">
              <TabsTrigger value="chat" className="gap-2" data-testid="tab-chat">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              {project?.estimateMarkdown && (
                <TabsTrigger value="estimate" className="gap-2" data-testid="tab-estimate">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Estimate</span>
                </TabsTrigger>
              )}
              {(scenarioA || scenarioB) && (
                <TabsTrigger value="scenarios" className="gap-2" data-testid="tab-scenarios">
                  <Presentation className="h-4 w-4" />
                  <span className="hidden sm:inline">Scenarios</span>
                </TabsTrigger>
              )}
              {(project?.vibecodeGuideA || project?.vibecodeGuideB) && (
                <TabsTrigger value="guides" className="gap-2" data-testid="tab-guides">
                  <Code2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Guides</span>
                </TabsTrigger>
              )}
              {!!project?.pmBreakdown && (
                <TabsTrigger value="pm" className="gap-2" data-testid="tab-pm">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">PM</span>
                </TabsTrigger>
              )}
              {((project?.attachments as Attachment[] | null)?.length ?? 0) > 0 && (
                <TabsTrigger value="docs" className="gap-2" data-testid="tab-docs">
                  <Paperclip className="h-4 w-4" />
                  <span className="hidden sm:inline">Docs</span>
                </TabsTrigger>
              )}
              {project?.status === 'complete' && (
                <TabsTrigger value="files" className="gap-2" data-testid="tab-files">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Files</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="chat" className="h-full m-0 data-[state=inactive]:hidden">
            <ChatInterface projectId={projectId} />
          </TabsContent>

          <TabsContent value="estimate" className="h-full m-0 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6">
              <MarkdownViewer content={project?.estimateMarkdown} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="h-full m-0 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6">
              <ScenarioComparison
                scenarioA={scenarioA}
                scenarioB={scenarioB}
                roiAnalysis={roiAnalysis}
                selectedScenario={project?.selectedScenario || null}
                onSelectScenario={(scenario) => selectScenario.mutate(scenario)}
              />
            </div>
          </TabsContent>

          <TabsContent value="guides" className="h-full m-0 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6 space-y-6">
              {project?.vibecodeGuideA && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Manual A: High-Code Approach
                  </h3>
                  <MarkdownViewer content={project.vibecodeGuideA} />
                </Card>
              )}
              {project?.vibecodeGuideB && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Manual B: No-Code Approach
                  </h3>
                  <MarkdownViewer content={project.vibecodeGuideB} />
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pm" className="h-full m-0 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6">
              <PMBreakdownView 
                breakdown={project?.pmBreakdown as any} 
                project={project}
                onApproval={() => setActiveTab("files")}
              />
            </div>
          </TabsContent>

          <TabsContent value="docs" className="h-full m-0 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6">
              <DocumentsView attachments={(project?.attachments as Attachment[]) || []} />
            </div>
          </TabsContent>

          <TabsContent value="files" className="h-full m-0 overflow-auto data-[state=inactive]:hidden">
            <div className="p-6">
              <ProjectFilesView project={project} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-border bg-background p-4">
        <ActionButtons
          project={project}
          currentStage={currentStage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function PMBreakdownView({ breakdown, project, onApproval }: { breakdown: any; project?: Project; onApproval?: () => void }) {
  const { toast } = useToast();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const finalApproval = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/final-approval`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Project Completed",
        description: "All documents are now available in the Files tab.",
      });
      onApproval?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!breakdown) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No project management breakdown available yet.
      </div>
    );
  }

  const phases = breakdown.phases || breakdown || [];

  if (!Array.isArray(phases) || phases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No phases defined in the breakdown.
      </div>
    );
  }

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {phases.map((phase: any, index: number) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">{phase.phaseNumber || index + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold">{phase.phaseName}</h3>
              <p className="text-sm text-muted-foreground">
                {phase.durationDays} days
              </p>
            </div>
          </div>

          {phase.objectives && phase.objectives.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Objectives</p>
              <ul className="list-disc ml-6 space-y-1">
                {phase.objectives.map((obj: string, i: number) => (
                  <li key={i} className="text-sm">{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {phase.tasks && phase.tasks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Tasks</p>
              <div className="space-y-2">
                {phase.tasks.map((task: any, i: number) => {
                  const taskId = task.id || `${index}-${i}`;
                  const isExpanded = expandedTasks.has(taskId);
                  const checklist = task.checklist || [];
                  
                  return (
                    <Collapsible key={i} open={isExpanded} onOpenChange={() => toggleTask(taskId)}>
                      <div className="rounded-lg bg-muted overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button
                            className="w-full p-3 flex items-center justify-between text-left hover-elevate"
                            data-testid={`task-${taskId}`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{task.name || task}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {checklist.length > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3" />
                                  {checklist.length} items
                                </span>
                              )}
                              {task.estimatedHours && (
                                <span className="text-xs text-muted-foreground">
                                  {task.estimatedHours}h
                                </span>
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {checklist.length > 0 && (
                            <div className="px-3 pb-3 pt-1 border-t border-border/50">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Completion Checklist:</p>
                              <div className="space-y-2">
                                {checklist.map((item: PMTaskChecklistItem, ci: number) => (
                                  <div key={ci} className="flex items-start gap-2">
                                    <Checkbox
                                      id={`check-${taskId}-${ci}`}
                                      checked={item.completed}
                                      className="mt-0.5"
                                    />
                                    <label
                                      htmlFor={`check-${taskId}-${ci}`}
                                      className="text-xs text-muted-foreground cursor-pointer"
                                    >
                                      {item.action}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {phase.deliverables && phase.deliverables.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Deliverables</p>
              <div className="flex flex-wrap gap-2">
                {phase.deliverables.map((del: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-primary/10 text-primary text-xs"
                  >
                    {del}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}

      {project && project.status !== 'complete' && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => finalApproval.mutate()}
            disabled={finalApproval.isPending}
            className="gap-2"
            data-testid="btn-final-approval"
          >
            <CheckCircle2 className="h-5 w-5" />
            {finalApproval.isPending ? "Processing..." : "Final Approval"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ProjectFilesView({ project }: { project?: Project }) {
  if (!project || project.status !== 'complete') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Project files will be available after final approval.</p>
      </div>
    );
  }

  const safeName = project.title.replace(/[^a-zA-Z0-9]/g, '_');

  const generateMarkdownFile = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateConsolidatedMarkdown = () => {
    let consolidated = `# ${project.title} - Complete Project Documentation\n\n`;
    consolidated += `**Client:** ${project.clientName || 'N/A'}\n`;
    consolidated += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    consolidated += `---\n\n`;
    
    if (project.estimateMarkdown) {
      consolidated += `# Part 1: Project Proposal\n\n${project.estimateMarkdown}\n\n---\n\n`;
    }
    if (project.vibecodeGuideA) {
      consolidated += `# Part 2: High-Code Execution Guide\n\n${project.vibecodeGuideA}\n\n---\n\n`;
    }
    if (project.vibecodeGuideB) {
      consolidated += `# Part 3: No-Code Execution Guide\n\n${project.vibecodeGuideB}\n\n---\n\n`;
    }
    if (project.pmBreakdown) {
      consolidated += `# Part 4: Project Management Breakdown\n\n${generatePMMarkdown(project.pmBreakdown as any)}\n`;
    }
    
    return consolidated;
  };

  const files = [
    {
      name: "Proposal",
      icon: FileText,
      available: !!project.estimateMarkdown,
      content: project.estimateMarkdown || "",
      description: "Complete project proposal with estimates and ROI analysis",
      pdfUrl: project.proposalPdfUrl,
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
  ];

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
            <p className="text-xs text-muted-foreground mt-1">Markdown: All documents combined. PDF: Main proposal document.</p>
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
                  <p className="font-medium text-sm">{file.name.replace(/_/g, ' ')}</p>
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

function generatePMMarkdown(breakdown: any): string {
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

function DocumentsView({ attachments }: { attachments: Attachment[] }) {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-8 w-8" />;
    }
    return <FileIcon className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Paperclip className="h-5 w-5" />
        Project Documents ({attachments.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="p-4" data-testid={`doc-${attachment.id}`}>
            <div className="flex items-start gap-3">
              <div className="text-muted-foreground">
                {getFileIcon(attachment.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" title={attachment.originalName}>
                  {attachment.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={attachment.url} download={attachment.originalName}>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
