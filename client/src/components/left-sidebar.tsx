import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { ServiceStatus, ProjectApiUsageStats } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Activity, RefreshCw, DollarSign, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

interface LeftSidebarProps {
  selectedProjectId: string | null;
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

export function LeftSidebar({ selectedProjectId, onNewProject }: LeftSidebarProps) {
  // State removed as it was moved to RightSidebar

  const queryClient = useQueryClient();
  // Handler removed

  const { data: apiHealth, isLoading: healthLoading } = useQuery<ServiceStatus[]>({
    queryKey: ["/api/health"],
    refetchInterval: 30000, // Check every 30s
  });

  const { data: usageStats } = useQuery<ProjectApiUsageStats[]>({
    queryKey: [`/api/projects/${selectedProjectId}/usage`],
    enabled: !!selectedProjectId,
  });

  const checkHealthMutation = useMutation({
    mutationFn: async (service: string) => {
      const res = await apiRequest("POST", `/api/health/check/${service}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
    },
  });

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-[280px]">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">ISI</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">ISI Agent</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Intelligent Strategy Interface
              </span>
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
        <Button variant="outline" className="w-full mt-2" asChild data-testid="link-diagnostician">
          <Link href="/diagnostician">
            <Search className="h-4 w-4 mr-2" />
            Repo Diagnostician
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* API Health & Usage Section */}
        <div className="mt-auto px-4 py-3 border-t border-sidebar-border bg-sidebar/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              System Status
            </h3>
            {healthLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          <ScrollArea className="max-h-[150px] pr-2">
            <div className="space-y-2">
              {apiHealth?.map((service) => (
                <div
                  key={service.service}
                  className="flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        service.status === "online"
                          ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"
                          : service.status === "degraded"
                            ? "bg-yellow-500"
                            : "bg-red-500",
                      )}
                    />
                    <span className="font-medium text-sidebar-foreground">
                      {service.displayName}
                    </span>
                  </div>

                  {service.status !== "online" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-transparent"
                            onClick={() => checkHealthMutation.mutate(service.service)}
                            disabled={checkHealthMutation.isPending}
                          >
                            <RefreshCw
                              className={cn(
                                "h-3 w-3 text-muted-foreground hover:text-foreground",
                                checkHealthMutation.isPending && "animate-spin",
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fix Connection</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
            </div>

            {/* Project Usage Stats */}
            {selectedProjectId && usageStats && usageStats.length > 0 && (
              <div className="mt-3 pt-3 border-t border-sidebar-border/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Project Cost
                  </span>
                  <span className="font-medium">
                    ${usageStats.reduce((acc, curr) => acc + curr.totalCostUsd, 0).toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Tokens
                  </span>
                  <span className="font-medium">
                    {usageStats.reduce((acc, curr) => acc + curr.totalTokens, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
