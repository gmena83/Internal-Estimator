import { storage } from "./storage";
import { logApiUsage } from "./usage-tracker";

const pdfCoApiKey = process.env.PDF_CO_API_KEY;

interface PdfCoResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

export async function htmlToPdf(html: string, projectId?: string): Promise<Buffer | null> {
  const startTime = Date.now();

  if (!pdfCoApiKey) {
    console.log("PDF.co API key not configured, skipping HTML-to-PDF conversion");
    return null;
  }

  try {
    const response = await fetch("https://api.pdf.co/v1/pdf/convert/from/html", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": pdfCoApiKey,
      },
      body: JSON.stringify({
        html,
        name: "document.pdf",
        margins: "20px 30px 20px 30px",
        paperSize: "Letter",
        orientation: "Portrait",
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PDF.co API error:", errorText);

      await storage.updateApiHealth({
        service: "pdf_co",
        status: "error",
        latencyMs,
      });

      return null;
    }

    const data = await response.json();

    await storage.updateApiHealth({
      service: "pdf_co",
      status: "online",
      latencyMs,
    });

    if (projectId) {
      await logApiUsage({
        projectId,
        provider: "gemini",
        model: "pdf-co-html-to-pdf",
        inputTokens: Math.ceil(html.length / 4),
        outputTokens: 100,
        operation: "vibecode",
      });
    }

    if (data.url) {
      const pdfResponse = await fetch(data.url);
      if (pdfResponse.ok) {
        const arrayBuffer = await pdfResponse.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    return null;
  } catch (error) {
    console.error("Error converting HTML to PDF:", error);

    await storage.updateApiHealth({
      service: "pdf_co",
      status: "error",
      latencyMs: Date.now() - startTime,
    });

    return null;
  }
}

export function generateExecutionManualHtml(
  projectTitle: string,
  scenarioATitle: string,
  scenarioBTitle: string,
  phasesA: {
    phaseTitle: string;
    steps: { title: string; description: string; prompt?: string; tip?: string }[];
  }[],
  modulesB: { title: string; items: string[] }[],
): string {
  const renderPhasesA = () => {
    return phasesA
      .map(
        (phase) => `
      <div class="phase-block">
        <div class="phase-title">${phase.phaseTitle}</div>
        ${phase.steps
          .map(
            (step) => `
          <div class="step-item">
            <div class="step-title">${step.title}</div>
            <p class="step-desc">${step.description}</p>
            ${
              step.prompt
                ? `
              <div class="prompt-container">
                <div class="prompt-label">PROMPT</div>
                <div class="prompt-box">${step.prompt}</div>
              </div>
            `
                : ""
            }
            ${
              step.tip
                ? `
              <div class="tip-box">${step.tip}</div>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    `,
      )
      .join("");
  };

  const renderModulesB = () => {
    return modulesB
      .map(
        (module) => `
      <div class="module-card">
        <div class="module-header">${module.title}</div>
        <ol class="module-list">
          ${module.items
            .map(
              (item) => `
            <li class="nocode-step">${item}</li>
          `,
            )
            .join("")}
        </ol>
      </div>
    `,
      )
      .join("");
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Ejecucion</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; color: #0f172a; line-height: 1.5; margin: 0; padding: 40px; font-size: 13px; }
    
    /* Header */
    .header { border-bottom: 3px solid #0A3A5A; padding-bottom: 20px; margin-bottom: 30px; }
    .doc-type { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #00B8D4; font-weight: 700; }
    h1 { font-size: 22px; color: #0A3A5A; margin: 5px 0 0 0; font-weight: 800; }
    
    /* Section Headers */
    h2.section-header { 
        background: #0A3A5A; color: #fff; padding: 10px 15px; font-size: 14px; text-transform: uppercase;
        border-radius: 4px; margin-top: 40px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;
    }
    
    /* MANUAL A (High Tech) */
    .phase-block { margin-bottom: 35px; padding-left: 20px; border-left: 2px solid #e2e8f0; }
    .phase-title { font-size: 14px; color: #00B8D4; font-weight: 700; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .step-item { margin-bottom: 30px; }
    .step-title { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 5px; }
    .step-desc { margin: 0 0 10px 0; color: #475569; }
    
    /* TERMINAL PROMPT BOX */
    .prompt-container { margin: 12px 0; }
    .prompt-label { font-size: 9px; font-weight: 700; color: #64748b; margin-bottom: 4px; font-family: 'Inter', sans-serif; letter-spacing: 0.5px; }
    .prompt-box { 
        background: #1e293b; color: #a5f3fc; font-family: 'JetBrains Mono', monospace; 
        font-size: 11px; line-height: 1.6; padding: 15px; border-radius: 6px; 
        border: 1px solid #334155; white-space: pre-wrap; position: relative;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .prompt-box::before { content: "$"; position: absolute; left: 15px; color: #00B8D4; user-select: none; }
    .prompt-box { padding-left: 35px; } 
    
    .tip-box { background: #f0fdfa; border-left: 3px solid #0d9488; padding: 10px 12px; border-radius: 0 4px 4px 0; font-size: 12px; color: #115e59; margin-top: 10px; }

    /* MANUAL B (No Code) */
    .modules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .module-card { border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; overflow: hidden; }
    .module-header { background: #f8fafc; padding: 10px 15px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .module-list { padding: 15px 15px 15px 35px; margin: 0; }
    .nocode-step { margin-bottom: 12px; line-height: 1.4; color: #334155; }

    .page-break { page-break-before: always; }
    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>

  <div class="header">
    <div class="doc-type">TECHNICAL EXECUTION MANUAL // MENATECH</div>
    <h1>${projectTitle}</h1>
  </div>

  <p style="font-size: 14px; color: #475569; max-width: 700px;">
    This document contains the detailed technical roadmap for project implementation. 
    Includes engineering prompts for code generation and configuration logic for no-code tools.
  </p>

  <h2 class="section-header">
    <span>${scenarioATitle}</span>
    <span style="opacity: 0.7; font-size: 11px;">CURSOR | REPLIT | WINDSURF</span>
  </h2>
  
  ${renderPhasesA()}

  <div class="page-break"></div>
  
  <h2 class="section-header" style="background: #0891b2;">
    <span>${scenarioBTitle}</span>
    <span style="opacity: 0.7; font-size: 11px;">AIRTABLE | MAKE | SOFTR</span>
  </h2>

  <div class="modules-grid">
    ${renderModulesB()}
  </div>

  <div class="footer">
    Generated by Menatech AI Workflow | Confidential Internal Use | ${new Date().getFullYear()}
  </div>

</body>
</html>`;
}

export async function checkPdfCoHealth(): Promise<boolean> {
  if (!pdfCoApiKey) return false;

  const startTime = Date.now();
  try {
    const response = await fetch("https://api.pdf.co/v1/account/info", {
      headers: {
        "x-api-key": pdfCoApiKey,
      },
    });

    await storage.updateApiHealth({
      service: "pdf_co",
      status: response.ok ? "online" : "error",
      latencyMs: Date.now() - startTime,
    });

    return response.ok;
  } catch {
    await storage.updateApiHealth({
      service: "pdf_co",
      status: "offline",
      latencyMs: Date.now() - startTime,
    });
    return false;
  }
}
