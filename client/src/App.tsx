import React, { useState, useEffect } from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { StageProgress } from './components/StageProgress';
import { ChatPanel } from './components/ChatPanel';
import { DocTabs } from './components/DocTabs';
import { Button, Skeleton } from './components/ui/UIComponents';
import { Message } from './types';
import { LayoutDashboard, MessageSquare, FileText, RefreshCw, Wand2, AlertTriangle } from 'lucide-react';
import { cn } from './lib/utils';
import { useProjects, useProject, useSystemHealth, useProjectUsage, useProjectStages, useProjectDocuments, useStartStage } from './lib/queries';
import { api } from './lib/api';

// --- Dashboard Component ---
const Dashboard = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-background">
      <div className="p-4 rounded-full bg-card border border-border">
        <LayoutDashboard className="w-12 h-12 text-muted-foreground/20" />
      </div>
      <p>Select a project to view details</p>
    </div>
  );
};

// --- Project View Component ---
const ProjectView = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');

  // Real Data Hooks
  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(id);
  const { data: stages, isLoading: isStagesLoading } = useProjectStages(id);
  const { data: docs } = useProjectDocuments(id);
  const startStageMutation = useStartStage();

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'system', content: 'ISI Agent initialized. Connected to Antigravity Backend.', timestamp: new Date().toISOString() }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Handle Streaming Chat
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      // Use existing /messages endpoint that works
      const response = await fetch(`/api/projects/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          role: 'user',
          stage: project?.currentStage || 0
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message from response
      if (data.assistantMessage) {
        setMessages(prev => [...prev, {
          id: data.assistantMessage.id || (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.assistantMessage.content,
          timestamp: data.assistantMessage.createdAt || new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Error: Could not connect to AI service. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAutoRun = async () => {
    if (!stages || stages.length === 0) return;

    // Find first stage that is not completed
    const nextStage = stages.find(s => s.status === 'todo');
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
            <Button variant="primary" size="sm" onClick={handleAutoRun} isLoading={startStageMutation.isPending}>
              <Wand2 className="w-3.5 h-3.5 mr-2" /> Auto-Run
            </Button>
          </div>
        </div>

        {isStagesLoading ? (
          <div className="p-4"><Skeleton className="h-12 w-full" /></div>
        ) : (
          <StageProgress stages={stages || []} />
        )}

        {/* Workspace Tabs */}
        <div className="flex px-6 gap-6 pt-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'chat' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4" /> AI Command
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'docs' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4" /> Documents & Assets
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-background">
        {activeTab === 'chat' ? (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
          />
        ) : (
          <DocTabs documents={docs || { proposal: '', report: '', guide: '' }} />
        )}
      </div>
    </div>
  );
};

// --- Main Layout ---
function MainLayout() {
  const [match, params] = useRoute<any>("/project/:id");
  const [isDark, setIsDark] = useState(true);

  // Global Data Hooks
  const { data: projects } = useProjects();
  const { data: health } = useSystemHealth();
  const { data: usage } = useProjectUsage();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Initial theme set
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
      <LeftSidebar
        projects={projects || []}
        activeProjectId={match && params ? params.id : undefined}
        onCreateProject={() => console.log("Open Create Dialog")}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 flex flex-col min-w-0 border-r border-border">
        <Switch>
          <Route path="/project/:id" component={ProjectView} />
          <Route path="/" component={Dashboard} />
          {/* Fallback to Dashboard for unknown routes? or 404 */}
          <Route component={Dashboard} />
        </Switch>
      </main>

      <RightSidebar
        health={health || []}
        usage={usage || { tokens: 0, cost: 0, storage: 0 }}
      />
    </div>
  );
}

// --- App Entry & Providers ---
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="isi-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MainLayout />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
