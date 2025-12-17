import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertMessageSchema, type ServiceStatus } from "@shared/schema";
import { aiService } from "./ai-service";
import { generateProposalPdf, generateInternalReportPdf } from "./pdf-service";
import { sendProposalEmail } from "./email-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Projects - Get all
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Projects - Get recent (last 5)
  app.get("/api/projects/recent", async (req, res) => {
    try {
      const projects = await storage.getRecentProjects(5);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching recent projects:", error);
      res.status(500).json({ error: "Failed to fetch recent projects" });
    }
  });

  // Projects - Get single
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Projects - Create
  app.post("/api/projects", async (req, res) => {
    try {
      const parsed = insertProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const project = await storage.createProject(parsed.data);
      
      // If raw input was provided, start processing it
      if (parsed.data.rawInput) {
        // Process asynchronously
        aiService.processRawInput(project.id, parsed.data.rawInput).catch(console.error);
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Projects - Update
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Projects - Delete
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Messages - Get for project
  app.get("/api/projects/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Messages - Create (and process)
  app.post("/api/projects/:id/messages", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        projectId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      // Save user message
      const userMessage = await storage.createMessage(parsed.data);

      // Process with AI and generate response
      try {
        const response = await aiService.processMessage(
          project,
          parsed.data.content
        );
        
        // Save assistant message
        const assistantMessage = await storage.createMessage({
          projectId: req.params.id,
          role: "assistant",
          content: response.content,
          stage: response.stage,
        });

        res.json({ userMessage, assistantMessage });
      } catch (aiError) {
        console.error("AI processing error:", aiError);
        // Still return user message even if AI fails
        const errorMessage = await storage.createMessage({
          projectId: req.params.id,
          role: "assistant",
          content: "I encountered an error processing your request. Please try again.",
          stage: project.currentStage,
        });
        res.json({ userMessage, assistantMessage: errorMessage });
      }
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Stage Actions - Approve Estimate
  app.post("/api/projects/:id/approve-estimate", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // If no estimate exists yet, generate one first
      if (!project.estimateMarkdown) {
        await aiService.generateEstimate(project);
      }

      // Move to stage 2
      const updated = await storage.updateProject(req.params.id, {
        currentStage: 2,
        status: "estimate_generated",
      });

      // Index the approved estimate in knowledge base
      const refreshedProject = await storage.getProject(req.params.id);
      if (refreshedProject?.estimateMarkdown) {
        await storage.createKnowledgeEntry({
          projectId: project.id,
          category: "estimate",
          content: refreshedProject.estimateMarkdown,
          metadata: {
            scenarioA: refreshedProject.scenarioA,
            scenarioB: refreshedProject.scenarioB,
            roiAnalysis: refreshedProject.roiAnalysis,
          },
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error approving estimate:", error);
      res.status(500).json({ error: "Failed to approve estimate" });
    }
  });

  // Stage Actions - Regenerate Estimate
  app.post("/api/projects/:id/regenerate-estimate", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Regenerate the estimate using AI
      const result = await aiService.generateEstimate(project);
      
      const updated = await storage.updateProject(req.params.id, {
        estimateMarkdown: result.markdown,
        scenarioA: result.scenarioA,
        scenarioB: result.scenarioB,
        roiAnalysis: result.roiAnalysis,
        parsedData: result.parsedData,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error regenerating estimate:", error);
      res.status(500).json({ error: "Failed to regenerate estimate" });
    }
  });

  // Stage Actions - Select Scenario
  app.post("/api/projects/:id/select-scenario", async (req, res) => {
    try {
      const { scenario } = req.body;
      if (!scenario || !["A", "B"].includes(scenario)) {
        return res.status(400).json({ error: "Invalid scenario selection" });
      }

      const updated = await storage.updateProject(req.params.id, {
        selectedScenario: scenario,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error selecting scenario:", error);
      res.status(500).json({ error: "Failed to select scenario" });
    }
  });

  // Stage Actions - Generate Assets (Stage 2 -> ready for Stage 3)
  app.post("/api/projects/:id/generate-assets", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // In production, this would generate actual PDFs via external services
      // For now, simulate asset generation with placeholder URLs
      const updated = await storage.updateProject(req.params.id, {
        proposalPdfUrl: `/api/projects/${req.params.id}/proposal.pdf`,
        internalReportPdfUrl: `/api/projects/${req.params.id}/internal-report.pdf`,
        presentationUrl: `https://gamma.app/embed/demo-presentation`,
        status: "assets_ready",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error generating assets:", error);
      res.status(500).json({ error: "Failed to generate assets" });
    }
  });

  // Stage Actions - Send Email (advances to Stage 3)
  app.post("/api/projects/:id/send-email", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const { recipientEmail } = req.body;

      // Generate email content
      let emailContent: string;
      try {
        emailContent = await aiService.generateEmail(project);
      } catch (err) {
        console.error("AI email generation failed, using fallback:", err);
        emailContent = `Dear ${project.clientName || "Team"},\n\nThank you for the opportunity to discuss your project. I'm excited to share our proposal for ${project.title}.\n\nPlease find the attached proposal with detailed information about our recommended approach, timeline, and investment.\n\nI'd love to schedule a call to walk you through the proposal and answer any questions.\n\nBest regards,\nISI Agent`;
      }

      // Attempt to send email via Resend
      const emailResult = await sendProposalEmail(project, emailContent, recipientEmail);
      
      if (!emailResult.success) {
        console.warn("Email send failed, but continuing with stage advancement:", emailResult.error);
      }

      // Advance to stage 3
      const updated = await storage.updateProject(req.params.id, {
        emailContent,
        emailSentAt: new Date(),
        currentStage: 3,
        status: "email_sent",
      });

      res.json({
        ...updated,
        emailSent: emailResult.success,
        emailMessageId: emailResult.messageId,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Stage Actions - Generate Vibe Guide (advances to Stage 4)
  app.post("/api/projects/:id/generate-vibe-guide", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Generate execution guides
      let guides: { guideA: string; guideB: string };
      try {
        guides = await aiService.generateVibeGuides(project);
      } catch (err) {
        console.error("AI guide generation failed, using fallback:", err);
        guides = {
          guideA: `# Manual A: High-Code Approach\n\n## Project: ${project.title}\n\nFollow standard development practices to build this project.`,
          guideB: `# Manual B: No-Code Approach\n\n## Project: ${project.title}\n\nUse no-code tools to rapidly prototype this solution.`,
        };
      }

      // Advance to stage 4
      const updated = await storage.updateProject(req.params.id, {
        vibecodeGuideA: guides.guideA,
        vibecodeGuideB: guides.guideB,
        currentStage: 4,
        status: "accepted",
      });

      // Index the vibecode prompts
      if (guides.guideA) {
        await storage.createKnowledgeEntry({
          projectId: project.id,
          category: "vibecode_prompt",
          content: guides.guideA,
          metadata: { type: "high_code" },
        });
      }
      if (guides.guideB) {
        await storage.createKnowledgeEntry({
          projectId: project.id,
          category: "vibecode_prompt",
          content: guides.guideB,
          metadata: { type: "no_code" },
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error generating vibe guide:", error);
      res.status(500).json({ error: "Failed to generate vibe guide" });
    }
  });

  // Stage Actions - Generate PM Breakdown (advances to Stage 5 - final)
  app.post("/api/projects/:id/generate-pm-breakdown", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Generate PM breakdown
      let breakdown: any;
      try {
        breakdown = await aiService.generatePMBreakdown(project);
      } catch (err) {
        console.error("AI PM breakdown failed, using fallback:", err);
        breakdown = {
          phases: [
            { phaseNumber: 1, phaseName: "Planning", objectives: ["Define scope"], durationDays: 5, tasks: [{ id: "1.1", name: "Requirements gathering", estimatedHours: 16 }], deliverables: ["Project plan"], dependencies: [] },
            { phaseNumber: 2, phaseName: "Development", objectives: ["Build features"], durationDays: 15, tasks: [{ id: "2.1", name: "Core development", estimatedHours: 80 }], deliverables: ["Working application"], dependencies: ["Phase 1"] },
            { phaseNumber: 3, phaseName: "Launch", objectives: ["Deploy"], durationDays: 3, tasks: [{ id: "3.1", name: "Deployment", estimatedHours: 8 }], deliverables: ["Live application"], dependencies: ["Phase 2"] },
          ],
        };
      }

      // Advance to stage 5
      const updated = await storage.updateProject(req.params.id, {
        pmBreakdown: breakdown,
        currentStage: 5,
        status: "in_progress",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error generating PM breakdown:", error);
      res.status(500).json({ error: "Failed to generate PM breakdown" });
    }
  });

  // API Health
  app.get("/api/health", async (req, res) => {
    try {
      const healthLogs = await storage.getApiHealth();
      const statuses: ServiceStatus[] = healthLogs.map((log) => ({
        service: log.service,
        displayName: getServiceDisplayName(log.service),
        status: log.status as "online" | "degraded" | "offline" | "unknown",
        latencyMs: log.latencyMs || undefined,
        requestCount: log.requestCount || undefined,
        lastChecked: log.lastChecked || undefined,
      }));
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching health:", error);
      res.status(500).json({ error: "Failed to fetch health status" });
    }
  });

  // Knowledge Base - Search
  app.get("/api/knowledge", async (req, res) => {
    try {
      const { category, q } = req.query;
      let entries;
      
      if (q && typeof q === "string") {
        entries = await storage.searchKnowledgeEntries(q, category as string);
      } else {
        entries = await storage.getKnowledgeEntries(category as string);
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching knowledge entries:", error);
      res.status(500).json({ error: "Failed to fetch knowledge entries" });
    }
  });

  // PDF Generation - Proposal
  app.get("/api/projects/:id/proposal.pdf", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const pdfBuffer = await generateProposalPdf(project);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_proposal.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating proposal PDF:", error);
      res.status(500).json({ error: "Failed to generate proposal PDF" });
    }
  });

  // PDF Generation - Internal Report
  app.get("/api/projects/:id/internal-report.pdf", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const pdfBuffer = await generateInternalReportPdf(project);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_internal_report.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating internal report PDF:", error);
      res.status(500).json({ error: "Failed to generate internal report PDF" });
    }
  });

  // Data Export - JSON
  app.get("/api/projects/:id/export/json", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const messages = await storage.getMessages(project.id);
      const exportData = {
        project,
        messages,
        exportedAt: new Date().toISOString(),
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_export.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting project:", error);
      res.status(500).json({ error: "Failed to export project" });
    }
  });

  // Data Export - CSV (estimates summary)
  app.get("/api/projects/:id/export/csv", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const scenarioA = project.scenarioA as any;
      const scenarioB = project.scenarioB as any;
      const roiAnalysis = project.roiAnalysis as any;

      const csvRows = [
        ["Field", "Scenario A", "Scenario B"],
        ["Name", scenarioA?.name || "", scenarioB?.name || ""],
        ["Total Cost", scenarioA?.totalCost || "", scenarioB?.totalCost || ""],
        ["Timeline", scenarioA?.timeline || "", scenarioB?.timeline || ""],
        ["Hours", scenarioA?.totalHours || "", scenarioB?.totalHours || ""],
        ["Hourly Rate", scenarioA?.hourlyRate || "", scenarioB?.hourlyRate || ""],
        ["Recommended", scenarioA?.recommended ? "Yes" : "No", scenarioB?.recommended ? "Yes" : "No"],
        [],
        ["ROI Metric", "Value"],
        ["Cost of Doing Nothing", roiAnalysis?.costOfDoingNothing || ""],
        ["Manual Operational Cost", roiAnalysis?.manualOperationalCost || ""],
        ["Projected Savings", roiAnalysis?.projectedSavings || ""],
        ["Payback Period (months)", roiAnalysis?.paybackPeriodMonths || ""],
        ["3-Year ROI (%)", roiAnalysis?.threeYearROI || ""],
      ];

      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_estimates.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // Search Projects
  app.get("/api/projects/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const { status, stage } = req.query;
      
      let projects = await storage.getProjects();
      
      // Text search
      if (query && query !== "*") {
        const lowerQuery = query.toLowerCase();
        projects = projects.filter(p => 
          p.title.toLowerCase().includes(lowerQuery) ||
          (p.clientName && p.clientName.toLowerCase().includes(lowerQuery)) ||
          (p.rawInput && p.rawInput.toLowerCase().includes(lowerQuery))
        );
      }

      // Filter by status
      if (status && typeof status === "string") {
        projects = projects.filter(p => p.status === status);
      }

      // Filter by stage
      if (stage && typeof stage === "string") {
        const stageNum = parseInt(stage, 10);
        if (!isNaN(stageNum)) {
          projects = projects.filter(p => p.currentStage === stageNum);
        }
      }

      res.json(projects);
    } catch (error) {
      console.error("Error searching projects:", error);
      res.status(500).json({ error: "Failed to search projects" });
    }
  });

  return httpServer;
}

function getServiceDisplayName(service: string): string {
  const names: Record<string, string> = {
    gemini: "Gemini",
    claude: "Claude",
    openai: "OpenAI",
    pdf_co: "PDF.co",
    resend: "Resend",
    gamma: "Gamma",
    nano_banana: "Nano Banana",
  };
  return names[service] || service;
}
