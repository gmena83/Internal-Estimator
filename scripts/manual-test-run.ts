import { aiService } from "../apps/api/src/ai-service.js";
import { storage } from "../apps/api/src/storage.js";
import fs from "fs/promises";
import path from "path";

async function run() {
  console.log("Starting manual test run verification...");

  const scenariosPath = path.join(process.cwd(), "qa_scenarios.json");
  let scenarios = [];
  try {
    const data = await fs.readFile(scenariosPath, "utf-8");
    scenarios = JSON.parse(data);
  } catch (e) {
    console.error("Failed to load scenarios", e);
    process.exit(1);
  }

  // Run just the first one for verification to save time
  const scenario = scenarios[0];
  console.log(`Running scenario: ${scenario}`);

  try {
    const project = await storage.createProject({
      name: `Test Run Verify: ${scenario.substring(0, 15)}...`,
      client: "Test Suite Verify",
      description: scenario,
      status: "active",
    });
    console.log(`Project created: ${project.id}`);

    await aiService.processRawInput(project.id, scenario);
    console.log("AI Service finished processing.");

    const updated = await storage.getProject(project.id);
    console.log("Project status:", updated.status);
    console.log("Estimate Markdown Present:", !!updated.estimateMarkdown);

    if (updated.estimateMarkdown) {
      console.log("SUCCESS: Verification Passed");
    } else {
      console.error("FAILURE: No estimate generated");
      process.exit(1);
    }
  } catch (err) {
    console.error("FAILURE: Script crashed", err);
    process.exit(1);
  }
}

run();
