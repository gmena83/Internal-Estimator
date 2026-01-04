import React, { useState } from "react";
import { RefreshCw, Wand2, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Skeleton } from "@/components/ui/UIComponents";
import { StageProgress } from "@/components/features/project/stage-progress";
import { ChatPanel } from "@/components/features/chat/chat-panel";
import { DocTabs } from "@/components/features/project/doc-tabs";
import { useProject, useProjectStages, useProjectDocuments, useStartStage } from "@/lib/queries";
import { Message } from "@/types";

interface ProjectViewProps {
  params: { id: string };
}

export const ProjectView = ({ params }: ProjectViewProps) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState<"chat" | "docs">("chat");

  // Real Data Hooks
  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(id);
  const { data: stages, isLoading: isStagesLoading } = useProjectStages(id);
  const { data: docs } = useProjectDocuments(id);
  const startStageMutation = useStartStage();

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "system",
      content: "ISI Agent initialized. Connected to Antigravity Backend.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Handle Streaming Chat
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch(`/api/projects/${id}/messages?stream=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          content,
          role: "user",
          stage: project?.currentStage || 0,
        }),
      });

      if (!response.ok) throw new Error(`Request failed`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace("data: ", "").trim();

          if (dataStr === "[DONE]") break;

          try {
            const data = JSON.parse(dataStr);
            if (data.content) {
              fullText += data.content;
              // Update only the last message content
              setMessages((prev: Message[]) => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0) {
                  newMessages[lastIdx] = { ...newMessages[lastIdx], content: fullText };
                }
                return newMessages;
              });
            }
          } catch (e) {
            console.error("Parse error in stream:", e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "system",
          content: "Error: Could not connect to AI service.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAutoRun = async () => {
    if (!stages || stages.length === 0) return;

    // Find first stage that is not completed
    const nextStage = stages.find((s) => s.status === "todo");
    if (nextStage) {
      await startStageMutation.mutateAsync({ projectId: id, stageId: nextStage.id });
    }
  };

  if (isProjectLoading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-background">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-destructive bg-background">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p>Project not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 transition-colors duration-300">
      {/* Top Bar: Stages & Actions */}
      <div className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-2 border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-foreground">{project.name}</h2>
            <span className="text-[10px] text-muted-foreground uppercase">{project.client}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAutoRun}
              isLoading={startStageMutation.isPending}
            >
              <Wand2 className="w-3.5 h-3.5 mr-2" /> Auto-Run
            </Button>
          </div>
        </div>

        {isStagesLoading ? (
          <div className="p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <StageProgress stages={stages || []} />
        )}

        {/* Workspace Tabs */}
        <div className="flex px-6 gap-6 pt-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2",
              activeTab === "chat"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground",
            )}
          >
            <MessageSquare className="w-4 h-4" /> AI Command
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2",
              activeTab === "docs"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground",
            )}
          >
            <FileText className="w-4 h-4" /> Documents & Assets
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-background">
        {activeTab === "chat" ? (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
          />
        ) : (
          <DocTabs documents={docs || { proposal: "", report: "", guide: "" }} />
        )}
      </div>
    </div>
  );
};
