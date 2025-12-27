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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ServiceStatus } from "@shared/schema";
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

interface RightSidebarProps {
  projectId?: string | null;
}

export function RightSidebar({ projectId }: RightSidebarProps) {
  const {
    data: healthStatus,
    isLoading,
    refetch,
  } = useQuery<ServiceStatus[]>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  const { data: usageStats, isLoading: usageLoading } = useQuery<ApiUsageStat[]>({
    queryKey: ["/api/projects", projectId, "usage"],
    enabled: !!projectId,
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/health"] });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "usage"] });
    }
  };

  const lastUpdated = healthStatus?.[0]?.lastChecked
    ? (() => {
      const date = new Date(healthStatus[0].lastChecked);
      return isNaN(date.getTime()) ? null : format(date, "h:mm:ss a");
    })()
    : null;

  const totalCost = usageStats?.reduce((sum, stat) => sum + stat.totalCostUsd, 0) || 0;
  const totalTokens = usageStats?.reduce((sum, stat) => sum + stat.totalTokens, 0) || 0;

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-sidebar-foreground">System Health</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              data-testid="button-refresh-health"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading ? (
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
        </div>

        {projectId && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-sidebar-foreground">Project API Costs</h3>
            </div>

            {usageLoading ? (
              <Card className="p-3">
                <Skeleton className="h-12 w-full" />
              </Card>
            ) : usageStats && usageStats.length > 0 ? (
              <div className="space-y-2">
                <Card className="p-3 bg-accent/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Total Cost</span>
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
                          {stat.displayName || serviceDisplayNames[stat.provider] || stat.provider}
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
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3.5 w-3.5" />
            <span>All systems operational</span>
          </div>
          {projectId && totalCost > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              ${totalCost.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
