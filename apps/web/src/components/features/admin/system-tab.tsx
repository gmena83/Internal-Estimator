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

        <Card className="p-6 flex flex-col items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">System Tests</h3>
            <p className="text-sm text-muted-foreground">Run the full test suite.</p>
          </div>
          <TestRunner />
        </Card>
      </div>
    </div>
  );
}

function TestRunner() {
  const [output, setOutput] = React.useState<string | null>(null);

  const runTestsMutation = useMutation({
    mutationFn: api.runTests,
    onSuccess: (data) => {
      setOutput(data.output || "Tests completed with no output.");
      if (!data.success) {
        alert("Tests failed! Check output.");
      }
    },
    onError: (err) => {
      setOutput(`Error running tests: ${err.message}`);
    },
  });

  return (
    <div className="w-full space-y-2">
      <Button
        variant="default"
        onClick={() => runTestsMutation.mutate()}
        isLoading={runTestsMutation.isPending}
        className="w-full"
      >
        <Activity className="w-4 h-4 mr-2" /> Run Full Test
      </Button>

      {output && (
        <div className="mt-4 p-2 bg-slate-950 text-slate-50 font-mono text-xs rounded h-48 overflow-auto whitespace-pre-wrap">
          {output}
        </div>
      )}

      {runTestsMutation.isPending && (
        <div className="text-xs text-muted-foreground animate-pulse">
          Running test suite (this may take a minute)...
        </div>
      )}
    </div>
  );
}
