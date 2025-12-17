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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ServiceStatus } from "@shared/schema";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

const serviceIcons: Record<string, React.ElementType> = {
  gemini: Brain,
  claude: Code2,
  openai: Activity,
  pdf_co: FileText,
  resend: Mail,
  gamma: Presentation,
  nano_banana: Image,
};

const serviceDisplayNames: Record<string, string> = {
  gemini: "Gemini",
  claude: "Claude",
  openai: "OpenAI",
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

export function RightSidebar() {
  const { data: healthStatus, isLoading, refetch } = useQuery<ServiceStatus[]>({
    queryKey: ["/api/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/health"] });
  };

  const lastUpdated = healthStatus?.[0]?.lastChecked 
    ? format(new Date(healthStatus[0].lastChecked), "h:mm:ss a")
    : null;

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
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated}
          </p>
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
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="h-3.5 w-3.5" />
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}
