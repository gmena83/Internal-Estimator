import { Project } from "@internal/shared";

export function getStageAwareResponse(_project: Project, _userMessage: string): string {
  const stage = _project.currentStage;
  const projectTitle = _project.title || "your project";

  const responses: Record<number, string[]> = {
    1: [
      `I'm currently putting together the dual-scenario estimate for "${projectTitle}". I'm looking at both a custom High-Tech build and a No-Code MVP approach.`,
      `Just gathering the final pieces for the "${projectTitle}" estimate. I'll have the feature breakdowns and ROI analysis ready soon.`,
    ],
    2: [
      `The assets for "${projectTitle}" are all set! You've got the proposal PDF and the presentation ready.`,
    ],
    3: [`The proposal for "${projectTitle}" is out in the wild!`],
    4: [`The execution guides for "${projectTitle}" are sharp and ready.`],
    5: [`We've crossed the finish line on planning for "${projectTitle}".`],
  };

  const stageResponses = responses[stage] || [`I'm here to help with "${projectTitle}".`];
  const index = _project.id.length % stageResponses.length;
  return stageResponses[index];
}

export function createDefaultScenarios(_project: Project): any {
  // Simplified version of the massive defaults in ai-service.ts
  return {
    scenarioA: { name: "High-Tech Custom", totalCost: 45000 },
    scenarioB: { name: "No-Code MVP", totalCost: 15000 },
    roiAnalysis: { costOfDoingNothing: 50000 },
  };
}
