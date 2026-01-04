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
  ): Promise<Project> {
    const project = await storage.getProject(projectId);
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
      const updated = await storage.updateProject(projectId, {
        currentStage: targetStage,
        status: targetStatus,
      });

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

  async resetProject(projectId: string): Promise<Project> {
    const updated = await storage.updateProject(projectId, {
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
    });

    if (!updated) throw new Error("Project not found or reset failed");
    return updated;
  }

  async deleteProject(projectId: string): Promise<void> {
    await storage.deleteProject(projectId);
    // Asynchronous, non-blocking directory deletion
    await this.provider.deleteDirectory(projectId);
  }

  async approveDraft(projectId: string): Promise<Project> {
    const project = await storage.getProject(projectId);
    if (!project) throw new Error("Project not found");

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

    return await this.advanceStage(projectId, 2, PROJECT_STATUS.ASSETS_READY);
  }
}

export const projectService = new ProjectService();
