import { generatePresentation } from "../gamma-service.js";
import { generateCoverImageWithApproval } from "../image-service.js";
import type { Project } from "@internal/shared";

export class AssetService {
  async generateStage2Assets(project: Project): Promise<{
    proposalPdfUrl: string;
    internalReportPdfUrl: string;
    presentationUrl: string | null;
  }> {
    const proposalPdfUrl = `/api/projects/${project.id}/proposal.pdf`;
    const internalReportPdfUrl = `/api/projects/${project.id}/internal-report.pdf`;

    let presentationUrl: string | null = null;
    if (process.env.GAMMA_API_KEY) {
      try {
        const result = await generatePresentation(project);
        if (result.success && result.embedUrl) {
          presentationUrl = result.embedUrl;
        }
      } catch (err: any) {
        console.error("Gamma presentation generation failed:", err);
        // Throw proper error to be captured by UI
        throw new Error(`Gamma Presentation Failed: ${err.message || "Unknown error"}`);
      }
    } else {
      presentationUrl = project.coverImageUrl ? `https://gamma.app/embed/demo-presentation` : null;
    }

    return { proposalPdfUrl, internalReportPdfUrl, presentationUrl };
  }

  async generateCoverImages(project: Project) {
    const parsedData = project.parsedData as { mission?: string } | null;
    const industry = parsedData?.mission?.slice(0, 50) || "technology";

    return await generateCoverImageWithApproval(
      project.title,
      parsedData?.mission || project.title,
      industry,
      project.id,
    );
  }
}

export const assetService = new AssetService();
