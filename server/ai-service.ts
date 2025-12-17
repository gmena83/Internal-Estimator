import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { storage } from "./storage";
import type { Project, Scenario, ROIAnalysis } from "@shared/schema";

// Check if AI integrations are available
const hasGeminiIntegration = !!(process.env.AI_INTEGRATIONS_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL);
const hasAnthropicIntegration = !!(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL);
const hasOpenAIIntegration = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);

// Initialize AI clients using Replit AI Integrations (no API keys required, billed to credits)
const gemini = hasGeminiIntegration
  ? new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    })
  : null;

const anthropic = hasAnthropicIntegration
  ? new Anthropic({
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    })
  : null;

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = hasOpenAIIntegration
  ? new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    })
  : null;

console.log(`AI Integrations: Gemini=${hasGeminiIntegration}, Anthropic=${hasAnthropicIntegration}, OpenAI=${hasOpenAIIntegration}`);

// Track API health
async function trackHealth(service: string, startTime: number, error?: Error) {
  const latencyMs = Date.now() - startTime;
  await storage.updateApiHealth({
    service,
    status: error ? "degraded" : "online",
    latencyMs,
    errorMessage: error?.message,
  });
}

export const aiService = {
  // Process raw input from user (email/notes)
  async processRawInput(projectId: string, rawInput: string): Promise<void> {
    const startTime = Date.now();
    try {
      let parsedData;
      
      if (gemini) {
        try {
          // Use Gemini to extract key information
          const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert Business Analyst specializing in software development. 
Analyze the following client request/email/notes and extract key project information.

INPUT:
${rawInput}

Extract and return a JSON object with the following structure:
{
  "mission": "High-level 'why' of the project",
  "objectives": ["List of specific, actionable goals"],
  "constraints": ["Any limitations, deadlines, or requirements mentioned"],
  "clientName": "Name of the client if mentioned",
  "estimatedBudget": "Any budget mentioned or null",
  "timeline": "Any timeline mentioned or null",
  "techPreferences": ["Any technology preferences mentioned"]
}

Return ONLY the JSON object, no additional text.`,
          });

          await trackHealth("gemini", startTime);

          const text = response.text || "";
          try {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            parsedData = extractBasicInfo(rawInput);
          }
        } catch (aiError) {
          await trackHealth("gemini", startTime, aiError as Error);
          console.error("Gemini AI error, using fallback:", aiError);
          parsedData = extractBasicInfo(rawInput);
        }
      } else {
        // No AI available, use basic extraction
        parsedData = extractBasicInfo(rawInput);
      }

      // Update project with parsed data
      await storage.updateProject(projectId, {
        parsedData,
        clientName: parsedData?.clientName || undefined,
      });

      // Generate initial estimate
      const project = await storage.getProject(projectId);
      if (project) {
        await this.generateEstimate(project);
      }
    } catch (error) {
      console.error("Error processing raw input:", error);
      // Don't throw - still try to generate estimate with defaults
      const project = await storage.getProject(projectId);
      if (project) {
        await this.generateEstimate(project);
      }
    }
  },

  // Process a chat message
  async processMessage(
    project: Project,
    userMessage: string
  ): Promise<{ content: string; stage: number }> {
    const startTime = Date.now();
    try {
      // If this is new input for a project, process it
      if (project.currentStage === 1 && !project.estimateMarkdown) {
        // Store as raw input and process
        await storage.updateProject(project.id, { rawInput: userMessage });
        await this.processRawInput(project.id, userMessage);
        
        return {
          content: `I've analyzed your input and extracted the key project requirements. I'm now generating a dual-scenario estimate comparing a High-Tech custom solution with a No-Code MVP approach.

You can view the estimate in the "Estimate" tab once it's ready. The estimate will include:
- Two scenario comparisons (High-Tech vs No-Code)
- Detailed feature breakdown
- Cost and timeline analysis
- ROI calculation including the "Cost of Doing Nothing"

Once you review the estimate, you can approve it to proceed to asset generation.`,
          stage: 1,
        };
      }

      // Try OpenAI for generic response
      if (openai) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
              {
                role: "system",
                content: `You are ISI, an autonomous Business Development & Project Architecture Agent. You help users create project estimates, proposals, and execution guides.

Current project: ${project.title}
Current stage: ${project.currentStage}
Project status: ${project.status}

Be helpful, professional, and concise. Guide users through the estimate and proposal workflow.`,
              },
              {
                role: "user",
                content: userMessage,
              },
            ],
            max_completion_tokens: 1024,
          });

          await trackHealth("openai", startTime);

          return {
            content: response.choices[0]?.message?.content || "I understand. How can I help you further?",
            stage: project.currentStage,
          };
        } catch (aiError) {
          await trackHealth("openai", startTime, aiError as Error);
          console.error("OpenAI error, using fallback:", aiError);
        }
      }

      // Fallback response when AI is unavailable
      return {
        content: getDefaultChatResponse(project, userMessage),
        stage: project.currentStage,
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        content: "I'm processing your request. Please check the Estimate tab for updates, or try again in a moment.",
        stage: project.currentStage,
      };
    }
  },

  // Generate dual-scenario estimate
  async generateEstimate(project: Project): Promise<{
    markdown: string;
    scenarioA: Scenario;
    scenarioB: Scenario;
    roiAnalysis: ROIAnalysis;
    parsedData: any;
  }> {
    const startTime = Date.now();
    const parsedData = project.parsedData as any || {};
    let scenarios;
    
    try {
      if (gemini) {
        try {
          const context = `
Project Title: ${project.title}
Mission: ${parsedData?.mission || "Software development project"}
Objectives: ${JSON.stringify(parsedData?.objectives || [])}
Constraints: ${JSON.stringify(parsedData?.constraints || [])}
Raw Input: ${project.rawInput || "No additional context provided"}
          `;

          // Use Gemini for complex reasoning on scenarios
          const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a Lead AI Solutions Architect creating a "Dual Scenario" project estimate.

${context}

Generate a comprehensive project estimate with TWO scenarios:

SCENARIO A (High-Tech/Custom):
- Full custom code development
- Complete ownership of codebase
- Higher initial cost but more flexibility
- Best for complex, long-term projects

SCENARIO B (No-Code/MVP):
- Use no-code/low-code platforms where possible
- Faster time to market
- Lower initial cost
- Best for validation and quick launches

For each scenario, include:
1. Feature list with estimated hours
2. Tech stack recommendation
3. Timeline (in weeks)
4. Total cost calculation (use $150/hr for custom dev, $75/hr for no-code)
5. Pros and cons
6. Mark one as recommended based on the project context

Also calculate ROI Analysis:
- Cost of Doing Nothing (estimated manual operational cost per year)
- Projected savings from automation
- Payback period in months
- 3-year ROI percentage

Return a JSON object with this structure:
{
  "scenarioA": {
    "name": "High-Tech Custom",
    "description": "Full custom development...",
    "features": ["Feature 1", "Feature 2"],
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "timeline": "8-10 weeks",
    "totalCost": 45000,
    "hourlyRate": 150,
    "totalHours": 300,
    "pros": ["Full ownership", "Customizable"],
    "cons": ["Higher cost", "Longer timeline"],
    "recommended": false
  },
  "scenarioB": {
    "name": "No-Code MVP",
    "description": "Rapid development using...",
    "features": ["Feature 1", "Feature 2"],
    "techStack": ["Airtable", "Zapier", "Webflow"],
    "timeline": "3-4 weeks",
    "totalCost": 15000,
    "hourlyRate": 75,
    "totalHours": 200,
    "pros": ["Fast launch", "Lower cost"],
    "cons": ["Less customization", "Platform limits"],
    "recommended": true
  },
  "roiAnalysis": {
    "costOfDoingNothing": 50000,
    "manualOperationalCost": 40000,
    "projectedSavings": 35000,
    "paybackPeriodMonths": 6,
    "threeYearROI": 400
  }
}

Return ONLY the JSON object.`,
          });

          await trackHealth("gemini", startTime);

          const text = response.text || "";
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              scenarios = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error("Failed to parse scenarios:", parseError);
            scenarios = createDefaultScenarios(project);
          }
        } catch (aiError) {
          await trackHealth("gemini", startTime, aiError as Error);
          console.error("Gemini error, using fallback scenarios:", aiError);
          scenarios = createDefaultScenarios(project);
        }
      } else {
        // No AI available, use defaults
        scenarios = createDefaultScenarios(project);
      }

      if (!scenarios) {
        scenarios = createDefaultScenarios(project);
      }

      // Generate markdown summary
      const markdown = generateEstimateMarkdown(project, scenarios);

      // Update project - always persist the result
      await storage.updateProject(project.id, {
        estimateMarkdown: markdown,
        scenarioA: scenarios.scenarioA,
        scenarioB: scenarios.scenarioB,
        roiAnalysis: scenarios.roiAnalysis,
        parsedData: { ...parsedData, lastUpdated: new Date().toISOString() },
        status: "estimate_generated",
      });

      return {
        markdown,
        scenarioA: scenarios.scenarioA,
        scenarioB: scenarios.scenarioB,
        roiAnalysis: scenarios.roiAnalysis,
        parsedData,
      };
    } catch (error) {
      console.error("Error generating estimate:", error);
      // Still generate with defaults
      scenarios = createDefaultScenarios(project);
      const markdown = generateEstimateMarkdown(project, scenarios);
      
      await storage.updateProject(project.id, {
        estimateMarkdown: markdown,
        scenarioA: scenarios.scenarioA,
        scenarioB: scenarios.scenarioB,
        roiAnalysis: scenarios.roiAnalysis,
        parsedData: { ...parsedData, lastUpdated: new Date().toISOString() },
        status: "estimate_generated",
      });

      return {
        markdown,
        scenarioA: scenarios.scenarioA,
        scenarioB: scenarios.scenarioB,
        roiAnalysis: scenarios.roiAnalysis,
        parsedData,
      };
    }
  },

  // Generate email content
  async generateEmail(project: Project): Promise<string> {
    const startTime = Date.now();
    const selectedScenario = project.selectedScenario === "A" 
      ? project.scenarioA 
      : project.scenarioB;

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "system",
              content: `You are a professional business development specialist. Write a compelling proposal email that:
- Is warm but professional
- Highlights the value proposition
- Creates urgency without being pushy
- Includes a clear call to action`,
            },
            {
              role: "user",
              content: `Write a proposal email for this project:

Project: ${project.title}
Client: ${project.clientName || "the client"}
Selected Scenario: ${JSON.stringify(selectedScenario)}
ROI Analysis: ${JSON.stringify(project.roiAnalysis)}

Keep it concise (under 300 words) and end with a clear next step.`,
            },
          ],
          max_completion_tokens: 1024,
        });

        await trackHealth("openai", startTime);

        return response.choices[0]?.message?.content || generateDefaultEmail(project);
      } catch (aiError) {
        await trackHealth("openai", startTime, aiError as Error);
        console.error("OpenAI error, using fallback email:", aiError);
      }
    }
    
    return generateDefaultEmail(project);
  },

  // Generate Vibecoding execution guides
  async generateVibeGuides(project: Project): Promise<{
    guideA: string;
    guideB: string;
  }> {
    const startTime = Date.now();
    const scenarioA = project.scenarioA as Scenario;
    const scenarioB = project.scenarioB as Scenario;

    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: `You are creating "Vibecoding" execution guides - developer cheat sheets with copy-paste prompts for AI coding assistants like Cursor, Windsurf, or Replit.

Project: ${project.title}
Mission: ${(project.parsedData as any)?.mission || "Build a software solution"}

Create TWO separate guides:

MANUAL A (High-Code Approach):
Tech Stack: ${JSON.stringify(scenarioA?.techStack || ["React", "Node.js", "PostgreSQL"])}
Features: ${JSON.stringify(scenarioA?.features || [])}

MANUAL B (No-Code Approach):
Tech Stack: ${JSON.stringify(scenarioB?.techStack || ["Airtable", "Zapier", "Webflow"])}
Features: ${JSON.stringify(scenarioB?.features || [])}

For each manual, provide:
1. Project setup instructions
2. Step-by-step implementation guide
3. "Vibecode Prompts" - exact prompts to paste into AI coding assistants
4. Testing checklist

Format each vibecode prompt in a code block with the label "VIBECODE PROMPT:"

Return as JSON:
{
  "guideA": "# Manual A: High-Code Approach\\n...",
  "guideB": "# Manual B: No-Code Approach\\n..."
}`,
            },
          ],
        });

        await trackHealth("claude", startTime);

        const content = response.content[0];
        if (content.type === "text") {
          try {
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            return {
              guideA: `# Manual A: High-Code Approach\n\n${content.text}`,
              guideB: "# Manual B: No-Code Approach\n\nGuide pending generation.",
            };
          }
        }
      } catch (aiError) {
        await trackHealth("claude", startTime, aiError as Error);
        console.error("Claude error, using fallback guides:", aiError);
      }
    }

    // Fallback guides
    return generateDefaultVibeGuides(project, scenarioA, scenarioB);
  },

  // Generate PM Breakdown
  async generatePMBreakdown(project: Project): Promise<any> {
    const startTime = Date.now();
    const selectedScenario = project.selectedScenario === "A"
      ? project.scenarioA
      : project.scenarioB;

    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Create a detailed Project Management breakdown for:

Project: ${project.title}
Selected Approach: ${project.selectedScenario === "A" ? "High-Code Custom" : "No-Code MVP"}
Scenario Details: ${JSON.stringify(selectedScenario)}
Timeline: ${(selectedScenario as Scenario)?.timeline || "8 weeks"}

Create phases with:
- Phase number and name
- Objectives list
- Tasks with estimated hours
- Deliverables
- Dependencies

Return as JSON:
{
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Discovery & Planning",
      "objectives": ["Gather requirements", "Define scope"],
      "durationDays": 5,
      "tasks": [
        {"id": "1.1", "name": "Stakeholder interviews", "estimatedHours": 8},
        {"id": "1.2", "name": "Requirements documentation", "estimatedHours": 12}
      ],
      "deliverables": ["Project brief", "Technical spec"],
      "dependencies": []
    }
  ]
}`,
        });

        await trackHealth("gemini", startTime);

        const text = response.text || "";
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error("Failed to parse PM breakdown:", parseError);
        }
      } catch (aiError) {
        await trackHealth("gemini", startTime, aiError as Error);
        console.error("Gemini error, using fallback PM breakdown:", aiError);
      }
    }

    // Return default structure
    return generateDefaultPMBreakdown(project);
  },
};

function createDefaultScenarios(project: Project): {
  scenarioA: Scenario;
  scenarioB: Scenario;
  roiAnalysis: ROIAnalysis;
} {
  return {
    scenarioA: {
      name: "High-Tech Custom",
      description: "Full custom development with complete code ownership",
      features: ["Custom backend API", "React frontend", "Database design", "Authentication", "Admin dashboard"],
      techStack: ["React", "Node.js", "PostgreSQL", "TypeScript"],
      timeline: "8-10 weeks",
      totalCost: 45000,
      hourlyRate: 150,
      totalHours: 300,
      pros: ["Full code ownership", "Complete customization", "Scalable architecture"],
      cons: ["Higher upfront cost", "Longer development time"],
      recommended: false,
    },
    scenarioB: {
      name: "No-Code MVP",
      description: "Rapid development using no-code/low-code platforms",
      features: ["Database (Airtable)", "Workflows (Zapier)", "Frontend (Webflow)", "User management", "Basic analytics"],
      techStack: ["Airtable", "Zapier", "Webflow", "Make"],
      timeline: "3-4 weeks",
      totalCost: 15000,
      hourlyRate: 75,
      totalHours: 200,
      pros: ["Fast time to market", "Lower initial cost", "Easy to iterate"],
      cons: ["Platform limitations", "Recurring platform costs"],
      recommended: true,
    },
    roiAnalysis: {
      costOfDoingNothing: 50000,
      manualOperationalCost: 40000,
      projectedSavings: 35000,
      paybackPeriodMonths: 6,
      threeYearROI: 400,
    },
  };
}

function generateEstimateMarkdown(project: Project, scenarios: any): string {
  const { scenarioA, scenarioB, roiAnalysis } = scenarios;
  const parsedData = project.parsedData as any || {};

  return `# Project Estimate: ${project.title}

## Executive Summary

This estimate presents two strategic approaches for your project, allowing you to choose the path that best aligns with your business goals, timeline, and budget.

${parsedData?.mission ? `### Mission\n${parsedData.mission}\n` : ""}

${parsedData?.objectives?.length ? `### Objectives\n${parsedData.objectives.map((o: string) => `- ${o}`).join("\n")}\n` : ""}

---

## Scenario Comparison

### Scenario A: ${scenarioA?.name || "High-Tech Custom"}

**${scenarioA?.description || "Full custom development"}**

| Metric | Value |
|--------|-------|
| Timeline | ${scenarioA?.timeline || "8-10 weeks"} |
| Total Hours | ${scenarioA?.totalHours || 300} |
| Hourly Rate | $${scenarioA?.hourlyRate || 150} |
| **Total Investment** | **$${(scenarioA?.totalCost || 45000).toLocaleString()}** |

**Tech Stack:** ${scenarioA?.techStack?.join(", ") || "React, Node.js, PostgreSQL"}

**Features:**
${scenarioA?.features?.map((f: string) => `- ${f}`).join("\n") || "- Custom development"}

---

### Scenario B: ${scenarioB?.name || "No-Code MVP"}

**${scenarioB?.description || "Rapid development using no-code platforms"}**

| Metric | Value |
|--------|-------|
| Timeline | ${scenarioB?.timeline || "3-4 weeks"} |
| Total Hours | ${scenarioB?.totalHours || 200} |
| Hourly Rate | $${scenarioB?.hourlyRate || 75} |
| **Total Investment** | **$${(scenarioB?.totalCost || 15000).toLocaleString()}** |

**Tech Stack:** ${scenarioB?.techStack?.join(", ") || "Airtable, Zapier, Webflow"}

**Features:**
${scenarioB?.features?.map((f: string) => `- ${f}`).join("\n") || "- No-code solution"}

---

## ROI Analysis

| Metric | Annual Value |
|--------|--------------|
| Cost of Doing Nothing | $${(roiAnalysis?.costOfDoingNothing || 50000).toLocaleString()}/year |
| Manual Operational Cost | $${(roiAnalysis?.manualOperationalCost || 40000).toLocaleString()}/year |
| Projected Savings | $${(roiAnalysis?.projectedSavings || 35000).toLocaleString()}/year |
| Payback Period | ${roiAnalysis?.paybackPeriodMonths || 6} months |
| 3-Year ROI | ${roiAnalysis?.threeYearROI || 400}% |

---

## Recommendation

${scenarioB?.recommended ? 
  `Based on the analysis, we recommend **Scenario B: ${scenarioB.name}** for faster time-to-market and lower initial investment. This approach allows you to validate your concept quickly before committing to a larger custom development effort.` :
  `Based on the analysis, we recommend **Scenario A: ${scenarioA?.name}** for full control and long-term scalability. This approach provides complete ownership of your solution with maximum flexibility for future enhancements.`
}

---

*Estimate generated by ISI Agent | ${new Date().toLocaleDateString()}*
`;
}

// Helper function to extract basic info without AI
function extractBasicInfo(rawInput: string): any {
  const lines = rawInput.split('\n').filter(l => l.trim());
  const objectives: string[] = [];
  
  // Extract bullet points as objectives
  lines.forEach(line => {
    if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./)) {
      objectives.push(line.trim().replace(/^[-*\d.]\s*/, ''));
    }
  });

  // Try to extract client name from common patterns
  let clientName: string | null = null;
  const clientMatch = rawInput.match(/(?:from|client|company|for)\s*:?\s*([A-Z][a-zA-Z\s]+)/i);
  if (clientMatch) {
    clientName = clientMatch[1].trim();
  }

  return {
    mission: lines[0]?.substring(0, 200) || "Software development project",
    objectives: objectives.length > 0 ? objectives.slice(0, 5) : ["Define requirements", "Build solution", "Deploy and iterate"],
    constraints: [],
    clientName,
    estimatedBudget: null,
    timeline: null,
    techPreferences: [],
  };
}

// Fallback chat response
function getDefaultChatResponse(project: Project, userMessage: string): string {
  const stage = project.currentStage;
  
  if (stage === 1) {
    if (project.estimateMarkdown) {
      return `Your estimate is ready. You can view it in the "Estimate" tab and compare the two scenarios in the "Scenarios" tab. When you're satisfied, click "Approve & Generate PDF" to proceed to the next stage.`;
    }
    return `I'll analyze your input and generate a dual-scenario estimate. This will include both a High-Tech Custom approach and a No-Code MVP option, along with ROI analysis.`;
  } else if (stage === 2) {
    return `Your production assets are ready. You can download the proposal PDF and view the presentation. When ready, click "Send Email" to share the proposal with your client.`;
  } else if (stage === 3) {
    return `The proposal has been sent. You can track client engagement and generate execution guides when the project is accepted.`;
  } else if (stage === 4) {
    return `Your Vibecoding execution guides are ready. These contain step-by-step implementation instructions and prompts you can use with AI coding assistants.`;
  } else if (stage === 5) {
    return `The project management breakdown is complete. You can view the phases, tasks, and deliverables for your selected approach.`;
  }
  
  return `How can I help you with your project "${project.title}"?`;
}

// Fallback email content
function generateDefaultEmail(project: Project): string {
  const selectedScenario = project.selectedScenario === "A" ? project.scenarioA : project.scenarioB;
  const scenario = selectedScenario as Scenario;
  
  return `Subject: Project Proposal: ${project.title}

Dear ${project.clientName || "Team"},

Thank you for the opportunity to discuss your project. I'm excited to share our proposal for ${project.title}.

After careful analysis, we recommend the ${scenario?.name || "selected"} approach, which offers:
${scenario?.pros?.map(p => `- ${p}`).join('\n') || '- Optimized solution for your needs'}

Investment: ${scenario?.totalCost ? `$${scenario.totalCost.toLocaleString()}` : 'To be discussed'}
Timeline: ${scenario?.timeline || '6-8 weeks'}

The attached proposal contains detailed information about features, timeline, and our recommended approach.

I'd love to schedule a call to walk you through the proposal and answer any questions.

Best regards,
ISI Agent

---
This proposal was generated by ISI, your autonomous Business Development Agent.`;
}

// Fallback vibe guides
function generateDefaultVibeGuides(project: Project, scenarioA: Scenario | null, scenarioB: Scenario | null): { guideA: string; guideB: string } {
  const parsedData = project.parsedData as any || {};
  
  const guideA = `# Manual A: High-Code Approach

## Project: ${project.title}
${parsedData?.mission ? `Mission: ${parsedData.mission}` : ''}

## Tech Stack
${scenarioA?.techStack?.map(t => `- ${t}`).join('\n') || '- React\n- Node.js\n- PostgreSQL'}

## Setup Instructions

### Step 1: Initialize Project
\`\`\`
VIBECODE PROMPT:
Create a new full-stack application with React frontend and Node.js/Express backend.
Set up PostgreSQL database with Drizzle ORM.
Include TypeScript, ESLint, and Prettier configuration.
\`\`\`

### Step 2: Database Schema
\`\`\`
VIBECODE PROMPT:
Create the database schema for: ${project.title}
Include tables for: ${scenarioA?.features?.slice(0, 3).join(', ') || 'users, data, settings'}
Use Drizzle ORM with PostgreSQL.
\`\`\`

### Step 3: API Routes
\`\`\`
VIBECODE PROMPT:
Create RESTful API endpoints for the main entities.
Include proper validation, error handling, and authentication.
\`\`\`

### Step 4: Frontend Components
\`\`\`
VIBECODE PROMPT:
Build the main UI components using React and Tailwind CSS.
Include responsive design and proper accessibility.
\`\`\`

## Testing Checklist
- [ ] All API endpoints return correct responses
- [ ] Database migrations work correctly
- [ ] Frontend components render properly
- [ ] Authentication flow works
- [ ] Error handling is in place
`;

  const guideB = `# Manual B: No-Code Approach

## Project: ${project.title}
${parsedData?.mission ? `Mission: ${parsedData.mission}` : ''}

## Tech Stack
${scenarioB?.techStack?.map(t => `- ${t}`).join('\n') || '- Airtable\n- Zapier\n- Webflow'}

## Setup Instructions

### Step 1: Database Setup (Airtable)
1. Create a new Airtable base
2. Define tables for your main entities
3. Set up relationships between tables
4. Create views for different use cases

### Step 2: Automation (Zapier/Make)
1. Connect your Airtable to Zapier
2. Set up triggers for new records
3. Create automated notifications
4. Build approval workflows

### Step 3: Frontend (Webflow/Softr)
1. Design your interface
2. Connect to Airtable via API
3. Create forms for data entry
4. Set up authentication

### Step 4: Integration
1. Test all automations
2. Verify data flows correctly
3. Set up monitoring

## Testing Checklist
- [ ] Data syncs correctly between tools
- [ ] Automations trigger properly
- [ ] User interface is functional
- [ ] Access controls work
- [ ] Error notifications are set up
`;

  return { guideA, guideB };
}

// Fallback PM breakdown
function generateDefaultPMBreakdown(project: Project): any {
  return {
    phases: [
      {
        phaseNumber: 1,
        phaseName: "Discovery & Planning",
        objectives: ["Define project scope", "Gather requirements", "Create project roadmap"],
        durationDays: 5,
        tasks: [
          { id: "1.1", name: "Stakeholder interviews", estimatedHours: 8 },
          { id: "1.2", name: "Requirements documentation", estimatedHours: 12 },
          { id: "1.3", name: "Technical specification", estimatedHours: 16 },
        ],
        deliverables: ["Project brief", "Technical spec", "Timeline"],
        dependencies: [],
      },
      {
        phaseNumber: 2,
        phaseName: "Design & Architecture",
        objectives: ["Create system design", "Define data models", "UI/UX design"],
        durationDays: 7,
        tasks: [
          { id: "2.1", name: "System architecture design", estimatedHours: 16 },
          { id: "2.2", name: "Database schema design", estimatedHours: 8 },
          { id: "2.3", name: "UI/UX wireframes", estimatedHours: 12 },
        ],
        deliverables: ["Architecture document", "Database design", "Wireframes"],
        dependencies: ["Phase 1"],
      },
      {
        phaseNumber: 3,
        phaseName: "Development",
        objectives: ["Build core features", "Implement integrations", "Code review"],
        durationDays: 15,
        tasks: [
          { id: "3.1", name: "Backend development", estimatedHours: 60 },
          { id: "3.2", name: "Frontend development", estimatedHours: 48 },
          { id: "3.3", name: "API integration", estimatedHours: 24 },
          { id: "3.4", name: "Code review & refactoring", estimatedHours: 12 },
        ],
        deliverables: ["Working application", "API documentation", "Code repository"],
        dependencies: ["Phase 2"],
      },
      {
        phaseNumber: 4,
        phaseName: "Testing & QA",
        objectives: ["Quality assurance", "Bug fixing", "Performance testing"],
        durationDays: 5,
        tasks: [
          { id: "4.1", name: "Unit testing", estimatedHours: 12 },
          { id: "4.2", name: "Integration testing", estimatedHours: 8 },
          { id: "4.3", name: "Bug fixes", estimatedHours: 16 },
          { id: "4.4", name: "Performance optimization", estimatedHours: 8 },
        ],
        deliverables: ["Test report", "Bug-free application"],
        dependencies: ["Phase 3"],
      },
      {
        phaseNumber: 5,
        phaseName: "Deployment & Launch",
        objectives: ["Deploy to production", "User training", "Go-live support"],
        durationDays: 3,
        tasks: [
          { id: "5.1", name: "Production deployment", estimatedHours: 8 },
          { id: "5.2", name: "User documentation", estimatedHours: 6 },
          { id: "5.3", name: "Training session", estimatedHours: 4 },
          { id: "5.4", name: "Launch support", estimatedHours: 6 },
        ],
        deliverables: ["Live application", "User guide", "Training materials"],
        dependencies: ["Phase 4"],
      },
    ],
  };
}
