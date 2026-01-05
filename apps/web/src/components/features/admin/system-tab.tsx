import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui/UIComponents";
import { RotateCcw, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SystemTab() {
  const queryClient = useQueryClient();

  const resetHealthMutation = useMutation({
    mutationFn: api.resetSystemHealth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
      alert("System health logs reset.");
    },
  });

  return (
    <div className="space-y-4">
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>System Maintenance</AlertTitle>
        <AlertDescription>Manage system logs and operational status.</AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 flex flex-col items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">API Health Logs</h3>
            <p className="text-sm text-muted-foreground">Clear all latency and error history.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Confirm reset of all API health logs?")) resetHealthMutation.mutate();
            }}
            isLoading={resetHealthMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Logs
          </Button>
        </Card>
      </div>
    </div>
  );
}
