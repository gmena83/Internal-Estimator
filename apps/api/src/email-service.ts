import type { Project } from "@internal/shared";
import { storage } from "./storage.js";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface Scenario {
  name?: string;
  totalCost?: number;
  timeline?: string;
  pros?: string[];
}

export async function sendProposalEmail(
  project: Project,
  emailContent: string,
  recipientEmail?: string,
  emailSubject?: string,
  attachments?: { filename: string; content: Buffer }[],
): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const startTime = Date.now();

  if (!resendApiKey) {
    console.log("Resend API key not configured - simulating email send");
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const selectedScenario =
      project.selectedScenario === "A"
        ? (project.scenarioA as Scenario)
        : (project.scenarioB as Scenario);

    const htmlContent = generateHtmlEmail(project, selectedScenario, emailContent);
    const subject = emailSubject || `Project Proposal: ${project.title}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ISI Agent <onboarding@resend.dev>",
        to: recipientEmail || project.clientEmail || "client@example.com",
        subject,
        html: htmlContent,
        text: emailContent,
        headers: {
          "X-Project-Id": project.id,
        },
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          content: a.content.toString("base64"), // Resend expects base64 for Buffer
        })),
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      await storage.updateApiHealth({
        service: "resend",
        status: "error",
        latencyMs,
      });
      return {
        success: false,
        error: errorData.message || "Failed to send email",
      };
    }

    const data = await response.json();

    await storage.updateApiHealth({
      service: "resend",
      status: "online",
      latencyMs,
    });

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error("Email send error:", error);
    await storage.updateApiHealth({
      service: "resend",
      status: "error",
      latencyMs: Date.now() - startTime,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateHtmlEmail(
  project: Project,
  scenario: Scenario | null,
  textContent: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Proposal: ${project.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .highlight-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .metric { display: inline-block; margin-right: 30px; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
    .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .footer a { color: #60a5fa; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">Project Proposal</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${project.title}</p>
  </div>
  
  <div class="content">
    <p>Dear ${project.clientName || "Team"},</p>
    
    ${textContent
      .split("\n")
      .map((p) => `<p>${p}</p>`)
      .join("")}
    
    ${
      scenario
        ? `
    <div class="highlight-box">
      <h3 style="margin-top: 0;">Recommended Approach: ${scenario.name || "Selected Scenario"}</h3>
      <div style="margin-top: 15px;">
        <div class="metric">
          <div class="metric-label">Investment</div>
          <div class="metric-value">${scenario.totalCost ? `$${scenario.totalCost.toLocaleString()}` : "TBD"}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Timeline</div>
          <div class="metric-value">${scenario.timeline || "TBD"}</div>
        </div>
      </div>
      ${
        scenario.pros?.length
          ? `
      <div style="margin-top: 15px;">
        <strong>Key Benefits:</strong>
        <ul style="margin: 5px 0;">
          ${scenario.pros.map((p) => `<li>${p}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }
    
    <p style="text-align: center;">
      <a href="#" class="cta-button">View Full Proposal</a>
    </p>
  </div>
  
  <div class="footer">
    <p>Generated by ISI Agent - Your Autonomous Business Development Partner</p>
    <p><a href="#">Unsubscribe</a> | <a href="#">View in Browser</a></p>
  </div>
</body>
</html>
  `;
}
