import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Archive, FolderOpen, Plus, Filter, Search, FileText, Presentation, FileCode, ClipboardList, Download, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Project } from "@shared/schema";
import { format } from "date-fns";

interface ProjectFile {
  name: string;
  type: "pdf" | "presentation" | "guide" | "breakdown" | "estimate";
  url: string | null;
  createdAt: Date | null;
  icon: typeof FileText;
}

function getProjectFiles(project: Project): ProjectFile[] {
  const files: ProjectFile[] = [];
  
  if (project.estimateMarkdown) {
    files.push({
      name: "Project Estimate",
      type: "estimate",
      url: null,
      createdAt: project.updatedAt,
      icon: FileText,
    });
  }
  
  if (project.proposalPdfUrl) {
    files.push({
      name: "Proposal PDF",
      type: "pdf",
      url: project.proposalPdfUrl,
      createdAt: project.updatedAt,
      icon: FileText,
    });
  }
  
  if (project.internalReportPdfUrl) {
    files.push({
      name: "Internal Report PDF",
      type: "pdf",
      url: project.internalReportPdfUrl,
      createdAt: project.updatedAt,
      icon: FileText,
    });
  }
  
  if (project.presentationUrl) {
    files.push({
      name: "Client Presentation",
      type: "presentation",
      url: project.presentationUrl,
      createdAt: project.updatedAt,
      icon: Presentation,
    });
  }
  
  if (project.vibecodeGuideA) {
    files.push({
      name: "Manual A (High-Code)",
      type: "guide",
      url: null,
      createdAt: project.updatedAt,
      icon: FileCode,
    });
  }
  
  if (project.vibecodeGuideB) {
    files.push({
      name: "Manual B (No-Code)",
      type: "guide",
      url: null,
      createdAt: project.updatedAt,
      icon: FileCode,
    });
  }
  
  if (project.pmBreakdown) {
    files.push({
      name: "PM Breakdown",
      type: "breakdown",
      url: null,
      createdAt: project.updatedAt,
      icon: ClipboardList,
    });
  }
  
  return files;
}

interface LeftSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onNewProject: () => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  estimate_generated: "bg-chart-1/20 text-chart-1",
  assets_ready: "bg-chart-2/20 text-chart-2",
  email_sent: "bg-chart-3/20 text-chart-3",
  accepted: "bg-chart-4/20 text-chart-4",
  in_progress: "bg-chart-5/20 text-chart-5",
  completed: "bg-primary/20 text-primary",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  estimate_generated: "Estimated",
  assets_ready: "Assets Ready",
  email_sent: "Sent",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
};

export function LeftSidebar({ selectedProjectId, onSelectProject, onNewProject }: LeftSidebarProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedFilesProject, setSelectedFilesProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const handleOpenFiles = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedFilesProject(project);
    setFilesDialogOpen(true);
  };

  const { data: recentProjects, isLoading: recentLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/recent"],
  });

  const { data: allProjects, isLoading: allLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: historyOpen,
  });

  const filteredProjects = allProjects?.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesStage = stageFilter === "all" || project.currentStage === parseInt(stageFilter, 10);
    return matchesSearch && matchesStatus && matchesStage;
  });

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">ISI</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">ISI Agent</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Intelligent Strategy Interface</span>
            </div>
          </div>
        </div>
        <Button
          variant="glass-primary"
          onClick={onNewProject}
          className="w-full"
          data-testid="button-new-project"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
        <Button
          variant="outline"
          className="w-full mt-2"
          asChild
          data-testid="link-diagnostician"
        >
          <Link href="/diagnostician">
            <Search className="h-4 w-4 mr-2" />
            Repo Diagnostician
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Recent Projects
          </h3>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {recentLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : recentProjects?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              recentProjects?.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors hover-elevate active-elevate-2 ${
                    selectedProjectId === project.id
                      ? "bg-sidebar-accent ring-2 ring-inset ring-sidebar-ring"
                      : ""
                  }`}
                  data-testid={`button-project-${project.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {project.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {project.createdAt
                            ? format(new Date(project.createdAt), "MMM d")
                            : ""}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[project.status] || ""}`}
                        >
                          {statusLabels[project.status] || project.status}
                        </Badge>
                      </div>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-md hover-elevate active-elevate-2 cursor-pointer"
                      onClick={(e) => handleOpenFiles(e, project)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenFiles(e as unknown as React.MouseEvent, project);
                        }
                      }}
                      data-testid={`button-files-${project.id}`}
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {selectedFilesProject?.title || "Project"} Files
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedFilesProject && getProjectFiles(selectedFilesProject).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files generated yet. Complete workflow stages to generate assets.
              </div>
            ) : (
              selectedFilesProject && getProjectFiles(selectedFilesProject).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <file.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.createdAt
                          ? format(new Date(file.createdAt), "MMM d, yyyy 'at' h:mm a")
                          : "Generated"}
                      </p>
                    </div>
                  </div>
                  {file.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                    >
                      <a href={file.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-4 border-t border-sidebar-border">
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button
              variant="glass"
              className="w-full"
              data-testid="button-history"
            >
              <Archive className="h-4 w-4 mr-2" />
              History
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Project Archive</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px]"
                  data-testid="input-search-projects"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="estimate_generated">Estimated</SelectItem>
                    <SelectItem value="assets_ready">Assets Ready</SelectItem>
                    <SelectItem value="email_sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-stage-filter">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="1">Stage 1</SelectItem>
                    <SelectItem value="2">Stage 2</SelectItem>
                    <SelectItem value="3">Stage 3</SelectItem>
                    <SelectItem value="4">Stage 4</SelectItem>
                    <SelectItem value="5">Stage 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[55vh]">
                {allLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-lg border">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : filteredProjects?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No projects found matching your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredProjects?.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onSelectProject(project.id);
                          setHistoryOpen(false);
                        }}
                        className="text-left p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-colors"
                        data-testid={`button-archive-project-${project.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium truncate">{project.title}</h4>
                          <Badge
                            variant="secondary"
                            className={`text-xs flex-shrink-0 ${statusColors[project.status] || ""}`}
                          >
                            {statusLabels[project.status] || project.status}
                          </Badge>
                        </div>
                        {project.clientName && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {project.clientName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {project.createdAt
                            ? format(new Date(project.createdAt), "MMMM d, yyyy")
                            : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
