import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, PMTaskChecklistItem } from "@shared/schema";

interface PMBreakdownViewProps {
  breakdown: any;
  project?: Project;
  onApproval?: () => void;
}

export function PMBreakdownView({ breakdown, project, onApproval }: PMBreakdownViewProps) {
  const { toast } = useToast();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const finalApproval = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/final-approval`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Project Completed",
        description: "All documents are now available in the Files tab.",
      });
      onApproval?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!breakdown) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No project management breakdown available yet.
      </div>
    );
  }

  const phases = breakdown.phases || breakdown || [];

  if (!Array.isArray(phases) || phases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No phases defined in the breakdown.
      </div>
    );
  }

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {phases.map((phase: any, index: number) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">{phase.phaseNumber || index + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold">{phase.phaseName}</h3>
              <p className="text-sm text-muted-foreground">{phase.durationDays} days</p>
            </div>
          </div>

          {phase.objectives && phase.objectives.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Objectives</p>
              <ul className="list-disc ml-6 space-y-1">
                {phase.objectives.map((obj: string, i: number) => (
                  <li key={i} className="text-sm">
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase.tasks && phase.tasks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Tasks</p>
              <div className="space-y-2">
                {phase.tasks.map((task: any, i: number) => {
                  const taskId = task.id || `${index}-${i}`;
                  const isExpanded = expandedTasks.has(taskId);
                  const checklist = task.checklist || [];

                  return (
                    <Collapsible key={i} open={isExpanded} onOpenChange={() => toggleTask(taskId)}>
                      <div className="rounded-lg bg-muted overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button
                            className="w-full p-3 flex items-center justify-between text-left hover-elevate"
                            data-testid={`task-${taskId}`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{task.name || task}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {checklist.length > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3" />
                                  {checklist.length} items
                                </span>
                              )}
                              {task.estimatedHours && (
                                <span className="text-xs text-muted-foreground">
                                  {task.estimatedHours}h
                                </span>
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {checklist.length > 0 && (
                            <div className="px-3 pb-3 pt-1 border-t border-border/50">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Completion Checklist:
                              </p>
                              <div className="space-y-2">
                                {checklist.map((item: PMTaskChecklistItem, ci: number) => (
                                  <div key={ci} className="flex items-start gap-2">
                                    <Checkbox
                                      id={`check-${taskId}-${ci}`}
                                      checked={item.completed}
                                      className="mt-0.5"
                                    />
                                    <label
                                      htmlFor={`check-${taskId}-${ci}`}
                                      className="text-xs text-muted-foreground cursor-pointer"
                                    >
                                      {item.action}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {phase.deliverables && phase.deliverables.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Deliverables</p>
              <div className="flex flex-wrap gap-2">
                {phase.deliverables.map((del: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs">
                    {del}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}

      {project && project.status !== "complete" && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => finalApproval.mutate()}
            disabled={finalApproval.isPending}
            className="gap-2"
            data-testid="btn-final-approval"
          >
            <CheckCircle2 className="h-5 w-5" />
            {finalApproval.isPending ? "Processing..." : "Final Approval"}
          </Button>
        </div>
      )}
    </div>
  );
}
