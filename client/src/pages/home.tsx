import { useState } from "react";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { MainWorkspace } from "@/components/main-workspace";
import { NewProjectDialog } from "@/components/new-project-dialog";

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  const handleNewProject = () => {
    setNewProjectDialogOpen(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <LeftSidebar
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onNewProject={handleNewProject}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <MainWorkspace projectId={selectedProjectId} />
      </div>

      <div className="w-72 flex-shrink-0">
        <RightSidebar projectId={selectedProjectId} />
      </div>

      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
