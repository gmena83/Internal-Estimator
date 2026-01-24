import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wifi,
  WifiOff,
  Activity,
  Brain,
  Code2,
  FileText,
  Mail,
  Presentation,
  Image,
  RefreshCw,
  Search,
  DollarSign,
  Zap,
  Clock,
  Archive,
  FolderOpen,
  Download,
  ClipboardList,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ServiceStatus, Project } from "@shared/schema";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface ApiUsageStat {
  provider: string;
  displayName: string;
  model: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  callCount: number;
}

const serviceIcons: Record<string, React.ElementType> = {
  gemini: Brain,
  claude: Code2,
  openai: Activity,
  perplexity: Search,
  pdf_co: FileText,
  resend: Mail,
  gamma: Presentation,
  nano_banana: Image,
};

const serviceDisplayNames: Record<string, string> = {
  gemini: "Gemini",
  claude: "Claude",
  openai: "OpenAI",
  perplexity: "Perplexity",
  pdf_co: "PDF.co",
  resend: "Resend",
  gamma: "Gamma",
  nano_banana: "Nano Banana",
};

const statusColors: Record<string, string> = {
  online: "text-status-online",
  degraded: "text-status-away",
  offline: "text-status-busy",
  unknown: "text-status-offline",
};

const statusBgColors: Record<string, string> = {
  online: "bg-status-online",
  degraded: "bg-status-away",
  offline: "bg-status-busy",
  unknown: "bg-status-offline",
};

const projectStatusColors: Record<string, string> = {
  draft: "text-muted-foreground",
  estimate_generated: "text-chart-1",
  assets_ready: "text-chart-2",
  email_sent: "text-chart-3",
  accepted: "text-chart-4",
  in_progress: "text-chart-5",
  completed: "text-primary",
};

interface RightSidebarProps {
  projectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
}

export function RightSidebar({ projectId, onSelectProject }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<"health" | "projects">("projects");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedFilesProject, setSelectedFilesProject] = useState<Project | null>(null);

  const {
    data: healthStatus,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useQuery<ServiceStatus[]>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  const { data: usageStats, isLoading: usageLoading } = useQuery<ApiUsageStat[]>({
    queryKey: ["/api/projects", projectId, "usage"],
    enabled: !!projectId,
  });

  const { data: recentProjects, isLoading: recentLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/recent"],
    refetchInterval: 5000,
  });

  const { data: allProjects, isLoading: allLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const handleRefresh = () => {
    refetchHealth();
    queryClient.invalidateQueries({ queryKey: ["/api/health"] });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "usage"] });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/projects/recent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
  };

  const handleOpenFiles = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedFilesProject(project);
    setFilesDialogOpen(true);
  };

  const filteredProjects = allProjects?.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(historySearchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesStage =
      stageFilter === "all" || project.currentStage === parseInt(stageFilter, 10);
    return matchesSearch && matchesStatus && matchesStage;
  });

  const lastUpdated = healthStatus?.[0]?.lastChecked
    ? format(new Date(healthStatus[0].lastChecked), "h:mm:ss a")
    : null;

  const totalCost = usageStats?.reduce((sum, stat) => sum + stat.totalCostUsd, 0) || 0;
  const totalTokens = usageStats?.reduce((sum, stat) => sum + stat.totalTokens, 0) || 0;

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "projects" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("projects")}
              className="text-xs"
            >
              Projects
            </Button>
            <Button
              variant={activeTab === "health" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("health")}
              className="text-xs"
            >
              System
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              data-testid="button-refresh-sidebar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5" />
                Recent Projects
              </h3>
              <div className="space-y-1">
                {recentLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-2 rounded-lg">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : recentProjects?.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">No recent projects.</div>
                ) : (
                  recentProjects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onSelectProject?.(project.id)}
                      className={`w-full text-left p-2 rounded-lg transition-colors hover:bg-sidebar-accent/50 group ${
                        projectId === project.id ? "bg-sidebar-accent" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{project.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 h-4 ${projectStatusColors[project.status]}`}
                            >
                              {project.status.replace("_", " ")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {project.updatedAt
                                ? format(new Date(project.updatedAt), "MMM d")
                                : ""}
                            </span>
                          </div>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-background/80 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleOpenFiles(e, project)}
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-sidebar-border">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Archive className="h-3.5 w-3.5" />
                All Projects
              </h3>
              <div className="space-y-2 mb-3">
                <Input
                  placeholder="Search..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="estimate_generated">Estimated</SelectItem>
                      <SelectItem value="assets_ready">Assets</SelectItem>
                      <SelectItem value="email_sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="h-7 text-xs w-[80px]">
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                {allLoading ? (
                  <div className="p-2 text-center text-xs text-muted-foreground">Loading...</div>
                ) : filteredProjects?.length === 0 ? (
                  <div className="p-2 text-center text-xs text-muted-foreground">
                    No projects found.
                  </div>
                ) : (
                  filteredProjects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onSelectProject?.(project.id)}
                      className={`w-full text-left p-2 rounded-lg transition-colors hover:bg-sidebar-accent/50 ${
                        projectId === project.id ? "bg-sidebar-accent" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium truncate">{project.title}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          S{project.currentStage}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "health" && (
          <div className="space-y-3">
            {healthLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </Card>
              ))
            ) : healthStatus?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No health data available</p>
              </div>
            ) : (
              healthStatus?.map((service) => {
                const Icon = serviceIcons[service.service] || Activity;
                return (
                  <Card
                    key={service.service}
                    className="p-3"
                    data-testid={`card-service-${service.service}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {serviceDisplayNames[service.service] || service.service}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${statusBgColors[service.status]}`}
                            />
                            <span className={`text-xs capitalize ${statusColors[service.status]}`}>
                              {service.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {service.latencyMs !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {service.latencyMs}ms
                            </span>
                          )}
                          {service.requestCount !== undefined && service.requestCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {service.requestCount} calls
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}

            {projectId && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-sidebar-foreground">
                    Project API Costs
                  </h3>
                </div>

                {usageLoading ? (
                  <Card className="p-3">
                    <Skeleton className="h-12 w-full" />
                  </Card>
                ) : usageStats && usageStats.length > 0 ? (
                  <div className="space-y-2">
                    <Card className="p-3 bg-accent/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Total Cost
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          ${totalCost.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Total Tokens</span>
                        <span className="text-xs font-medium">{totalTokens.toLocaleString()}</span>
                      </div>
                    </Card>

                    {usageStats.map((stat, idx) => {
                      const Icon = serviceIcons[stat.provider] || Zap;
                      return (
                        <Card key={idx} className="p-2" data-testid={`card-usage-${stat.provider}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium truncate flex-1">
                              {stat.displayName ||
                                serviceDisplayNames[stat.provider] ||
                                stat.provider}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              ${stat.totalCostUsd.toFixed(4)}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground ml-5">
                            <span>{stat.model}</span>
                            <span className="mx-1.5">|</span>
                            <span>{stat.totalTokens.toLocaleString()} tokens</span>
                            <span className="mx-1.5">|</span>
                            <span>{stat.callCount} calls</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-xs">
                    <Zap className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p>No API usage yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          {activeTab === "health" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5" />
              <span>{lastUpdated ? `Updated ${lastUpdated}` : "System Operational"}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {allProjects?.length || 0} Total Projects
            </span>
          )}

          {projectId && totalCost > 0 && activeTab === "health" && (
            <span className="text-xs font-medium text-muted-foreground">
              ${totalCost.toFixed(4)}
            </span>
          )}
        </div>
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
              selectedFilesProject &&
              getProjectFiles(selectedFilesProject).map((file, index) => (
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
                    <Button size="icon" variant="ghost" asChild>
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
    </div>
  );
}

// Helper to reused project files logic
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
