import { Router } from "express";
import { isAdmin } from "../middleware/admin.js";
import { storage } from "../storage.js";
import { loadPricingMatrix, updatePricingMatrix } from "../pricing-matrix.js";
import { Attachment } from "@internal/shared";

const router: Router = Router();

// Enforce Admin Access
router.use(isAdmin);

// --- PROJECTS ---
router.get("/projects", async (req, res) => {
  try {
    const projects = await storage.getProjects(undefined, true); // true = includeDeleted
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
    await storage.deleteProject(req.params.id, undefined, true); // Permanent delete
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to wipe project" });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    await storage.deleteProject(req.params.id, undefined, false); // Soft delete
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

// --- TEST SCENARIOS ---
router.post("/test-scenarios", async (req, res) => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { aiService } = await import("../ai-service.js");

    // 1. Load Scenarios
    const scenariosPath = path.join(process.cwd(), "..", "..", "qa_scenarios.json");
    let scenarios: string[] = [];
    try {
      const data = await fs.readFile(scenariosPath, "utf-8");
      scenarios = JSON.parse(data);
    } catch (e) {
      console.error("Failed to load scenarios:", e);
      return res.status(500).json({ error: "Failed to load qa_scenarios.json" });
    }

    // 2. Run each scenario
    // We'll return a stream or just a summary for now. Since this is long running,
    // ideally we should use a worker or return a job ID.
    // For simplicity as per request, we'll try to process them serialy and return result,
    // OR trigger them and return "Started".
    // Given the user wants to "produce final set of documents", it implies full processing.
    // Let's trigger them and return the list of created project IDs so the UI can track them?
    // Or just run them and return a report.
    // "Test Run ... trigger a workflow ... produce final set of documents"

    const results = [];

    // We will limit to first 5 for safety if list is huge, or run all?
    // User said "test all instances".

    for (const scenario of scenarios) {
      try {
        // Create Project
        const project = await storage.createProject({
          title: `Test Run: ${scenario.substring(0, 30)}...`,
          clientName: "Test Suite",
          rawInput: scenario,
          status: "in_progress",
        });

        // Trigger AI
        // We use processRawInput to simulate the full flow
        await aiService.processRawInput(project.id, scenario);

        results.push({
          scenario,
          projectId: project.id,
          status: "success",
        });
      } catch (err) {
        console.error(`Failed scenario: ${scenario}`, err);
        results.push({
          scenario,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Test run error:", error);
    res.status(500).json({ error: "Failed to run test scenarios" });
  }
});

export default router;
