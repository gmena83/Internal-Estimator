import { Router } from "express";
import { storage } from "../storage";
import { aiService } from "../ai-service";
import { insertMessageSchema } from "@internal/shared";

const router: Router = Router();

// Get messages for project
router.get("/:projectId/messages", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const messages = await storage.getMessages(req.params.projectId);
    res.json(messages);
  } catch (_error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * Unified Message Endpoint
 * Supports both standard JSON response and Streaming (SSE).
 * Set 'Accept: text/event-stream' or 'stream=true' query param for streaming.
 */
router.post("/:projectId/messages", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await storage.getProject(projectId, req.user?.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isStreaming = req.headers.accept === "text/event-stream" || req.query.stream === "true";

    const parsed = insertMessageSchema.safeParse({
      ...req.body,
      projectId,
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    // 1. Perspective: Save user message immediately
    const userMessage = await storage.createMessage(parsed.data);

    if (isStreaming) {
      // --- STREAMING MODE (SSE) ---
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullContent = "";
      try {
        const stream = aiService.streamMessage(project, parsed.data.content);

        for await (const chunk of stream) {
          fullContent += chunk.content;
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        // Save the final assistant message to storage
        await storage.createMessage({
          projectId,
          role: "assistant",
          content: fullContent,
          stage: project.currentStage,
        });

        res.write("data: [DONE]\n\n");
        res.end();
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
        res.end();
      }
    } else {
      // --- STANDARD JSON MODE ---
      try {
        const response = await aiService.processMessage(project, parsed.data.content);
        const assistantMessage = await storage.createMessage({
          projectId,
          role: "assistant",
          content: response.content,
          stage: response.stage,
        });
        res.json({ userMessage, assistantMessage });
      } catch (_aiError) {
        const errorMessage = await storage.createMessage({
          projectId,
          role: "assistant",
          content: "I encountered an error processing your request.",
          stage: project.currentStage,
        });
        res.json({ userMessage, assistantMessage: errorMessage });
      }
    }
  } catch (_error) {
    res.status(500).json({ error: "Failed to process message" });
  }
});

// DEPRECATED: Standardizing on POST /messages
router.post("/:projectId/chat", (_req, res) => {
  res.status(301).json({
    error: "Endpoint deprecated",
    message: "Please use POST /api/projects/:projectId/messages?stream=true instead.",
  });
});

export default router;
