import React from "react";
import { useSystemHealth, useProjects } from "../../lib/queries";
import { Card, Badge } from "@/components/ui/UIComponents"; // Assuming these exist as they are in other files
import { Activity, CheckCircle, AlertTriangle, XCircle, Plus } from "lucide-react";

export const Dashboard = () => {
  const { data: health } = useSystemHealth();
  const { data: projects } = useProjects();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "degraded":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "down":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header / Greeting */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {getGreeting()}, Admin
          </h1>
          <p className="text-muted-foreground text-lg">
            System is operational. You have {projects?.length || 0} active projects.
          </p>
        </div>

        {/* System Status Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Live System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health?.map((item) => (
              <Card
                key={item.provider}
                className="p-4 border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">{item.provider}</span>
                  {getStatusIcon(item.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={`capitalize ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">{item.latency}ms</span>
                  </div>
                  {item.errorRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Error Rate</span>
                      <span className="text-red-500 font-mono">
                        {(item.errorRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {(!health || health.length === 0) && (
              <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-lg border-border">
                Loading system status...
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips / Empty State */}
        {(!projects || projects.length === 0) && (
          <div className="p-6 rounded-lg bg-muted/30 border border-border text-center">
            <h3 className="font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first estimation project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
