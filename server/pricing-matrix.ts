import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

export interface ProjectCost {
  projectType: string;
  complexityLevel: string;
  costLow: number;
  costHigh: number;
  timeline: string;
  keyFeatures: string;
  baseMultiplier: string;
}

export interface HourlyRate {
  role: string;
  region: string;
  rateMin: number;
  rateMax: number;
}

export interface PricingMatrix {
  projectCosts: ProjectCost[];
  hourlyRates: HourlyRate[];
  regionalMultipliers: Record<string, number>;
  aiApiPricing: any[];
  costDrivers: string[];
}

let cachedMatrix: PricingMatrix | null = null;

export function loadPricingMatrix(): PricingMatrix {
  if (cachedMatrix) return cachedMatrix;

  const filePath = path.join(process.cwd(), "attached_assets", "AI_Agent_Pricing_Knowledge_Base_1766001159839.xlsx");
  
  if (!fs.existsSync(filePath)) {
    console.warn("Pricing matrix file not found, using defaults");
    return getDefaultPricingMatrix();
  }

  try {
    const workbook = XLSX.readFile(filePath);
    
    // Parse Project Costs
    const projectCostsSheet = workbook.Sheets["Project Costs by Complexity"];
    const projectCostsRaw = XLSX.utils.sheet_to_json<any>(projectCostsSheet);
    const projectCosts: ProjectCost[] = projectCostsRaw.map((row: any) => ({
      projectType: row["Project Type"] || "",
      complexityLevel: row["Complexity Level"] || "",
      costLow: parseFloat(row["Cost Range (USD) - Low"]) || 0,
      costHigh: parseFloat(row["Cost Range (USD) - High"]) || 0,
      timeline: row["Timeline"] || "",
      keyFeatures: row["Key Features"] || "",
      baseMultiplier: row["Base Multiplier"] || "1.0x",
    }));

    // Parse Regional Multipliers
    const regionalSheet = workbook.Sheets["Regional Multipliers"];
    const regionalRaw = XLSX.utils.sheet_to_json<any>(regionalSheet);
    const regionalMultipliers: Record<string, number> = {};
    regionalRaw.forEach((row: any) => {
      const region = row["Region"] || row["Country"];
      const multiplier = parseFloat(row["Multiplier"] || row["Cost Multiplier"]) || 1.0;
      if (region) regionalMultipliers[region] = multiplier;
    });

    // Parse Hourly Rates
    const ratesSheet = workbook.Sheets["Hourly Rates by Role-Region"];
    const ratesRaw = XLSX.utils.sheet_to_json<any>(ratesSheet);
    const hourlyRates: HourlyRate[] = ratesRaw.map((row: any) => ({
      role: row["Role"] || "",
      region: row["Region"] || "",
      rateMin: parseFloat(row["Rate Min"] || row["Hourly Rate Low"]) || 0,
      rateMax: parseFloat(row["Rate Max"] || row["Hourly Rate High"]) || 0,
    }));

    // Parse AI API Pricing
    const aiApiSheet = workbook.Sheets["AI API Model Pricing"];
    const aiApiPricing = aiApiSheet ? XLSX.utils.sheet_to_json(aiApiSheet) : [];

    // Parse Cost Drivers
    const costDriversSheet = workbook.Sheets["Cost Drivers Key Insights"];
    const costDriversRaw = costDriversSheet ? XLSX.utils.sheet_to_json<any>(costDriversSheet) : [];
    const costDrivers = costDriversRaw.map((row: any) => 
      row["Insight"] || row["Cost Driver"] || row["Key Insight"] || JSON.stringify(row)
    ).filter(Boolean);

    cachedMatrix = {
      projectCosts,
      hourlyRates,
      regionalMultipliers,
      aiApiPricing,
      costDrivers,
    };

    console.log(`Loaded pricing matrix: ${projectCosts.length} project types, ${hourlyRates.length} rates`);
    return cachedMatrix;
  } catch (error) {
    console.error("Error loading pricing matrix:", error);
    return getDefaultPricingMatrix();
  }
}

function getDefaultPricingMatrix(): PricingMatrix {
  return {
    projectCosts: [
      { projectType: "Basic AI Solutions", complexityLevel: "Simple", costLow: 20000, costHigh: 80000, timeline: "2-4 months", keyFeatures: "Chatbots, basic recommendation systems", baseMultiplier: "1.0x" },
      { projectType: "Advanced AI Solutions", complexityLevel: "Medium", costLow: 50000, costHigh: 150000, timeline: "4-8 months", keyFeatures: "Predictive analytics, NLP platforms", baseMultiplier: "2-3x" },
      { projectType: "Enterprise AI Solutions", complexityLevel: "High", costLow: 150000, costHigh: 500000, timeline: "8-15 months", keyFeatures: "Full-featured AI platform", baseMultiplier: "5-10x" },
    ],
    hourlyRates: [
      { role: "Senior Developer", region: "US", rateMin: 150, rateMax: 250 },
      { role: "AI Engineer", region: "US", rateMin: 175, rateMax: 300 },
      { role: "Junior Developer", region: "US", rateMin: 75, rateMax: 125 },
    ],
    regionalMultipliers: { "US": 1.0, "EU": 0.9, "LATAM": 0.5, "Asia": 0.4 },
    aiApiPricing: [],
    costDrivers: ["Data complexity", "Integration requirements", "Security compliance", "Custom ML models"],
  };
}

export function findMatchingProjectType(description: string): ProjectCost | null {
  const matrix = loadPricingMatrix();
  const lowerDesc = description.toLowerCase();
  
  // Keyword matching for project type
  const keywords: Record<string, string[]> = {
    "website": ["landing page", "web development", "website", "web app", "wordpress", "ecommerce"],
    "chatbot": ["chatbot", "bot", "conversational", "assistant", "chat"],
    "ai agent": ["ai agent", "agent", "automation", "workflow"],
    "analytics": ["analytics", "dashboard", "reporting", "data visualization"],
    "mobile": ["mobile app", "ios", "android", "react native"],
    "enterprise": ["enterprise", "large scale", "complex system"],
  };

  // Find complexity based on keywords
  let matchedComplexity = "Simple";
  if (lowerDesc.includes("enterprise") || lowerDesc.includes("complex") || lowerDesc.includes("large")) {
    matchedComplexity = "High";
  } else if (lowerDesc.includes("advanced") || lowerDesc.includes("integration") || lowerDesc.includes("custom")) {
    matchedComplexity = "Medium";
  }

  // Find matching project type
  return matrix.projectCosts.find(p => 
    p.complexityLevel.toLowerCase().includes(matchedComplexity.toLowerCase())
  ) || matrix.projectCosts[0];
}

export function estimateCostFromMatrix(
  projectDescription: string,
  complexity: "simple" | "medium" | "high" = "medium"
): { low: number; high: number; timeline: string; reference: ProjectCost | null } {
  const matrix = loadPricingMatrix();
  
  const complexityMap: Record<string, string[]> = {
    simple: ["simple", "basic"],
    medium: ["medium", "mid"],
    high: ["high", "complex", "enterprise", "very high"],
  };

  const matchingTypes = matrix.projectCosts.filter(p => 
    complexityMap[complexity]?.some(c => p.complexityLevel.toLowerCase().includes(c))
  );

  if (matchingTypes.length === 0) {
    return { low: 20000, high: 80000, timeline: "2-4 months", reference: null };
  }

  // Calculate average across matching types
  const avgLow = Math.round(matchingTypes.reduce((sum, p) => sum + p.costLow, 0) / matchingTypes.length);
  const avgHigh = Math.round(matchingTypes.reduce((sum, p) => sum + p.costHigh, 0) / matchingTypes.length);
  const timeline = matchingTypes[0].timeline;

  return { low: avgLow, high: avgHigh, timeline, reference: matchingTypes[0] };
}

export function getPricingContext(): string {
  const matrix = loadPricingMatrix();
  
  const projectTypeSummary = matrix.projectCosts.slice(0, 8).map(p => 
    `- ${p.projectType} (${p.complexityLevel}): $${p.costLow.toLocaleString()}-$${p.costHigh.toLocaleString()}, ${p.timeline}`
  ).join("\n");

  return `
## Pricing Reference Matrix

### Project Cost Ranges by Complexity:
${projectTypeSummary}

### Key Cost Drivers:
${matrix.costDrivers.slice(0, 5).map(d => `- ${d}`).join("\n")}

Use these references to calibrate your estimates. Always justify costs based on complexity and features.
`;
}
