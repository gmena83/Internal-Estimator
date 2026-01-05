import { storage } from "../storage";
import { PROJECT_STATUS, type Project, type ProjectStatus } from "@shared/schema";
import { aiService } from "../ai-service";
import { storageProvider, type IStorageProvider } from "./storage/storage-provider";

export class ProjectServiceError extends Error {
  constructor(
    public message: string,
    public recommendation: string,
    public stage: number,
  ) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export class ProjectService {
  constructor(private provider: IStorageProvider = storageProvider) {}

  async advanceStage(
    projectId: string,
    targetStage: number,
    targetStatus: ProjectStatus,
    userId?: string,
  ): Promise<Project> {
    const project = await storage.getProject(projectId, userId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (targetStage !== project.currentStage && targetStage !== project.currentStage + 1) {
      throw new ProjectServiceError(
        `Cannot skip to stage ${targetStage}.`,
        `Please complete the current stage (${project.currentStage}) before proceeding.`,
        project.currentStage,
      );
    }

    try {
      const updated = await storage.updateProject(
        projectId,
        {
          currentStage: targetStage,
          status: targetStatus,
        },
        userId,
      );

      if (!updated) throw new Error("Update failed");
      return updated;
    } catch {
      throw new ProjectServiceError(
        `Failed to advance to stage ${targetStage}.`,
        "Check system logs or contact support. Verify if all required assets for this stage are ready.",
        project.currentStage,
      );
    }
  }

  async resetProject(projectId: string, userId?: string): Promise<Project> {
    const updated = await storage.updateProject(
      projectId,
      {
        currentStage: 1,
        status: PROJECT_STATUS.DRAFT,
        estimateMarkdown: null,
        scenarioA: null,
        scenarioB: null,
        roiAnalysis: null,
        selectedScenario: null,
        proposalPdfUrl: null,
        internalReportPdfUrl: null,
        presentationUrl: null,
        coverImageUrl: null,
        emailContent: null,
        emailSentAt: null,
        emailOpened: false,
        emailClicked: false,
        vibecodeGuideA: null,
        vibecodeGuideB: null,
        pmBreakdown: null,
        rawInput: null,
        parsedData: null,
      },
      userId,
    );

    if (!updated) throw new Error("Project not found or reset failed");
    return updated;
  }

  async deleteProject(projectId: string, userId?: string): Promise<void> {
    await storage.deleteProject(projectId, userId);
    // Asynchronous, non-blocking directory deletion
    await this.provider.deleteDirectory(projectId);
  }

  async approveDraft(projectId: string, userId?: string): Promise<Project> {
    const project = await storage.getProject(projectId, userId);
    if (!project) throw new Error("Project not found");

    // 1. Validation: Ensure a scenario is selected
    if (!project.selectedScenario) {
      throw new ProjectServiceError(
        "No scenario selected for approval.",
        "Please select either Scenario A or Scenario B before approving.",
        project.currentStage,
      );
    }

    // 2. Learning: Extract and save knowledge
    try {
      const selectedData = project.selectedScenario === "A" ? project.scenarioA : project.scenarioB;
      if (selectedData) {
        const { totalCost, totalHours, techStack, features, timeline, hourlyRate } =
          selectedData as any;

        const learningContent = `
APPROVED PROJECT: ${project.title}
MISSION: ${(project.parsedData as any)?.mission || "N/A"}
TECH STACK: ${Array.isArray(techStack) ? techStack.join(", ") : techStack}
FEATURES: ${Array.isArray(features) ? features.join(", ") : features}
TIMELINE: ${timeline}
APPROVED COST: $${totalCost}
HOURLY RATE: $${hourlyRate}/hr
TOTAL HOURS: ${totalHours}
`;

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
        // console.log(`[Learning] Captured knowledge from project ${projectId}`);
      }
    } catch (error) {
      // Non-blocking error for learning
      console.warn(`[Learning] Failed to capture knowledge for project ${projectId}`, error);
    }

    if (!project.estimateMarkdown) {
      try {
        await aiService.generateEstimate(project);
      } catch {
        throw new ProjectServiceError(
          "Estimate generation failed during approval.",
          "Ensure the AI configuration is correct and retry the approval.",
          1,
        );
      }
    }

    return await this.advanceStage(projectId, 2, PROJECT_STATUS.ASSETS_READY, userId);
  }
}

export const projectService = new ProjectService();
