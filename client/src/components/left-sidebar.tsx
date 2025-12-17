import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Archive, FolderOpen, Plus, Filter } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

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
            <span className="font-semibold text-sidebar-foreground">ISI Agent</span>
          </div>
        </div>
        <Button
          onClick={onNewProject}
          className="w-full"
          data-testid="button-new-project"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
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
                    <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
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
