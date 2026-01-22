import type { Express } from "express";
import { type Server } from "http";
import path from "path";
import express from "express";
import { setupAuth, requireAuth } from "./auth";
import { qaLogger, responseNormalizer } from "./middleware/common";

// Domain Routers
import projectRouter from "./routes/project-routes";
import messageRouter from "./routes/message-routes";
import assetRouter from "./routes/asset-routes";
import knowledgeRouter from "./routes/knowledge-routes";
import diagnosticRouter from "./routes/diagnostic-routes";
import emailRouter from "./routes/email-routes";
import adminRouter from "./routes/admin-routes";
import learningRouter from "./routes/learning-routes";

import healthRouter from "./routes/health-routes";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // 1. Authentication Setup
  setupAuth(app);

  // 2. Global Middleware
  app.use(qaLogger);
  app.use(responseNormalizer);

  // 3. Domain API Mounting
  // Maintaining '/api/projects' base for compatibility
  app.use("/api/projects", requireAuth, projectRouter);
  app.use("/api/projects", requireAuth, messageRouter); // Mounts :projectId/messages, :projectId/chat
  app.use("/api/projects", requireAuth, assetRouter); // Mounts :projectId/proposal.pdf, etc.
  app.use("/api/projects", requireAuth, emailRouter); // Mounts :projectId/send-email, etc.

  app.use("/api/knowledge-base", requireAuth, knowledgeRouter);
  app.use("/api/diagnostics", requireAuth, diagnosticRouter);
  app.use("/api/admin", requireAuth, adminRouter);
  app.use("/api/learn", requireAuth, learningRouter);

  // Health Check
  app.use("/api/health", healthRouter);

  // 4. Static Asset Serving
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use(
    "/uploads",
    (req, res, next) => {
      if (req.path.endsWith(".html") || req.path.endsWith(".htm") || req.path.endsWith(".js")) {
        return res.status(403).send("Access Denied");
      }
      next();
    },
    express.static(uploadsDir),
  );

  return httpServer;
}
