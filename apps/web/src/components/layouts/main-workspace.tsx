import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MessageSquare,
  FileText,
  Presentation,
  Code2,
  ClipboardList,
  Paperclip,
  FolderOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { StageProgress } from "../features/project/stage-progress";
import { ChatInterface } from "../features/chat/chat-interface";
import { MarkdownViewer } from "../ui/markdown-viewer";
import { ActionButtons } from "../features/project/action-buttons";
import { ScenarioComparison } from "../features/estimate/scenario-comparison";
import { PMBreakdownView } from "../features/project/pm-breakdown-view";
import { ProjectFilesView } from "../features/project/project-files-view";
import { DocumentsView } from "../features/project/documents-view";
import { apiRequest, queryClient } from "../../lib/queryClient";
import type { Project, Scenario, ROIAnalysis, Attachment } from "@shared/schema";

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
    (_, i) => i + 1,
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
                <span className="text-sm text-muted-foreground">for {project.clientName}</span>
              )}
            </div>
          ) : null}
          <StageProgress currentStage={currentStage} completedStages={completedStages} />
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
              {project?.status === "complete" && (
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

          <TabsContent
            value="estimate"
            className="h-full m-0 overflow-auto data-[state=inactive]:hidden"
          >
            <div className="p-6">
              <MarkdownViewer content={project?.estimateMarkdown} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent
            value="scenarios"
            className="h-full m-0 overflow-auto data-[state=inactive]:hidden"
          >
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

          <TabsContent
            value="guides"
            className="h-full m-0 overflow-auto data-[state=inactive]:hidden"
          >
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

          <TabsContent
            value="docs"
            className="h-full m-0 overflow-auto data-[state=inactive]:hidden"
          >
            <div className="p-6">
              <DocumentsView attachments={(project?.attachments as Attachment[]) || []} />
            </div>
          </TabsContent>

          <TabsContent
            value="files"
            className="h-full m-0 overflow-auto data-[state=inactive]:hidden"
          >
            <div className="p-6">
              <ProjectFilesView project={project} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-border bg-background p-4">
        <ActionButtons project={project} currentStage={currentStage} isLoading={isLoading} />
      </div>
    </div>
  );
}
