import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/UIComponents";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeEntry {
  id: string;
  projectId: string | null;
  category: string;
  content: string;
  metadata: any;
  createdAt: string;
}

export const LearningsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: learnings, isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ["/api/knowledge-base", { category: "approved_estimate" }],
    queryFn: async () => {
      const res = await fetch("/api/knowledge-base?category=approved_estimate");
      if (!res.ok) throw new Error("Failed to fetch learnings");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/files/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({
        title: "Learning deleted",
        description: "The learned estimate has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete learning.",
        variant: "destructive",
      });
    },
  });

  const filteredLearnings = learnings?.filter((l) =>
    l.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Approved Estimates (Context Injection)</h3>
          <p className="text-sm text-muted-foreground">
            These examples are injected into the AI prompt to guide future pricing logic.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search learnings..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading learnings...</div>
        ) : !filteredLearnings?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-50" />
              <p>No learned estimates found yet.</p>
              <p className="text-sm">Approve an estimate in a project to add it here.</p>
            </CardContent>
          </Card>
        ) : (
          filteredLearnings.map((learning) => (
            <Card key={learning.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">
                        Project ID:{" "}
                        {learning.metadata?.sourceProjectId || learning.projectId || "Unknown"}
                      </CardTitle>
                      <CardDescription>
                        Learned on {format(new Date(learning.createdAt), "PPP")}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this learning example?")) {
                        deleteMutation.mutate(learning.id);
                      }
                    }}
                    isLoading={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {learning.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
