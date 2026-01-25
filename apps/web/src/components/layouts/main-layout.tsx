import React, { useState, useEffect } from "react";
import { Switch, Route, useRoute, useLocation } from "wouter";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { Dashboard } from "./dashboard";
import { AdminDashboard } from "../../pages/admin-dashboard";
import { ProjectView } from "./project-view";
import { useProjects, useSystemHealth, useProjectUsage } from "../../lib/queries";
import { NewProjectDialog } from "../features/project/new-project-dialog";

export function MainLayout() {
  const [match, params] = useRoute<any>("/project/:id");
  const [location, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);

  // Global Data Hooks
  const { data: projects } = useProjects();
  const { data: health } = useSystemHealth();
  const { data: usage } = useProjectUsage();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Initial theme set
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
      <LeftSidebar
        projects={projects || []}
        activeProjectId={match && params ? params.id : undefined}
        onCreateProject={() => setCreateOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 flex flex-col min-w-0 border-r border-border">
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/project/:id" component={ProjectView} />
          <Route path="/" component={Dashboard} />
          <Route component={Dashboard} />
        </Switch>
      </main>

      <RightSidebar health={health || []} usage={usage || { tokens: 0, cost: 0, storage: 0 }} />

      <NewProjectDialog
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        onProjectCreated={(id) => setLocation(`/project/${id}`)}
      />
    </div>
  );
}
