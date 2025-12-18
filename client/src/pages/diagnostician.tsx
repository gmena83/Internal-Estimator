import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Loader2, 
  FileCode, 
  Shield, 
  Zap, 
  Settings,
  ExternalLink,
  Clock,
  FileText
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DiagnosticReport, DiagnosticFinding, CorrectedSnippet } from "@shared/schema";

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "Critical":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "High":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "Medium":
      return <Info className="w-4 h-4 text-yellow-500" />;
    case "Low":
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

function getSeverityBadgeVariant(severity: string): "destructive" | "secondary" | "outline" | "default" {
  switch (severity) {
    case "Critical":
      return "destructive";
    case "High":
      return "destructive";
    case "Medium":
      return "secondary";
    default:
      return "outline";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Security":
      return <Shield className="w-4 h-4" />;
    case "Performance":
      return <Zap className="w-4 h-4" />;
    case "Configuration":
      return <Settings className="w-4 h-4" />;
    default:
      return <FileCode className="w-4 h-4" />;
  }
}

export default function DiagnosticianPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data: reports = [], isLoading: loadingReports } = useQuery<DiagnosticReport[]>({
    queryKey: ["/api/diagnostics"],
  });

  const { data: selectedReport, isLoading: loadingReport } = useQuery<DiagnosticReport>({
    queryKey: ["/api/diagnostics", selectedReportId],
    enabled: !!selectedReportId,
    refetchInterval: (data) => {
      const report = data.state.data;
      if (report && report.status === "analyzing") {
        return 2000;
      }
      return false;
    },
  });

  const runDiagnosticsMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/diagnostics", { repoUrl: url });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagnostics"] });
      setSelectedReportId(data.id);
      setRepoUrl("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      runDiagnosticsMutation.mutate(repoUrl.trim());
    }
  };

  const findings = (selectedReport?.findings as DiagnosticFinding[]) || [];
  const snippets = (selectedReport?.correctedSnippets as CorrectedSnippet[]) || [];

  return (
    <div className="flex h-full">
      <div className="w-80 border-r flex flex-col bg-sidebar">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <SiGithub className="w-5 h-5" />
            Repository Diagnostics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Audit GitHub repos for Replit compatibility
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="github.com/owner/repo"
              className="flex-1"
              data-testid="input-repo-url"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={runDiagnosticsMutation.isPending || !repoUrl.trim()}
              data-testid="button-run-diagnostics"
            >
              {runDiagnosticsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {loadingReports ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground text-sm">
                No diagnostic reports yet. Enter a GitHub URL to analyze.
              </div>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full text-left p-3 rounded-md mb-1 transition-colors hover-elevate ${
                    selectedReportId === report.id ? "bg-sidebar-accent" : ""
                  }`}
                  data-testid={`button-report-${report.id}`}
                >
                  <div className="font-medium text-sm truncate">
                    {report.repoOwner}/{report.repoName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {report.status === "analyzing" ? (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Analyzing
                      </Badge>
                    ) : report.status === "completed" ? (
                      <>
                        {(report.criticalCount ?? 0) > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {report.criticalCount} Critical
                          </Badge>
                        )}
                        {(report.highCount ?? 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {report.highCount} High
                          </Badge>
                        )}
                        {(report.criticalCount ?? 0) === 0 && (report.highCount ?? 0) === 0 && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Healthy
                          </Badge>
                        )}
                      </>
                    ) : report.status === "failed" ? (
                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Unknown"}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedReportId && selectedReport ? (
          <>
            <div className="p-4 border-b flex items-center justify-between gap-4">
              <div>
                <h1 className="font-semibold text-lg flex items-center gap-2">
                  <SiGithub className="w-5 h-5" />
                  {selectedReport.repoOwner}/{selectedReport.repoName}
                </h1>
                <a 
                  href={selectedReport.repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  View on GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                {selectedReport.status === "analyzing" && (
                  <Badge variant="secondary">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Analyzing...
                  </Badge>
                )}
                {selectedReport.status === "completed" && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{selectedReport.criticalCount ?? 0} Critical</Badge>
                    <Badge variant="secondary">{selectedReport.highCount ?? 0} High</Badge>
                    <Badge variant="outline">{selectedReport.mediumCount ?? 0} Medium</Badge>
                    <Badge variant="outline">{selectedReport.lowCount ?? 0} Low</Badge>
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {loadingReport ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : selectedReport.status === "analyzing" ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Analyzing repository...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scanning files, checking security, and evaluating configuration
                    </p>
                  </CardContent>
                </Card>
              ) : selectedReport.status === "failed" ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                    <p className="font-medium">Analysis Failed</p>
                    <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                      {selectedReport.healthAssessment}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground" data-testid="text-health-assessment">
                        {selectedReport.healthAssessment}
                      </p>
                    </CardContent>
                  </Card>

                  {findings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Detailed Findings ({findings.length})
                        </CardTitle>
                        <CardDescription>
                          Issues discovered during the multi-vector audit
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {findings.map((finding, index) => (
                            <div 
                              key={index} 
                              className="p-3 rounded-md border bg-card"
                              data-testid={`finding-${index}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {getSeverityIcon(finding.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={getSeverityBadgeVariant(finding.severity)}>
                                      {finding.severity}
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      {getCategoryIcon(finding.category)}
                                      {finding.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {finding.file}{finding.line ? `:${finding.line}` : ""}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm">{finding.description}</p>
                                  <div className="mt-2 p-2 rounded bg-muted text-sm">
                                    <span className="font-medium">Recommendation:</span> {finding.recommendation}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {snippets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileCode className="w-5 h-5" />
                          Corrected Code Snippets
                        </CardTitle>
                        <CardDescription>
                          Ready-to-use fixes for identified issues
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {snippets.map((snippet, index) => (
                            <div key={index} className="space-y-2" data-testid={`snippet-${index}`}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{snippet.file}</Badge>
                                <span className="text-sm text-muted-foreground">{snippet.description}</span>
                              </div>
                              {snippet.original && (
                                <>
                                  <p className="text-xs text-muted-foreground font-medium">Before:</p>
                                  <pre className="p-3 rounded-md bg-muted text-sm overflow-x-auto font-mono">
                                    {snippet.original}
                                  </pre>
                                </>
                              )}
                              <p className="text-xs text-muted-foreground font-medium">
                                {snippet.original ? "After:" : "Add:"}
                              </p>
                              <pre className="p-3 rounded-md bg-muted text-sm overflow-x-auto font-mono">
                                {snippet.corrected}
                              </pre>
                              {index < snippets.length - 1 && <Separator className="my-4" />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedReport.analyzedFiles && (selectedReport.analyzedFiles as string[]).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileCode className="w-5 h-5" />
                          Analyzed Files ({(selectedReport.analyzedFiles as string[]).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(selectedReport.analyzedFiles as string[]).map((file, index) => (
                            <Badge key={index} variant="outline" className="font-mono text-xs">
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <SiGithub className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Repository Diagnostician</h2>
              <p className="text-muted-foreground mb-4">
                Enter a GitHub repository URL to run a comprehensive audit for Replit compatibility, 
                security vulnerabilities, performance issues, and configuration problems.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2 justify-center">
                  <Shield className="w-4 h-4" /> Security & secrets scanning
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <Settings className="w-4 h-4" /> Configuration validation
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <Zap className="w-4 h-4" /> Performance analysis
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <FileCode className="w-4 h-4" /> Code portability checks
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
