import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  FileCheck2, 
  RefreshCw, 
  Send, 
  ClipboardList, 
  FileText, 
  Presentation,
  Code2,
  Loader2,
  Download,
  FileJson,
  FileSpreadsheet,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface ActionButtonsProps {
  project: Project | null | undefined;
  currentStage: number;
  isLoading?: boolean;
}

export function ActionButtons({ project, currentStage, isLoading }: ActionButtonsProps) {
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState(project?.clientEmail || "");
  const [shouldSendAfterUpdate, setShouldSendAfterUpdate] = useState(false);

  const updateClientEmail = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", `/api/projects/${project?.id}/update-client-email`, { email });
      return email;
    },
    onSuccess: async (savedEmail: string) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      
      if (shouldSendAfterUpdate) {
        toast({
          title: "Email Updated",
          description: "Client email saved. Sending proposal...",
        });
        setShouldSendAfterUpdate(false);
        try {
          await sendEmailWithRecipient.mutateAsync(savedEmail);
          setEmailDialogOpen(false);
        } catch {
          setEmailDialogOpen(false);
        }
      } else {
        setEmailDialogOpen(false);
        toast({
          title: "Email Updated",
          description: "Client email saved.",
        });
      }
    },
    onError: (error) => {
      setShouldSendAfterUpdate(false);
      toast({
        title: "Error",
        description: error.message || "Failed to update client email",
        variant: "destructive",
      });
    },
  });

  const handleOpenEmailDialog = () => {
    setClientEmail(project?.clientEmail || "");
    setShouldSendAfterUpdate(true);
    setEmailDialogOpen(true);
  };

  const approveEstimate = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/approve-estimate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/recent"] });
      toast({
        title: "Estimate Approved",
        description: "Moving to production assets generation...",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve estimate",
        variant: "destructive",
      });
    },
  });

  const regenerateEstimate = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/regenerate-estimate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Regenerating",
        description: "Creating a new estimate...",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate estimate",
        variant: "destructive",
      });
    },
  });

  const generateAssets = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/generate-assets`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Assets Generated",
        description: "PDFs and presentation are ready!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate assets",
        variant: "destructive",
      });
    },
  });

  const sendEmailWithRecipient = useMutation({
    mutationFn: async (recipientEmail: string) => {
      return await apiRequest("POST", `/api/projects/${project?.id}/send-email`, { recipientEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Email Sent",
        description: "Proposal sent to client successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const sendEmail = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/send-email`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Email Sent",
        description: "Proposal sent to client successfully!",
      });
    },
    onError: (error: Error & { missingField?: string }) => {
      // Check if the error is specifically about missing client email
      if (error.message?.includes("Client email is required") || error.missingField === "clientEmail") {
        handleOpenEmailDialog();
        toast({
          title: "Client Email Required",
          description: "Please provide the client's email address to send the proposal.",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send email",
          variant: "destructive",
        });
      }
    },
  });

  const generateVibeGuide = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/generate-vibe-guide`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "Guide Generated",
        description: "Vibecoding execution guide is ready!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate guide",
        variant: "destructive",
      });
    },
  });

  const generatePMBreakdown = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${project?.id}/generate-pm-breakdown`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
      toast({
        title: "PM Breakdown Generated",
        description: "Project management plan is ready!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PM breakdown",
        variant: "destructive",
      });
    },
  });

  if (!project || isLoading) {
    return null;
  }

  const isPending = 
    approveEstimate.isPending || 
    regenerateEstimate.isPending || 
    generateAssets.isPending || 
    sendEmail.isPending || 
    sendEmailWithRecipient.isPending ||
    updateClientEmail.isPending ||
    generateVibeGuide.isPending || 
    generatePMBreakdown.isPending;

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end" data-testid="action-buttons">
      {currentStage === 1 && project.estimateMarkdown && (
        <>
          <Button
            variant="glass"
            onClick={() => regenerateEstimate.mutate()}
            disabled={isPending}
            data-testid="button-regenerate"
          >
            {regenerateEstimate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerate
          </Button>
          <Button
            variant="glass-primary"
            onClick={() => approveEstimate.mutate()}
            disabled={isPending}
            data-testid="button-approve"
          >
            {approveEstimate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck2 className="h-4 w-4 mr-2" />
            )}
            Approve & Generate PDF
          </Button>
        </>
      )}

      {currentStage === 2 && (
        <>
          {project.proposalPdfUrl && (
            <Button variant="glass" asChild data-testid="button-download-proposal">
              <a href={project.proposalPdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Proposal
              </a>
            </Button>
          )}
          {project.presentationUrl && (
            <Button variant="glass" asChild data-testid="button-view-presentation">
              <a href={project.presentationUrl} target="_blank" rel="noopener noreferrer">
                <Presentation className="h-4 w-4 mr-2" />
                View Presentation
              </a>
            </Button>
          )}
          <Button
            variant="glass-primary"
            onClick={() => sendEmail.mutate()}
            disabled={isPending}
            data-testid="button-send-email"
          >
            {(sendEmail.isPending || sendEmailWithRecipient.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Email
          </Button>
        </>
      )}

      {currentStage === 3 && (
        <Button
          variant="glass-primary"
          onClick={() => generateVibeGuide.mutate()}
          disabled={isPending}
          data-testid="button-generate-vibe-guide"
        >
          {generateVibeGuide.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Code2 className="h-4 w-4 mr-2" />
          )}
          Generate Execution Guide
        </Button>
      )}

      {currentStage === 4 && (
        <>
          {project.vibecodeGuideA && (
            <Button variant="glass" data-testid="button-view-guide-a">
              <FileText className="h-4 w-4 mr-2" />
              Manual A (High-Code)
            </Button>
          )}
          {project.vibecodeGuideB && (
            <Button variant="glass" data-testid="button-view-guide-b">
              <FileText className="h-4 w-4 mr-2" />
              Manual B (No-Code)
            </Button>
          )}
          <Button
            variant="glass-primary"
            onClick={() => generatePMBreakdown.mutate()}
            disabled={isPending}
            data-testid="button-generate-pm"
          >
            {generatePMBreakdown.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4 mr-2" />
            )}
            Generate PM Tracks
          </Button>
        </>
      )}

      {currentStage === 5 && (
        <>
          {!project.pmBreakdown ? (
            <Button
              variant="glass-primary"
              onClick={() => generatePMBreakdown.mutate()}
              disabled={isPending}
              data-testid="button-generate-pm-final"
            >
              {generatePMBreakdown.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4 mr-2" />
              )}
              Generate PM Breakdown
            </Button>
          ) : (
            <Button variant="glass" disabled className="bg-green-500/20 border-green-500/50 text-green-600" data-testid="button-pm-completed">
              <FileCheck2 className="h-4 w-4 mr-2" />
              PM Breakdown Complete
            </Button>
          )}
        </>
      )}

      {project && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a 
                href={`/api/projects/${project.id}/export/json`} 
                download
                className="flex items-center gap-2"
                data-testid="button-export-json"
              >
                <FileJson className="h-4 w-4" />
                Export as JSON
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a 
                href={`/api/projects/${project.id}/export/csv`}
                download
                className="flex items-center gap-2"
                data-testid="button-export-csv"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Estimates (CSV)
              </a>
            </DropdownMenuItem>
            {project.proposalPdfUrl && (
              <DropdownMenuItem asChild>
                <a 
                  href={project.proposalPdfUrl}
                  download
                  className="flex items-center gap-2"
                  data-testid="button-export-proposal-pdf"
                >
                  <FileText className="h-4 w-4" />
                  Download Proposal PDF
                </a>
              </DropdownMenuItem>
            )}
            {project.internalReportPdfUrl && (
              <DropdownMenuItem asChild>
                <a 
                  href={project.internalReportPdfUrl}
                  download
                  className="flex items-center gap-2"
                  data-testid="button-export-report-pdf"
                >
                  <FileText className="h-4 w-4" />
                  Download Internal Report
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Client Email Required
            </DialogTitle>
            <DialogDescription>
              Please provide the client's email address to send the proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client-email">Email Address</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                data-testid="input-client-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} data-testid="button-cancel-email">
              Cancel
            </Button>
            <Button 
              onClick={() => updateClientEmail.mutate(clientEmail)}
              disabled={!clientEmail || !clientEmail.includes('@') || updateClientEmail.isPending}
              data-testid="button-save-email"
            >
              {updateClientEmail.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
