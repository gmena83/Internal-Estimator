import { Router } from "express";
import { storage } from "../storage";
import { projectService } from "../services/project.service";
import { assetService } from "../services/asset.service";
import { aiService } from "../ai-service";
import { upload } from "../middleware/upload";
import { storageProvider } from "../services/storage/storage-provider";
import { insertProjectSchema, type Attachment } from "@shared/schema";
import { Readable } from "stream";
import path from "path";

const router = Router();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = await storage.getProjects(req.user?.id);
    res.json(projects);
  } catch {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get recent projects
router.get("/recent", async (req, res) => {
  try {
    const projects = await storage.getRecentProjects(req.user?.id, 5);
    res.json(projects);
  } catch {
    res.status(500).json({ error: "Failed to fetch recent projects" });
  }
});

// Get single project dashboard (consolidated data)
router.get("/:id/dashboard", async (req, res) => {
  try {
    const dashboard = await storage.getProjectDashboard(req.params.id, req.user?.id);
    if (!dashboard) return res.status(404).json({ error: "Project not found" });
    res.json(dashboard);
  } catch {
    res.status(500).json({ error: "Failed to fetch project dashboard" });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.id, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create project
router.post("/", async (req, res) => {
  try {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const project = await storage.createProject({
      ...parsed.data,
      createdById: req.user?.id,
    });
    if (parsed.data.rawInput) {
      aiService.processRawInput(project.id, parsed.data.rawInput).catch(console.error);
    }
    res.status(201).json(project);
  } catch (error) {
    console.error("[Forensic] Project creation failed:", error);
    res.status(500).json({ error: "Failed to create project", details: (error as any).message });
  }
});

// Update project
router.patch("/:id", async (req, res) => {
  try {
    const project = await storage.updateProject(req.params.id, req.body, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id, req.user?.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Approve Stage 1 Draft
router.post("/:id/approve-draft", async (req, res) => {
  try {
    const updated = await projectService.approveDraft(req.params.id, req.user?.id);
    const assetUrls = await assetService.generateStage2Assets(updated);

    const finalUpdate = await storage.updateProject(req.params.id, assetUrls, req.user?.id);
    res.json(finalUpdate);
  } catch (error: any) {
    if (error.recommendation) {
      return res.status(400).json({
        error: error.message,
        recommendation: error.recommendation,
      });
    }
    res.status(500).json({ error: "Failed to approve draft" });
  }
});

// Reset project
router.post("/:id/reset", async (req, res) => {
  try {
    const updated = await projectService.resetProject(req.params.id, req.user?.id);
    res.json(updated);
  } catch (_error) {
    res.status(500).json({ error: "Failed to reset project" });
  }
});

// File Upload
router.post("/:id/upload", upload.array("files", 10), async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const newAttachments: Attachment[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const fileStream = Readable.from(file.buffer);
      const fileUrl = await storageProvider.saveFile(projectId, fileName, fileStream);

      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
      });
    }

    const existingAttachments = (project.attachments as Attachment[]) || [];
    const allAttachments = [...existingAttachments, ...newAttachments];

    await storage.updateProject(projectId, { attachments: allAttachments });
    res.json({ attachments: allAttachments });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload files" });
  }
});

// Get attachments
router.get("/:id/attachments", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.id, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ attachments: project.attachments || [] });
  } catch {
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

export default router;
