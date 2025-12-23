import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { storage } from "./storage";
import type { Project, Scenario, ROIAnalysis, OngoingCosts, RegionalAlternative, FeatureBreakdown, PricingMultipliers } from "@shared/schema";
import { loadPricingMatrix, getPricingContext, estimateCostFromMatrix } from "./pricing-matrix";
import { conductMarketResearch, formatMarketResearchMarkdown, type MarketResearchResult } from "./perplexity-service";
import { logApiUsage } from "./usage-tracker";

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
          
          await logApiUsage({
            projectId,
            provider: "gemini",
            model: "gemini-2.5-flash",
            inputText: rawInput,
            outputText: text,
            operation: "input_processing",
          });
          
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
        content: getStageAwareResponse(project, userMessage),
        stage: project.currentStage,
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        content: getStageAwareResponse(project, userMessage),
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
          // Get pricing context from matrix
          const pricingContext = getPricingContext();
          
          const context = `
Project Title: ${project.title}
Mission: ${parsedData?.mission || "Software development project"}
Objectives: ${JSON.stringify(parsedData?.objectives || [])}
Constraints: ${JSON.stringify(parsedData?.constraints || [])}
Raw Input: ${project.rawInput || "No additional context provided"}

${pricingContext}
          `;

          // Use Gemini for complex reasoning on scenarios
          const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a Lead AI Solutions Architect creating a comprehensive "Dual Scenario" project estimate.

${context}

Generate a detailed project estimate with TWO scenarios following 2026 pricing standards:

SCENARIO A (High-Tech/Custom):
- Full custom code development with complete ownership
- US-based senior developer rates: $150/hr (mid-level to senior range $120-$250/hr)
- Higher initial cost but maximum flexibility and scalability

SCENARIO B (No-Code/MVP):
- No-code/low-code platforms for rapid deployment
- Lower hourly rate: $75/hr (nearshore/specialized no-code rate)
- Faster time to market, lower initial investment

For EACH scenario, provide:
1. Feature list with individual hour estimates
2. Feature breakdown table (feature name, hours, cost at hourly rate)
3. Tech stack recommendation
4. Timeline (realistic for complexity - AI agents typically need 3-6 months)
5. Total cost calculation with hours x rate
6. Ongoing costs estimates (25-40% of development annually for maintenance)
7. Regional alternatives with cost multipliers (LATAM 0.45x, Eastern Europe 0.40x, India 0.30x)
8. Pricing multipliers applied (complexity, data, integration, customization)
9. Rate justification based on team location and experience level
10. Pros and cons

ROI Analysis requirements:
- Cost of Doing Nothing: Estimate annual cost of manual operations, lost opportunities, inefficiencies
- Methodology: Explain the basis for each ROI figure
- Projected savings with realistic assumptions
- Payback period calculated as: totalCost / (annualSavings / 12)
- 3-year ROI: ((3 * annualSavings - totalCost) / totalCost) * 100

Return a JSON object with this structure:
{
  "scenarioA": {
    "name": "High-Tech Custom",
    "description": "Full custom development with complete code ownership",
    "features": ["Feature 1", "Feature 2"],
    "featureBreakdown": [
      {"feature": "Project Discovery & Architecture", "hours": 60, "cost": 9000, "expectedRangeLow": 5000, "expectedRangeHigh": 15000},
      {"feature": "Custom Data Ingestion & ETL", "hours": 180, "cost": 27000, "expectedRangeLow": 15000, "expectedRangeHigh": 50000}
    ],
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "timeline": "10-14 weeks",
    "totalCost": 130500,
    "hourlyRate": 150,
    "totalHours": 870,
    "rateJustification": "US-based mid-level to senior development team ($120-$250/hr range)",
    "ongoingCosts": {
      "annualMaintenanceLow": 32625,
      "annualMaintenanceHigh": 52200,
      "monthlyCloudInfraLow": 500,
      "monthlyCloudInfraHigh": 2000,
      "monthlyAiApiLow": 200,
      "monthlyAiApiHigh": 1000,
      "monthlyMonitoringLow": 200,
      "monthlyMonitoringHigh": 500
    },
    "regionalAlternatives": [
      {"region": "Latin America (Nearshore)", "multiplier": 0.45, "adjustedCost": 58725, "notes": "Quality nearshore development"},
      {"region": "Eastern Europe", "multiplier": 0.40, "adjustedCost": 52200, "notes": "Strong technical talent pool"},
      {"region": "India/Asia", "multiplier": 0.30, "adjustedCost": 39150, "notes": "Cost-optimized offshore"}
    ],
    "multipliers": {
      "complexity": {"factor": "5-10x", "description": "High - RAG/LLM integration"},
      "data": {"factor": "2-3x", "description": "Medium - Custom data pipelines"},
      "integration": {"factor": "1.2-1.5x", "description": "Simple - 1-3 system integrations"},
      "customization": {"factor": "3-10x", "description": "Custom development"},
      "timeline": {"factor": "1.0x", "description": "Standard timeline"}
    },
    "pros": ["Full code ownership", "Complete customization", "Scalable architecture"],
    "cons": ["Higher upfront cost", "Longer development time"],
    "recommended": false
  },
  "scenarioB": {
    "name": "No-Code MVP",
    "description": "Rapid development using no-code/low-code platforms",
    "features": ["Feature 1", "Feature 2"],
    "featureBreakdown": [
      {"feature": "Project Scoping", "hours": 50, "cost": 3750, "expectedRangeLow": 2000, "expectedRangeHigh": 8000}
    ],
    "techStack": ["Airtable", "Zapier", "Webflow", "Make"],
    "timeline": "8-10 weeks",
    "totalCost": 45000,
    "hourlyRate": 75,
    "totalHours": 600,
    "rateJustification": "Nearshore no-code specialists or US junior developers",
    "ongoingCosts": {
      "annualMaintenanceLow": 11250,
      "annualMaintenanceHigh": 18000,
      "monthlyCloudInfraLow": 100,
      "monthlyCloudInfraHigh": 500,
      "monthlyAiApiLow": 50,
      "monthlyAiApiHigh": 300,
      "monthlyMonitoringLow": 50,
      "monthlyMonitoringHigh": 200
    },
    "regionalAlternatives": [
      {"region": "Latin America", "multiplier": 0.60, "adjustedCost": 27000, "notes": "No-code specialists"},
      {"region": "Eastern Europe", "multiplier": 0.55, "adjustedCost": 24750, "notes": "Technical automation experts"}
    ],
    "multipliers": {
      "complexity": {"factor": "1-2x", "description": "Simple-Medium - No-code configuration"},
      "data": {"factor": "1x", "description": "Low - Standard data handling"},
      "integration": {"factor": "1.2x", "description": "Simple - Platform integrations"},
      "customization": {"factor": "1x", "description": "Platform-based"},
      "timeline": {"factor": "1.0x", "description": "Standard timeline"}
    },
    "pros": ["Fast time to market", "Lower initial cost", "Easy to iterate"],
    "cons": ["Platform limitations", "Recurring platform costs", "Less customization"],
    "recommended": true
  },
  "roiAnalysis": {
    "costOfDoingNothing": 75000,
    "manualOperationalCost": 40000,
    "projectedSavings": 80000,
    "paybackPeriodMonths": 12,
    "threeYearROI": 284,
    "methodology": "Cost of Doing Nothing based on: 1) Manual operational labor ($40K/yr), 2) Lost efficiency opportunities ($20K/yr), 3) Competitive disadvantage risk ($15K/yr). Savings assume 80% automation of manual tasks and new revenue opportunities."
  }
}

Ensure all numbers are realistic based on the project scope. Return ONLY the JSON object.`,
          });

          await trackHealth("gemini", startTime);

          const text = response.text || "";
          
          await logApiUsage({
            projectId: project.id,
            provider: "gemini",
            model: "gemini-2.5-flash",
            inputText: project.rawInput || "",
            outputText: text,
            operation: "estimate",
          });
          
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

      // Conduct market research using Perplexity (if available)
      let marketResearch: MarketResearchResult | null = null;
      try {
        const projectType = parsedData?.mission || project.title || "software development";
        const projectDesc = project.rawInput || project.title || "";
        marketResearch = await conductMarketResearch(projectType, projectDesc, project.id);
        if (marketResearch) {
          console.log("Market research completed successfully");
        }
      } catch (researchError) {
        console.error("Market research failed:", researchError);
      }

      // Generate markdown summary with market research
      const markdown = generateEstimateMarkdown(project, scenarios, marketResearch);

      // Update project - always persist the result
      await storage.updateProject(project.id, {
        estimateMarkdown: markdown,
        scenarioA: scenarios.scenarioA,
        scenarioB: scenarios.scenarioB,
        roiAnalysis: scenarios.roiAnalysis,
        parsedData: { ...parsedData, marketResearch, lastUpdated: new Date().toISOString() },
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
      const markdown = generateEstimateMarkdown(project, scenarios, null);
      
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
          max_tokens: 8192,
          messages: [
            {
              role: "user",
              content: `You are creating comprehensive "Vibecoding" execution manuals - detailed developer guides with step-by-step instructions, copy-paste prompts for AI coding assistants, code snippets, tips, recommendations, and best practices.

Project: ${project.title}
Mission: ${(project.parsedData as any)?.mission || "Build a software solution"}
Client Requirements: ${JSON.stringify((project.parsedData as any)?.requirements || [])}

Create TWO detailed execution manuals:

=== MANUAL A (High-Code Approach) ===
Tech Stack: ${JSON.stringify(scenarioA?.techStack || ["React", "Node.js", "PostgreSQL"])}
Features: ${JSON.stringify(scenarioA?.features || [])}
Timeline: ${scenarioA?.timeline || "8-12 weeks"}

=== MANUAL B (No-Code Approach) ===
Tech Stack: ${JSON.stringify(scenarioB?.techStack || ["Airtable", "Zapier", "Webflow"])}
Features: ${JSON.stringify(scenarioB?.features || [])}
Timeline: ${scenarioB?.timeline || "2-4 weeks"}

Each manual MUST include these detailed sections:

## 1. Executive Summary
- Project overview and goals
- Key success metrics
- Timeline overview

## 2. Environment Setup
- Required tools and accounts
- Step-by-step installation instructions
- Environment variables and configuration
- Code snippets for initial setup

## 3. Architecture Overview
- System design diagram description
- Component breakdown
- Data flow explanation
- Best practices for the chosen stack

## 4. Implementation Guide (Feature by Feature)
For EACH feature, provide:
- Feature description and user story
- Step-by-step implementation instructions
- VIBECODE PROMPT: Exact prompt to paste into AI coding assistant (in a code block)
- Code snippets showing expected output
- Testing instructions for this feature
- Common pitfalls and how to avoid them

## 5. Integration & API Setup
- Third-party service configurations
- API connection prompts
- Authentication setup
- Error handling patterns

## 6. Testing Checklist
- Unit test prompts
- Integration test checklist
- User acceptance testing scenarios
- Performance testing recommendations

## 7. Deployment Guide
- Deployment platform recommendations
- Step-by-step deployment instructions
- Environment configuration
- Monitoring and logging setup

## 8. Best Practices & Tips
- Security considerations
- Performance optimization tips
- Scalability recommendations
- Maintenance guidelines

## 9. Troubleshooting Guide
- Common issues and solutions
- Debug prompts for AI assistants
- Where to get help

IMPORTANT FORMATTING:
- Use clear markdown headers (##, ###)
- Put all AI prompts in code blocks labeled "VIBECODE PROMPT:"
- Include actual code snippets where helpful
- Add tip boxes with > TIP: prefix
- Add warning boxes with > WARNING: prefix
- Make the guide comprehensive enough to execute the entire project

Return as JSON:
{
  "guideA": "# Manual A: High-Code Approach\\n\\n## Executive Summary\\n...",
  "guideB": "# Manual B: No-Code Approach\\n\\n## Executive Summary\\n..."
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
- Tasks with estimated hours AND completion checklist for each task
- Deliverables
- Dependencies

IMPORTANT: Each task must include a "checklist" array with specific action items to complete that task.

Return as JSON:
{
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Discovery & Planning",
      "objectives": ["Gather requirements", "Define scope"],
      "durationDays": 5,
      "tasks": [
        {
          "id": "1.1",
          "name": "Stakeholder interviews",
          "description": "Meet with key stakeholders to understand requirements",
          "estimatedHours": 8,
          "checklist": [
            {"id": "1.1.1", "action": "Schedule meetings with product owner", "completed": false},
            {"id": "1.1.2", "action": "Prepare interview questions", "completed": false},
            {"id": "1.1.3", "action": "Document meeting notes", "completed": false},
            {"id": "1.1.4", "action": "Share summary with team", "completed": false}
          ]
        },
        {
          "id": "1.2",
          "name": "Requirements documentation",
          "description": "Create comprehensive requirements document",
          "estimatedHours": 12,
          "checklist": [
            {"id": "1.2.1", "action": "Draft functional requirements", "completed": false},
            {"id": "1.2.2", "action": "Document non-functional requirements", "completed": false},
            {"id": "1.2.3", "action": "Get stakeholder sign-off", "completed": false}
          ]
        }
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
  const scenarioACost = 45000;
  const scenarioBCost = 15000;
  
  return {
    scenarioA: {
      name: "High-Tech Custom",
      description: "Full custom development with complete code ownership",
      features: ["Custom backend API", "React frontend", "Database design", "Authentication", "Admin dashboard"],
      featureBreakdown: [
        { feature: "Project Discovery & Architecture", hours: 40, cost: 6000, expectedRangeLow: 5000, expectedRangeHigh: 15000 },
        { feature: "Backend API Development", hours: 80, cost: 12000, expectedRangeLow: 10000, expectedRangeHigh: 25000 },
        { feature: "Frontend Development", hours: 100, cost: 15000, expectedRangeLow: 12000, expectedRangeHigh: 30000 },
        { feature: "Database Design & Integration", hours: 40, cost: 6000, expectedRangeLow: 5000, expectedRangeHigh: 15000 },
        { feature: "Testing & QA", hours: 40, cost: 6000, expectedRangeLow: 3000, expectedRangeHigh: 8000 },
      ],
      techStack: ["React", "Node.js", "PostgreSQL", "TypeScript"],
      timeline: "8-10 weeks",
      totalCost: scenarioACost,
      hourlyRate: 150,
      totalHours: 300,
      rateJustification: "US-based mid-level to senior development team ($120-$250/hr range)",
      ongoingCosts: {
        annualMaintenanceLow: Math.round(scenarioACost * 0.25),
        annualMaintenanceHigh: Math.round(scenarioACost * 0.40),
        monthlyCloudInfraLow: 200,
        monthlyCloudInfraHigh: 800,
        monthlyAiApiLow: 100,
        monthlyAiApiHigh: 500,
        monthlyMonitoringLow: 100,
        monthlyMonitoringHigh: 300,
      },
      regionalAlternatives: [
        { region: "Latin America (Nearshore)", multiplier: 0.45, adjustedCost: Math.round(scenarioACost * 0.45), notes: "Quality nearshore development" },
        { region: "Eastern Europe", multiplier: 0.40, adjustedCost: Math.round(scenarioACost * 0.40), notes: "Strong technical talent pool" },
        { region: "India/Asia", multiplier: 0.30, adjustedCost: Math.round(scenarioACost * 0.30), notes: "Cost-optimized offshore" },
      ],
      multipliers: {
        complexity: { factor: "2-3x", description: "Medium - Standard web application" },
        data: { factor: "1-2x", description: "Low-Medium - Standard data handling" },
        integration: { factor: "1.2x", description: "Simple - Few integrations" },
        customization: { factor: "3x", description: "Custom development" },
        timeline: { factor: "1.0x", description: "Standard timeline" },
      },
      pros: ["Full code ownership", "Complete customization", "Scalable architecture"],
      cons: ["Higher upfront cost", "Longer development time"],
      recommended: false,
    },
    scenarioB: {
      name: "No-Code MVP",
      description: "Rapid development using no-code/low-code platforms",
      features: ["Database (Airtable)", "Workflows (Zapier)", "Frontend (Webflow)", "User management", "Basic analytics"],
      featureBreakdown: [
        { feature: "Project Scoping", hours: 30, cost: 2250, expectedRangeLow: 2000, expectedRangeHigh: 5000 },
        { feature: "Platform Configuration", hours: 60, cost: 4500, expectedRangeLow: 3000, expectedRangeHigh: 10000 },
        { feature: "Workflow Automation", hours: 50, cost: 3750, expectedRangeLow: 3000, expectedRangeHigh: 8000 },
        { feature: "UI/UX Setup", hours: 40, cost: 3000, expectedRangeLow: 2500, expectedRangeHigh: 6000 },
        { feature: "Testing & Iteration", hours: 20, cost: 1500, expectedRangeLow: 1000, expectedRangeHigh: 3000 },
      ],
      techStack: ["Airtable", "Zapier", "Webflow", "Make"],
      timeline: "3-4 weeks",
      totalCost: scenarioBCost,
      hourlyRate: 75,
      totalHours: 200,
      rateJustification: "Nearshore no-code specialists or US junior developers ($30-$90/hr range)",
      ongoingCosts: {
        annualMaintenanceLow: Math.round(scenarioBCost * 0.25),
        annualMaintenanceHigh: Math.round(scenarioBCost * 0.40),
        monthlyCloudInfraLow: 50,
        monthlyCloudInfraHigh: 200,
        monthlyAiApiLow: 25,
        monthlyAiApiHigh: 150,
        monthlyMonitoringLow: 25,
        monthlyMonitoringHigh: 100,
      },
      regionalAlternatives: [
        { region: "Latin America", multiplier: 0.60, adjustedCost: Math.round(scenarioBCost * 0.60), notes: "No-code specialists" },
        { region: "Eastern Europe", multiplier: 0.55, adjustedCost: Math.round(scenarioBCost * 0.55), notes: "Technical automation experts" },
      ],
      multipliers: {
        complexity: { factor: "1x", description: "Simple - No-code configuration" },
        data: { factor: "1x", description: "Low - Standard data handling" },
        integration: { factor: "1.2x", description: "Simple - Platform integrations" },
        customization: { factor: "1x", description: "Platform-based" },
        timeline: { factor: "1.0x", description: "Standard timeline" },
      },
      pros: ["Fast time to market", "Lower initial cost", "Easy to iterate"],
      cons: ["Platform limitations", "Recurring platform costs"],
      recommended: true,
    },
    roiAnalysis: {
      costOfDoingNothing: 50000,
      manualOperationalCost: 40000,
      projectedSavings: 35000,
      paybackPeriodMonths: Math.round(scenarioBCost / (35000 / 12)),
      threeYearROI: Math.round(((3 * 35000 - scenarioBCost) / scenarioBCost) * 100),
      methodology: "Cost of Doing Nothing based on: 1) Manual operational labor ($40K/yr), 2) Lost efficiency opportunities ($10K/yr). Savings assume 70% automation of manual tasks.",
    },
  };
}

function generateEstimateMarkdown(project: Project, scenarios: any, marketResearch: MarketResearchResult | null): string {
  const { scenarioA, scenarioB, roiAnalysis } = scenarios;
  const parsedData = project.parsedData as any || {};
  const marketResearchMarkdown = formatMarketResearchMarkdown(marketResearch);

  // Helper to safely format numbers
  const formatNum = (val: any, fallback: number = 0): string => {
    const num = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) : fallback);
    return isNaN(num) ? fallback.toLocaleString() : num.toLocaleString();
  };

  // Generate feature breakdown table for a scenario
  const generateFeatureBreakdown = (scenario: any, label: string): string => {
    if (!scenario?.featureBreakdown?.length) return "";
    
    let table = `\n#### ${label} Feature Cost Breakdown\n\n`;
    table += `| Feature | Hours | Cost | Expected Range | Assessment |\n`;
    table += `|---------|-------|------|----------------|------------|\n`;
    
    for (const fb of scenario.featureBreakdown) {
      const cost = fb.cost || (fb.hours * (scenario.hourlyRate || 150));
      const inRange = cost >= fb.expectedRangeLow && cost <= fb.expectedRangeHigh;
      table += `| ${fb.feature} | ${fb.hours} hrs | $${formatNum(cost)} | $${formatNum(fb.expectedRangeLow)}-$${formatNum(fb.expectedRangeHigh)} | ${inRange ? 'Aligned' : 'Review'} |\n`;
    }
    return table;
  };

  // Generate ongoing costs section
  const generateOngoingCosts = (scenario: any, label: string): string => {
    if (!scenario?.ongoingCosts) return "";
    const oc = scenario.ongoingCosts;
    
    return `
#### ${label} Ongoing Costs (Annual)

| Cost Category | Monthly Range | Annual Range |
|---------------|---------------|--------------|
| Maintenance & Support | - | $${formatNum(oc.annualMaintenanceLow)} - $${formatNum(oc.annualMaintenanceHigh)} |
| Cloud Infrastructure | $${formatNum(oc.monthlyCloudInfraLow)} - $${formatNum(oc.monthlyCloudInfraHigh)} | $${formatNum(oc.monthlyCloudInfraLow * 12)} - $${formatNum(oc.monthlyCloudInfraHigh * 12)} |
| AI/API Costs | $${formatNum(oc.monthlyAiApiLow)} - $${formatNum(oc.monthlyAiApiHigh)} | $${formatNum(oc.monthlyAiApiLow * 12)} - $${formatNum(oc.monthlyAiApiHigh * 12)} |
| Monitoring & Analytics | $${formatNum(oc.monthlyMonitoringLow)} - $${formatNum(oc.monthlyMonitoringHigh)} | $${formatNum(oc.monthlyMonitoringLow * 12)} - $${formatNum(oc.monthlyMonitoringHigh * 12)} |

`;
  };

  // Generate regional alternatives section
  const generateRegionalAlternatives = (scenario: any, label: string): string => {
    if (!scenario?.regionalAlternatives?.length) return "";
    
    let table = `#### ${label} Regional Alternatives\n\n`;
    table += `| Region | Multiplier | Adjusted Cost | Notes |\n`;
    table += `|--------|------------|---------------|-------|\n`;
    
    for (const ra of scenario.regionalAlternatives) {
      table += `| ${ra.region} | ${ra.multiplier}x | $${formatNum(ra.adjustedCost)} | ${ra.notes} |\n`;
    }
    return table + "\n";
  };

  // Generate multipliers section
  const generateMultipliers = (scenario: any): string => {
    if (!scenario?.multipliers) return "";
    const m = scenario.multipliers;
    
    return `
#### Pricing Multipliers Applied

| Factor | Multiplier | Description |
|--------|------------|-------------|
| Project Complexity | ${m.complexity?.factor || '1x'} | ${m.complexity?.description || 'Standard'} |
| Data Requirements | ${m.data?.factor || '1x'} | ${m.data?.description || 'Standard'} |
| Integration Complexity | ${m.integration?.factor || '1x'} | ${m.integration?.description || 'Standard'} |
| Customization Level | ${m.customization?.factor || '1x'} | ${m.customization?.description || 'Standard'} |
| Timeline | ${m.timeline?.factor || '1x'} | ${m.timeline?.description || 'Standard'} |

`;
  };

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
| Total Hours | ${formatNum(scenarioA?.totalHours, 300)} |
| Hourly Rate | $${formatNum(scenarioA?.hourlyRate, 150)} |
| **Total Investment** | **$${formatNum(scenarioA?.totalCost, 45000)}** |

${scenarioA?.rateJustification ? `**Rate Justification:** ${scenarioA.rateJustification}\n` : ""}

**Tech Stack:** ${scenarioA?.techStack?.join(", ") || "React, Node.js, PostgreSQL"}

**Features:**
${scenarioA?.features?.map((f: string) => `- ${f}`).join("\n") || "- Custom development"}

${generateFeatureBreakdown(scenarioA, "Scenario A")}

${generateMultipliers(scenarioA)}

${generateOngoingCosts(scenarioA, "Scenario A")}

${generateRegionalAlternatives(scenarioA, "Scenario A")}

---

### Scenario B: ${scenarioB?.name || "No-Code MVP"}

**${scenarioB?.description || "Rapid development using no-code platforms"}**

| Metric | Value |
|--------|-------|
| Timeline | ${scenarioB?.timeline || "3-4 weeks"} |
| Total Hours | ${formatNum(scenarioB?.totalHours, 200)} |
| Hourly Rate | $${formatNum(scenarioB?.hourlyRate, 75)} |
| **Total Investment** | **$${formatNum(scenarioB?.totalCost, 15000)}** |

${scenarioB?.rateJustification ? `**Rate Justification:** ${scenarioB.rateJustification}\n` : ""}

**Tech Stack:** ${scenarioB?.techStack?.join(", ") || "Airtable, Zapier, Webflow"}

**Features:**
${scenarioB?.features?.map((f: string) => `- ${f}`).join("\n") || "- No-code solution"}

${generateFeatureBreakdown(scenarioB, "Scenario B")}

${generateMultipliers(scenarioB)}

${generateOngoingCosts(scenarioB, "Scenario B")}

${generateRegionalAlternatives(scenarioB, "Scenario B")}

---

## ROI Analysis

| Metric | Value |
|--------|-------|
| Cost of Doing Nothing | $${formatNum(roiAnalysis?.costOfDoingNothing, 50000)}/year |
| Manual Operational Cost | $${formatNum(roiAnalysis?.manualOperationalCost, 40000)}/year |
| Projected Savings | $${formatNum(roiAnalysis?.projectedSavings, 35000)}/year |
| Payback Period | ${formatNum(roiAnalysis?.paybackPeriodMonths, 6)} months |
| 3-Year ROI | ${formatNum(roiAnalysis?.threeYearROI, 400)}% |

${roiAnalysis?.methodology ? `\n**Methodology:** ${roiAnalysis.methodology}\n` : ""}

---

${marketResearchMarkdown}

## Recommendation

${scenarioB?.recommended ? 
  `Based on the analysis, we recommend **Scenario B: ${scenarioB.name}** for faster time-to-market and lower initial investment. This approach allows you to validate your concept quickly before committing to a larger custom development effort.` :
  `Based on the analysis, we recommend **Scenario A: ${scenarioA?.name}** for full control and long-term scalability. This approach provides complete ownership of your solution with maximum flexibility for future enhancements.`
}

---

*Estimate generated by ISI Agent | ${new Date().toLocaleDateString()}*
*Pricing aligned with AI Agent Pricing Knowledge Base 2026*
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
function getStageAwareResponse(project: Project, userMessage: string): string {
  const stage = project.currentStage;
  const projectTitle = project.title || "your project";
  
  // Stage 1: Input Processing & Estimate Generation
  if (stage === 1) {
    if (project.estimateMarkdown) {
      return `Great news! Your dual-scenario estimate for "${projectTitle}" is ready.

**What's included:**
- Two pricing approaches: High-Tech Custom vs No-Code MVP
- Feature-level cost breakdowns with hour estimates
- ROI analysis including "Cost of Doing Nothing"
- Regional pricing alternatives and multiplier transparency

**Next step:** Review the estimate in the "Estimate" tab, then click **"Approve & Generate PDF"** to create your proposal documents and move to Stage 2.

If you'd like to refine the estimate, click "Regenerate" or tell me what adjustments you need.`;
    }
    return `I'm analyzing your input for "${projectTitle}" and generating a comprehensive dual-scenario estimate.

This includes:
- High-Tech Custom solution (full ownership, maximum flexibility)
- No-Code MVP approach (faster delivery, lower initial cost)
- Detailed feature breakdowns and ROI analysis

The estimate will appear in the "Estimate" tab momentarily. You can also attach additional reference documents using the paperclip icon.`;
  }
  
  // Stage 2: Production Assets Ready
  if (stage === 2) {
    const hasProposal = !!project.proposalPdfUrl;
    const hasPresentation = !!project.presentationUrl;
    
    if (hasProposal || hasPresentation) {
      return `Your production assets for "${projectTitle}" are ready!

**Available documents:**
${hasProposal ? "- Proposal PDF (ready for download)" : ""}
${hasPresentation ? "- Client presentation" : ""}

**Next step:** Click **"Send Email"** to deliver the proposal to your client and move to Stage 3.

You can also download these files from the Export menu for offline review.`;
    }
    return `Generating production assets for "${projectTitle}"...

This includes your client proposal PDF and presentation materials. Once ready, you'll be able to send these directly to your client via email.`;
  }
  
  // Stage 3: Email Sent, Awaiting Response
  if (stage === 3) {
    const emailSent = project.emailSentAt;
    const emailOpened = project.emailOpened;
    
    return `The proposal for "${projectTitle}" has been sent${emailSent ? ` on ${new Date(emailSent).toLocaleDateString()}` : ""}.

**Status:**
${emailOpened ? "- Client has opened the email" : "- Awaiting client response"}

**Next step:** Once the client accepts, click **"Generate Execution Guide"** to create implementation manuals and move to Stage 4.

Feel free to follow up with your client or make any needed clarifications.`;
  }
  
  // Stage 4: Execution Guides Ready
  if (stage === 4) {
    const hasGuideA = !!project.vibecodeGuideA;
    const hasGuideB = !!project.vibecodeGuideB;
    
    if (hasGuideA || hasGuideB) {
      return `Your execution guides for "${projectTitle}" are ready!

**Available manuals:**
${hasGuideA ? "- Manual A: High-Code Implementation Guide" : ""}
${hasGuideB ? "- Manual B: No-Code Implementation Guide" : ""}

These contain step-by-step instructions and prompts for AI coding assistants.

**Next step:** Click **"Generate PM Tracks"** to create a project management breakdown and move to Stage 5.`;
    }
    return `Generating execution guides for "${projectTitle}"...

These will include detailed implementation steps and AI-assisted coding prompts for both development approaches.`;
  }
  
  // Stage 5: PM Breakdown Complete
  if (stage === 5) {
    const hasPM = !!project.pmBreakdown;
    
    if (hasPM) {
      return `Congratulations! The project for "${projectTitle}" is fully scoped and ready for execution.

**Completed deliverables:**
- Dual-scenario estimate with cost breakdowns
- Client proposal and presentation
- Execution guides for implementation
- Project management breakdown with phases and tasks

You can export all materials from the Export menu. This project is ready to begin development!`;
    }
    return `Generating project management breakdown for "${projectTitle}"...

This will include detailed phases, milestones, task assignments, and deliverable schedules for your chosen approach.`;
  }
  
  return `I'm here to help with "${projectTitle}". What would you like to do next?`;
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

// Fallback PM breakdown with task checklists
function generateDefaultPMBreakdown(project: Project): any {
  return {
    phases: [
      {
        phaseNumber: 1,
        phaseName: "Discovery & Planning",
        objectives: ["Define project scope", "Gather requirements", "Create project roadmap"],
        durationDays: 5,
        tasks: [
          { 
            id: "1.1", 
            name: "Stakeholder interviews", 
            description: "Meet with key stakeholders to understand business requirements",
            estimatedHours: 8,
            checklist: [
              { id: "1.1.1", action: "Schedule meetings with product owner", completed: false },
              { id: "1.1.2", action: "Prepare interview questions", completed: false },
              { id: "1.1.3", action: "Document meeting notes", completed: false },
              { id: "1.1.4", action: "Share summary with team", completed: false },
            ]
          },
          { 
            id: "1.2", 
            name: "Requirements documentation", 
            description: "Create comprehensive requirements document",
            estimatedHours: 12,
            checklist: [
              { id: "1.2.1", action: "Draft functional requirements", completed: false },
              { id: "1.2.2", action: "Document non-functional requirements", completed: false },
              { id: "1.2.3", action: "Define acceptance criteria", completed: false },
              { id: "1.2.4", action: "Get stakeholder sign-off", completed: false },
            ]
          },
          { 
            id: "1.3", 
            name: "Technical specification", 
            description: "Define technical architecture and constraints",
            estimatedHours: 16,
            checklist: [
              { id: "1.3.1", action: "Evaluate technology options", completed: false },
              { id: "1.3.2", action: "Document system constraints", completed: false },
              { id: "1.3.3", action: "Create technical spec document", completed: false },
              { id: "1.3.4", action: "Review with engineering team", completed: false },
            ]
          },
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
          { 
            id: "2.1", 
            name: "System architecture design", 
            description: "Design overall system architecture",
            estimatedHours: 16,
            checklist: [
              { id: "2.1.1", action: "Create architecture diagrams", completed: false },
              { id: "2.1.2", action: "Define API contracts", completed: false },
              { id: "2.1.3", action: "Plan service boundaries", completed: false },
              { id: "2.1.4", action: "Document integration points", completed: false },
            ]
          },
          { 
            id: "2.2", 
            name: "Database schema design", 
            description: "Design database structure and relationships",
            estimatedHours: 8,
            checklist: [
              { id: "2.2.1", action: "Create entity relationship diagram", completed: false },
              { id: "2.2.2", action: "Define table schemas", completed: false },
              { id: "2.2.3", action: "Plan indexing strategy", completed: false },
            ]
          },
          { 
            id: "2.3", 
            name: "UI/UX wireframes", 
            description: "Create user interface designs",
            estimatedHours: 12,
            checklist: [
              { id: "2.3.1", action: "Create user flow diagrams", completed: false },
              { id: "2.3.2", action: "Design wireframes for key screens", completed: false },
              { id: "2.3.3", action: "Get design approval", completed: false },
            ]
          },
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
          { 
            id: "3.1", 
            name: "Backend development", 
            description: "Build server-side application and APIs",
            estimatedHours: 60,
            checklist: [
              { id: "3.1.1", action: "Set up development environment", completed: false },
              { id: "3.1.2", action: "Implement database models", completed: false },
              { id: "3.1.3", action: "Build API endpoints", completed: false },
              { id: "3.1.4", action: "Implement authentication", completed: false },
              { id: "3.1.5", action: "Add input validation", completed: false },
            ]
          },
          { 
            id: "3.2", 
            name: "Frontend development", 
            description: "Build user interface components",
            estimatedHours: 48,
            checklist: [
              { id: "3.2.1", action: "Set up frontend project", completed: false },
              { id: "3.2.2", action: "Create reusable components", completed: false },
              { id: "3.2.3", action: "Implement page layouts", completed: false },
              { id: "3.2.4", action: "Connect to backend APIs", completed: false },
              { id: "3.2.5", action: "Add responsive styling", completed: false },
            ]
          },
          { 
            id: "3.3", 
            name: "API integration", 
            description: "Integrate third-party services",
            estimatedHours: 24,
            checklist: [
              { id: "3.3.1", action: "Set up API credentials", completed: false },
              { id: "3.3.2", action: "Implement API clients", completed: false },
              { id: "3.3.3", action: "Add error handling", completed: false },
              { id: "3.3.4", action: "Test integration flows", completed: false },
            ]
          },
          { 
            id: "3.4", 
            name: "Code review & refactoring", 
            description: "Review and improve code quality",
            estimatedHours: 12,
            checklist: [
              { id: "3.4.1", action: "Review code for best practices", completed: false },
              { id: "3.4.2", action: "Refactor complex functions", completed: false },
              { id: "3.4.3", action: "Add code documentation", completed: false },
            ]
          },
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
          { 
            id: "4.1", 
            name: "Unit testing", 
            description: "Write and run unit tests",
            estimatedHours: 12,
            checklist: [
              { id: "4.1.1", action: "Write unit tests for critical functions", completed: false },
              { id: "4.1.2", action: "Achieve 80% code coverage", completed: false },
              { id: "4.1.3", action: "Set up CI/CD test pipeline", completed: false },
            ]
          },
          { 
            id: "4.2", 
            name: "Integration testing", 
            description: "Test component interactions",
            estimatedHours: 8,
            checklist: [
              { id: "4.2.1", action: "Test API endpoint flows", completed: false },
              { id: "4.2.2", action: "Test database operations", completed: false },
              { id: "4.2.3", action: "Test third-party integrations", completed: false },
            ]
          },
          { 
            id: "4.3", 
            name: "Bug fixes", 
            description: "Address discovered issues",
            estimatedHours: 16,
            checklist: [
              { id: "4.3.1", action: "Triage and prioritize bugs", completed: false },
              { id: "4.3.2", action: "Fix critical bugs", completed: false },
              { id: "4.3.3", action: "Verify fixes in staging", completed: false },
            ]
          },
          { 
            id: "4.4", 
            name: "Performance optimization", 
            description: "Optimize application performance",
            estimatedHours: 8,
            checklist: [
              { id: "4.4.1", action: "Run performance benchmarks", completed: false },
              { id: "4.4.2", action: "Optimize slow queries", completed: false },
              { id: "4.4.3", action: "Add caching where needed", completed: false },
            ]
          },
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
          { 
            id: "5.1", 
            name: "Production deployment", 
            description: "Deploy application to production environment",
            estimatedHours: 8,
            checklist: [
              { id: "5.1.1", action: "Prepare production environment", completed: false },
              { id: "5.1.2", action: "Configure production database", completed: false },
              { id: "5.1.3", action: "Deploy application code", completed: false },
              { id: "5.1.4", action: "Verify deployment success", completed: false },
            ]
          },
          { 
            id: "5.2", 
            name: "User documentation", 
            description: "Create end-user documentation",
            estimatedHours: 6,
            checklist: [
              { id: "5.2.1", action: "Write user guide", completed: false },
              { id: "5.2.2", action: "Create FAQ document", completed: false },
              { id: "5.2.3", action: "Add help tooltips in UI", completed: false },
            ]
          },
          { 
            id: "5.3", 
            name: "Training session", 
            description: "Train users on the new system",
            estimatedHours: 4,
            checklist: [
              { id: "5.3.1", action: "Prepare training materials", completed: false },
              { id: "5.3.2", action: "Conduct training session", completed: false },
              { id: "5.3.3", action: "Record training for future reference", completed: false },
            ]
          },
          { 
            id: "5.4", 
            name: "Launch support", 
            description: "Provide go-live support",
            estimatedHours: 6,
            checklist: [
              { id: "5.4.1", action: "Monitor application health", completed: false },
              { id: "5.4.2", action: "Address user issues quickly", completed: false },
              { id: "5.4.3", action: "Document lessons learned", completed: false },
            ]
          },
        ],
        deliverables: ["Live application", "User guide", "Training materials"],
        dependencies: ["Phase 4"],
      },
    ],
  };
}
