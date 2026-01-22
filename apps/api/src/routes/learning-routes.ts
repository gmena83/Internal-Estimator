import { Router } from "express";
import { storage } from "../storage";
import { PROJECT_STATUS } from "@shared/schema";

const router: Router = Router();

// POST /api/learn/projects/:id
// Triggered when a user approves an estimate.
// Creates a knowledge entry with the project's key characteristics and approved price.
router.post("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await storage.getProject(id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Determine which scenario was selected to learn from the correct data
    const selectedScenarioData =
      project.selectedScenario === "A" ? project.scenarioA : project.scenarioB;

    if (!selectedScenarioData) {
      return res.status(400).json({ error: "Project has no selected scenario data to learn from" });
    }

    const { totalCost, totalHours, techStack, features, timeline, hourlyRate } =
      selectedScenarioData as any; // Cast as any because jsonb type is generic

    // Construct the "Knowledge" to be saved
    const learningContent = `
PROJECT TYPE: ${project.title}
MISSION: ${project.parsedData ? (project.parsedData as any).mission : "N/A"}
TECH STACK: ${Array.isArray(techStack) ? techStack.join(", ") : techStack}
FEATURES: ${Array.isArray(features) ? features.join(", ") : features}
TIMELINE: ${timeline}
APPROVED COST: $${totalCost}
HOURLY RATE: $${hourlyRate}/hr
TOTAL HOURS: ${totalHours}
`;

    // Save as a knowledge entry
    await storage.createKnowledgeEntry({
      projectId: project.id,
      category: "approved_estimate",
      content: learningContent.trim(),
      metadata: {
        sourceProjectId: project.id,
        totalCost,
        techStack,
        approvedAt: new Date().toISOString(),
      },
    });

    // Optionally update project status
    await storage.updateProject(id, { status: PROJECT_STATUS.ACCEPTED });

    res.json({ success: true, message: "Estimate approved and learned." });
  } catch (error) {
    console.error("Failed to learn from project:", error);
    res.status(500).json({ error: "Failed to process learning request" });
  }
});

export default router;
