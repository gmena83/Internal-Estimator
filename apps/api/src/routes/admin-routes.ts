import { Router } from "express";
import { isAdmin } from "../middleware/admin";
import { storage } from "../storage";
import { loadPricingMatrix, updatePricingMatrix } from "../pricing-matrix";
import { Attachment } from "@shared/schema";

const router = Router();

// Enforce Admin Access
router.use(isAdmin);

// --- PROJECTS ---
router.get("/projects", async (req, res) => {
  try {
    const projects = await storage.getProjects(true); // true = includeDeleted
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.post("/projects/:id/restore", async (req, res) => {
  try {
    const project = await storage.restoreProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to restore project" });
  }
});

router.delete("/projects/:id/wipe", async (req, res) => {
  try {
    await storage.deleteProject(req.params.id, true); // Permanent delete
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to wipe project" });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    await storage.deleteProject(req.params.id, false); // Soft delete
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// --- KNOWLEDGE BASE ---
router.post("/knowledge", async (req, res) => {
  try {
    const entry = await storage.createKnowledgeEntry(req.body);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to create knowledge entry" });
  }
});

// --- ASSETS ---
router.delete("/projects/:projectId/attachments/:attachmentId", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const attachments = (project.attachments as Attachment[]) || [];
    const newAttachments = attachments.filter((a) => a.id !== req.params.attachmentId);

    // If no change, return early
    if (attachments.length === newAttachments.length) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    await storage.updateProject(project.id, { attachments: newAttachments });
    res.json({ success: true, attachments: newAttachments });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});

// --- PRICING MATRIX ---
router.get("/pricing", async (req, res) => {
  try {
    const matrix = await loadPricingMatrix();
    res.json(matrix);
  } catch (error) {
    res.status(500).json({ error: "Failed to load pricing matrix" });
  }
});

router.put("/pricing", async (req, res) => {
  try {
    const updated = await updatePricingMatrix(req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update pricing matrix" });
  }
});

// --- SYSTEM HEALTH ---
router.post("/system/reset-health", async (req, res) => {
  try {
    await storage.resetApiHealth();
    res.json({ success: true, message: "API Health logs reset" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset health logs" });
  }
});

router.post("/system/run-tests", async (req, res) => {
  try {
    const { exec } = await import("child_process");
    // Run the existing run-tests.sh script or directly npm test
    // Assuming windows given user OS, but script is .sh. Let's try to run the script if possible or fall back to npm test
    // "npm test" maps to "turbo test" which maps to "vitest run" in subpackages usually.
    // The root package.json has "test": "turbo test".

    // Let's run the shell script for consistency if it works, or just npm test.
    // Given we are in node, let's run "npm test" to be safe cross-platform.

    // Set a timeout of 60 seconds
    exec("npm test", { timeout: 60000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        return res.json({
          success: false,
          output: stdout + "\n" + stderr,
          error: error.message,
        });
      }
      res.json({ success: true, output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to run tests" });
  }
});

// --- USER MANAGEMENT ---
router.get("/users", async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required" });

    const user = await storage.updateUser(req.params.id, { role });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
