import { storage } from "./storage.js";
import { logApiUsage } from "./usage-tracker.js";

const geminiApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const geminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

export interface GeneratedImage {
  id: string;
  imageData: string;
  prompt: string;
  style: string;
  approved: boolean;
}

interface ImageGenerationResult {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
}

export async function generateProjectImages(
  projectTitle: string,
  projectDescription: string,
  industry: string,
  projectId: string,
  count: number = 10,
): Promise<ImageGenerationResult> {
  const startTime = Date.now();

  if (!geminiApiKey) {
    console.log("Gemini API key not configured, skipping image generation");
    return { success: false, images: [], error: "Gemini API key not configured" };
  }

  try {
    const images: GeneratedImage[] = [];
    const styles = [
      "professional corporate photography",
      "modern minimalist design",
      "tech-inspired futuristic",
      "clean business illustration",
      "dynamic abstract representation",
      "elegant gradient composition",
      "documentary style photography",
      "contemporary flat design",
      "sophisticated isometric view",
      "bold creative concept",
    ];

    const basePrompts = [
      `Professional cover image for ${projectTitle} project in the ${industry} industry`,
      `Business presentation thumbnail showing ${projectDescription.slice(0, 100)}`,
      `Corporate visual representing digital transformation and innovation`,
      `Modern tech solution visualization for enterprise clients`,
      `Professional service offering in ${industry} sector`,
      `Strategic consulting and development concept`,
      `Data-driven business solution illustration`,
      `Collaborative teamwork and project success`,
      `Technology integration and automation concept`,
      `ROI and business growth visualization`,
    ];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const prompt = `${basePrompts[i]}, ${styles[i]} style, high quality, professional, suitable for business proposal, no text overlay, clean composition`;

      try {
        const response = await fetch(
          `${geminiBaseUrl || "https://generativelanguage.googleapis.com"}/v1beta/models/gemini-2.0-flash-exp:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Generate a professional cover image: ${prompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["TEXT"],
              },
            }),
          },
        );

        if (!response.ok) {
          console.error(`Image generation failed for image ${i + 1}`);
          continue;
        }

        images.push({
          id: `img_${Date.now()}_${i}`,
          imageData: `placeholder_${i}`,
          prompt,
          style: styles[i],
          approved: false,
        });
      } catch (imgError) {
        console.error(`Error generating image ${i + 1}:`, imgError);
      }
    }

    const latencyMs = Date.now() - startTime;

    await storage.updateApiHealth({
      service: "nano_banana",
      status: images.length > 0 ? "online" : "error",
      latencyMs,
    });

    if (projectId) {
      logApiUsage({
        projectId,
        provider: "gemini",
        model: "gemini-2.0-flash-exp",
        inputTokens: count * 100,
        outputTokens: count * 500,
        operation: "image_generation",
      });
    }

    return {
      success: images.length > 0,
      images,
    };
  } catch (error) {
    console.error("Error generating images:", error);
    await storage.updateApiHealth({
      service: "nano_banana",
      status: "error",
      latencyMs: Date.now() - startTime,
    });
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function generateCoverImageWithApproval(
  projectTitle: string,
  projectDescription: string,
  industry: string,
  projectId: string,
): Promise<GeneratedImage[]> {
  const result = await generateProjectImages(
    projectTitle,
    projectDescription,
    industry,
    projectId,
    10,
  );

  return result.images;
}
