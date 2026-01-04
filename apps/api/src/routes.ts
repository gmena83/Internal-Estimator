import type { Express } from "express";
import { type Server } from "http";
import path from "path";
import express from "express";
import { setupAuth } from "./auth";
import { qaLogger, responseNormalizer } from "./middleware/common";

// Domain Routers
import projectRouter from "./routes/project-routes";
import messageRouter from "./routes/message-routes";
import assetRouter from "./routes/asset-routes";
import knowledgeRouter from "./routes/knowledge-routes";
import diagnosticRouter from "./routes/diagnostic-routes";
import emailRouter from "./routes/email-routes";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // 1. Authentication Setup
  setupAuth(app);

  // 2. Global Middleware
  app.use(qaLogger);
  app.use(responseNormalizer);

  // 3. Domain API Mounting
  // Maintaining '/api/projects' base for compatibility
  app.use("/api/projects", projectRouter);
  app.use("/api/projects", messageRouter); // Mounts :projectId/messages, :projectId/chat
  app.use("/api/projects", assetRouter); // Mounts :projectId/proposal.pdf, etc.
  app.use("/api/projects", emailRouter); // Mounts :projectId/send-email, etc.

  app.use("/api/knowledge-base", knowledgeRouter);
  app.use("/api/diagnostics", diagnosticRouter);

  // 4. Static Asset Serving
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  return httpServer;
}
