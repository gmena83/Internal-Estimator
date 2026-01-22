import { storage } from "../storage.js";
import type { Project } from "@internal/shared";

export class KnowledgeService {
  async indexProjectEstimate(project: Project) {
    if (project.estimateMarkdown) {
      await storage.createKnowledgeEntry({
        projectId: project.id,
        category: "estimate",
        content: project.estimateMarkdown,
        metadata: {
          scenarioA: project.scenarioA,
          scenarioB: project.scenarioB,
          roiAnalysis: project.roiAnalysis,
          versionDate: new Date().toISOString(),
        },
      });
    }

    if (project.researchMarkdown) {
      await storage.createKnowledgeEntry({
        projectId: project.id,
        category: "research",
        content: project.researchMarkdown,
        metadata: { source: "perplexity", versionDate: new Date().toISOString() },
      });
    }
  }
}

export const knowledgeService = new KnowledgeService();
