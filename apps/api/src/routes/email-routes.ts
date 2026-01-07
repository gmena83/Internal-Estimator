import { Router } from "express";
import { storage } from "../storage";
import { aiService } from "../ai-service";
import { sendProposalEmail } from "../email-service";
import { generateProposalPdf } from "../pdf-service";
import { emailUpdateSchema } from "@shared/schema";

const router = Router();

// Update email content
router.post("/:id/update-email", async (req, res) => {
  try {
    const parsed = emailUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const updated = await storage.updateProject(
      req.params.id,
      {
        emailContent: parsed.data.emailContent,
      } as any,
      req.user?.id,
    );
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (_error) {
    res.status(500).json({ error: "Failed to update email content" });
  }
});

// Send proposal email
router.post("/:id/send-email", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const { recipientEmail, emailSubject, emailBody } = req.body;
    if (!recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ error: "Recipient, subject, and body are required" });
    }

    let finalBody = emailBody;
    if (project.presentationUrl) {
      finalBody += `\n\nView Presentation: ${project.presentationUrl}`;
    }

    // Generate Proposal PDF
    const pdfBuffer = await generateProposalPdf(project as any);
    const attachments = [
      {
        filename: `${project.title.replace(/[^a-z0-9]/gi, "_")}_proposal.pdf`,
        content: pdfBuffer,
      },
    ];

    const result = await sendProposalEmail(
      project as any,
      finalBody,
      recipientEmail,
      emailSubject,
      attachments,
    );
    if (result.success) {
      const updated = await storage.updateProject(
        req.params.id,
        {
          status: "email_sent",
          currentStage: 3, // Advance to Vibecoding Guide phase
          emailSentAt: new Date(),
        } as any,
        req.user?.id,
      );
      res.json({ success: true, project: updated });
    } else {
      res.status(500).json({ error: "Failed to send email" });
    }
  } catch (_error) {
    res.status(500).json({ error: "Failed to process email request" });
  }
});

// Regenerate email content with AI
router.post("/:id/regenerate-email", async (req, res) => {
  try {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const emailContent = await aiService.generateEmailContent(project as any);
    const updated = await storage.updateProject(
      req.params.id,
      { emailContent } as any,
      req.user?.id,
    );
    res.json(updated);
  } catch (_error) {
    res.status(500).json({ error: "Failed to regenerate email content" });
  }
});

export default router;
