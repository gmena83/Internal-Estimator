import { Router } from "express";
import { storage } from "../storage";

const router = Router();

async function pingService(
  url: string,
  method: "GET" | "HEAD" = "HEAD",
): Promise<{ status: "healthy" | "degraded" | "down"; latency: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Some APIs don't support HEAD or need specific endpoints.
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { "User-Agent": "HealthCheck/1.0" },
    });

    clearTimeout(timeout);

    // 404 is often "healthy" for a base URL check (server is up).
    // 401/403 means auth failed but service is reachable.
    // 5xx is down/degraded.
    if (response.status < 500) {
      return { status: "healthy", latency: Date.now() - start };
    } else {
      return { status: "degraded", latency: Date.now() - start };
    }
  } catch (error) {
    return { status: "down", latency: Date.now() - start };
  }
}

router.get("/", async (req, res) => {
  const services = [
    { name: "OpenAI", url: "https://api.openai.com/v1/models" },
    {
      name: "Gemini",
      url:
        "https://generativelanguage.googleapis.com/v1beta/models?key=" +
        (process.env.GEMINI_API_KEY || ""),
    },
    { name: "Perplexity", url: "https://api.perplexity.ai" },
    { name: "Gamma", url: "https://gamma.app/api" }, // Check docs?
    { name: "Resend", url: "https://api.resend.com" },
  ];

  const results = await Promise.all(
    services.map(async (s) => {
      // For specific APIs, we might need adjustments
      let url = s.url;
      let method: "GET" | "HEAD" = "GET";

      if (s.name === "OpenAI") method = "GET"; // Auth error is fine
      if (s.name === "Gemini") method = "GET"; // Auth error is fine

      const health = await pingService(url, method);

      // Log to DB
      await storage.updateApiHealth({
        service: s.name.toLowerCase(),
        status:
          health.status === "healthy"
            ? "online"
            : health.status === "degraded"
              ? "degraded"
              : "offline",
        latencyMs: health.latency,
      });

      return {
        provider: s.name,
        status: health.status,
        latency: health.latency,
        errorRate: 0,
      };
    }),
  );

  res.json(results);
});

router.get("/features", (req, res) => {
  res.json({
    gamma: !!process.env.GAMMA_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
  });
});

export default router;
