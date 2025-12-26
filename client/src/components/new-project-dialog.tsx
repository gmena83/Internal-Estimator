import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (projectId: string) => void;
}

export function NewProjectDialog({ open, onOpenChange, onProjectCreated }: NewProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [rawInput, setRawInput] = useState("");
  const { toast } = useToast();

  const createProject = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects", {
        title: title.trim() || "Untitled Project",
        clientName: clientName.trim() || undefined,
        rawInput: rawInput.trim() || undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/recent"] });
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
      onOpenChange(false);
      onProjectCreated(data.id);
      setTitle("");
      setClientName("");
      setRawInput("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start a new project estimate by providing the basic details and pasting client
            information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., E-commerce Platform Redesign"
              data-testid="input-project-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name (Optional)</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corp"
              data-testid="input-client-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rawInput">Client Email / Meeting Notes (Optional)</Label>
            <Textarea
              id="rawInput"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste the client email, meeting transcript, or notes here..."
              className="min-h-32"
              data-testid="input-raw-input"
            />
            <p className="text-xs text-muted-foreground">
              You can also add this later through the chat interface.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending}
              data-testid="button-create-project"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
