import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, FileText, Presentation, Code2, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StageProgress } from "@/components/stage-progress";
import { ChatInterface } from "@/components/chat-interface";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { ActionButtons } from "@/components/action-buttons";
import { ScenarioComparison } from "@/components/scenario-comparison";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, Scenario, ROIAnalysis } from "@shared/schema";

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
  const completedStages = Array.from(
    { length: currentStage - 1 },
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
              {project?.pmBreakdown && (
                <TabsTrigger value="pm" className="gap-2" data-testid="tab-pm">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">PM</span>
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
              <PMBreakdownView breakdown={project?.pmBreakdown as any} />
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

function PMBreakdownView({ breakdown }: { breakdown: any }) {
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
                {phase.tasks.map((task: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{task.name || task}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    {task.estimatedHours && (
                      <span className="text-xs text-muted-foreground">
                        {task.estimatedHours}h
                      </span>
                    )}
                  </div>
                ))}
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
    </div>
  );
}
