import { Router } from "express";
import { storage } from "../storage";
import { assetService } from "../services/asset.service";
import { exportService } from "../services/export-service";
import { aiService } from "../ai-service";
import {
  generateProposalPdf,
  generateInternalReportPdf,
  generateExecutionManualPdf,
} from "../pdf-service";
import { imageApprovalSchema } from "@shared/schema";

const router: Router = Router();

// Proposal PDF
router.get("/:projectId/proposal.pdf", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const startTime = Date.now();
    const pdfBuffer = await generateProposalPdf(project);
    const latencyMs = Date.now() - startTime;

    await storage.updateApiHealth({ service: "pdfmake", status: "online", latencyMs });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, "_")}_proposal.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (_error) {
    res.status(500).json({ error: "Failed to generate proposal PDF" });
  }
});

// Internal Report PDF
router.get("/:projectId/internal-report.pdf", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const pdfBuffer = await generateInternalReportPdf(project);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, "_")}_internal_report.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (_error) {
    res.status(500).json({ error: "Failed to generate internal report PDF" });
  }
});

// Execution Manual PDF
router.get("/:projectId/execution-manual.pdf", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const pdfBuffer = await generateExecutionManualPdf(project);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.title.replace(/[^a-zA-Z0-9]/g, "_")}_execution_manual.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (_error) {
    res.status(500).json({ error: "Failed to generate execution manual PDF" });
  }
});

// Export JSON
router.get("/:projectId/export/json", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const messages = await storage.getMessages(project.id);
    const exportData = exportService.mapToJson(project, messages);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, "_")}_export.json"`,
    );
    res.json(exportData);
  } catch (_error) {
    res.status(500).json({ error: "Failed to export project JSON" });
  }
});

// Export CSV
router.get("/:projectId/export/csv", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const csvContent = exportService.mapToCsv(project);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, "_")}_estimates.csv"`,
    );
    res.send(csvContent);
  } catch (_error) {
    res.status(500).json({ error: "Failed to export project CSV" });
  }
});

// Image Generation
router.post("/:projectId/generate-images", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const images = await assetService.generateCoverImages(project);
    res.json({ success: true, images });
  } catch (error) {
    console.error("Asset route error:", error);
    res.status(500).json({ error: "Operation failed" });
  }
});

// Image Approval
router.post("/:projectId/approve-image", async (req, res) => {
  try {
    const parsed = imageApprovalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const imageUrl =
      parsed.data.imageUrl ||
      `/api/projects/${req.params.projectId}/cover-${parsed.data.imageId}.png`;
    const updated = await storage.updateProject(req.params.projectId, { coverImageUrl: imageUrl });

    res.json({ success: true, project: updated });
  } catch (_error) {
    res.status(500).json({ error: "Failed to approve image" });
  }
});

// Generate Stage 3/4 Assets
router.post("/:projectId/generate-assets", async (req, res) => {
  try {
    const updated = await storage.updateProject(
      req.params.projectId,
      {
        currentStage: 3,
        status: "assets_ready",
      },
      req.user?.id,
    );
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to generate assets" });
  }
});

// Vibecode Guide
router.post("/:projectId/vibecode-guide", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const result = await aiService.generateVibeGuides(project);
    const updated = await storage.updateProject(
      req.params.projectId,
      {
        vibecodeGuideA: result.guideA,
        vibecodeGuideB: result.guideB,
      },
      req.user?.id,
    );
    res.json(updated);
  } catch (error) {
    console.error("Asset route error:", error);
    res.status(500).json({ error: "Operation failed" });
  }
});

// PM Breakdown
router.post("/:projectId/pm-breakdown", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const result = await aiService.generatePMBreakdown(project);
    const updated = await storage.updateProject(
      req.params.projectId,
      {
        pmBreakdown: result,
      },
      req.user?.id,
    );
    res.json(updated);
  } catch (_error) {
    res.status(500).json({ error: "Failed to generate PM breakdown" });
  }
});

// Select Scenario
router.post("/:projectId/select-scenario", async (req, res) => {
  try {
    const { scenario } = req.body;
    if (!scenario) {
      return res.status(400).json({ message: "scenario is required" });
    }

    const updated = await storage.updateProject(
      req.params.projectId,
      {
        selectedScenario: scenario as "A" | "B",
        currentStage: 3,
      },
      req.user?.id,
    );
    res.json(updated);
  } catch (_error) {
    res.status(500).json({ error: "Failed to select scenario" });
  }
});

export default router;
