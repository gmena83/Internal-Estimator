import { storage } from "./storage";
import { logApiUsage } from "./usage-tracker";
import type { Project } from "@shared/schema";

const gammaApiKey = process.env.GAMMA_API_KEY;

interface GammaPresentationResult {
  success: boolean;
  presentationUrl?: string;
  embedUrl?: string;
  error?: string;
}

export async function generatePresentation(project: Project): Promise<GammaPresentationResult> {
  const startTime = Date.now();

  if (!gammaApiKey) {
    console.log("Gamma API key not configured, skipping presentation generation");
    return { success: false, error: "Gamma API key not configured" };
  }

  try {
    const parsedData = project.parsedData as { mission?: string; objectives?: string[] } | null;
    const scenarioA = project.scenarioA as {
      timeline?: string;
      investment?: string;
      features?: string[];
    } | null;
    const scenarioB = project.scenarioB as {
      timeline?: string;
      investment?: string;
      features?: string[];
    } | null;
    const selectedScenario = project.selectedScenario === "A" ? scenarioA : scenarioB;

    const presentationContent = `
# ${project.title}

## Executive Summary
${parsedData?.mission || "Professional solution tailored to your business needs."}

## Project Objectives
${parsedData?.objectives?.map((obj: string) => `- ${obj}`).join("\n") || "- Deliver high-quality solution\n- Meet timeline requirements\n- Exceed client expectations"}

## Recommended Approach
${project.selectedScenario === "A" ? "High-Tech Custom Development" : "No-Code Rapid Deployment"}

### Timeline
${selectedScenario?.timeline || "To be determined based on project scope"}

### Investment
${selectedScenario?.investment || "Competitive pricing based on value delivered"}

### Key Features
${selectedScenario?.features?.map((f: string) => `- ${f}`).join("\n") || "- Core functionality\n- Integration capabilities\n- Scalable architecture"}

## Why Choose Us
- Industry expertise and proven track record
- Dedicated support and maintenance
- Transparent communication throughout the project

## Next Steps
1. Review this proposal
2. Schedule a follow-up discussion
3. Finalize project scope and timeline
4. Begin development
    `;

    const response = await fetch("https://api.gamma.app/v1/presentations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gammaApiKey}`,
      },
      body: JSON.stringify({
        title: project.title,
        content: presentationContent,
        template: "professional",
        coverImageUrl: project.coverImageUrl || undefined,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gamma API error:", errorText);

      await storage.updateApiHealth({
        service: "gamma",
        status: "error",
        latencyMs,
      });

      return {
        success: false,
        error: `Gamma API error: ${response.status}`,
      };
    }

    const data = await response.json();

    await storage.updateApiHealth({
      service: "gamma",
      status: "online",
      latencyMs,
    });

    logApiUsage({
      projectId: project.id,
      provider: "gemini",
      model: "gamma-presentation",
      inputTokens: presentationContent.length / 4,
      outputTokens: 100,
      operation: "vibecode",
    });

    return {
      success: true,
      presentationUrl: data.url || data.presentationUrl,
      embedUrl: data.embedUrl || `https://gamma.app/embed/${data.id}`,
    };
  } catch (error) {
    console.error("Error generating presentation:", error);

    await storage.updateApiHealth({
      service: "gamma",
      status: "error",
      latencyMs: Date.now() - startTime,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkGammaHealth(): Promise<boolean> {
  if (!gammaApiKey) return false;

  const startTime = Date.now();
  try {
    const response = await fetch("https://api.gamma.app/v1/health", {
      headers: {
        Authorization: `Bearer ${gammaApiKey}`,
      },
    });

    await storage.updateApiHealth({
      service: "gamma",
      status: response.ok ? "online" : "error",
      latencyMs: Date.now() - startTime,
    });

    return response.ok;
  } catch {
    await storage.updateApiHealth({
      service: "gamma",
      status: "offline",
      latencyMs: Date.now() - startTime,
    });
    return false;
  }
}
