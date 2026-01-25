import { insertProjectSchema } from "../shared/schema";

const BASE_URL = "http://localhost:5000/api";

async function verifyWorkflow() {
  console.log("Starting Workflow Verification...");

  // 1. Create Project
  console.log("\n1. Creating Project...");
  const newProject = {
    title: "Test Project Refactor " + Date.now(),
    clientName: "Test Client",
    clientEmail: "test@example.com",
    rawInput:
      "I need a CRM system for a real estate agency. Features: Properties, Agents, Clients, Leads.",
  };

  const createRes = await fetch(`${BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProject),
  });

  if (!createRes.ok) throw new Error(`Create failed: ${createRes.statusText}`);
  const project = await createRes.json();
  console.log(`   Project Created: ${project.id} (Status: ${project.status})`);

  // 2. Approve Draft (Triggers Estimate Generation + Assets)
  // This step might take time as it generates estimate (OpenAI) + Gamma presentation
  console.log("\n2. Approving Draft (Generating Estimate + Assets)... THIS MAY TAKE TIME...");

  // We need to wait a bit or just hit approve-draft.
  // approve-draft will call generateEstimate if missing.
  // Set longer timeout if possible, but fetch waits.
  const timeStart = Date.now();
  const approveRes = await fetch(`${BASE_URL}/projects/${project.id}/approve-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!approveRes.ok) {
    const err = await approveRes.text();
    throw new Error(`Approve Draft failed: ${approveRes.status} - ${err}`);
  }
  const approvedProject = await approveRes.json();
  const timeTaken = (Date.now() - timeStart) / 1000;
  console.log(`   Draft Approved in ${timeTaken.toFixed(1)}s`);
  console.log(`   Status: ${approvedProject.status}`);
  console.log(`   Stage: ${approvedProject.currentStage}`);
  console.log(`   Proposal PDF: ${approvedProject.proposalPdfUrl}`);
  console.log(`   Presentation: ${approvedProject.presentationUrl}`);
  console.log(`   Research MD: ${!!approvedProject.researchMarkdown}`);

  if (approvedProject.currentStage !== 2) throw new Error("Failed to advance to Stage 2");
  if (!approvedProject.presentationUrl)
    console.warn("WARNING: Presentation URL missing (Gamma key might be missing)");

  // 3. Send Email
  console.log("\n3. Sending Email...");
  const emailRes = await fetch(`${BASE_URL}/projects/${project.id}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail: "test@example.com",
      emailSubject: "Test Proposal",
      emailBody: "Here is your proposal.",
    }),
  });

  if (!emailRes.ok) throw new Error(`Send Email failed: ${emailRes.statusText}`);
  const emailResult = await emailRes.json();
  console.log(`   Email Sent. Status: ${emailResult.status} (Stage: ${emailResult.currentStage})`);

  if (emailResult.currentStage !== 3) throw new Error("Failed to advance to Stage 3");

  // 4. Generate Vibe Guide
  console.log("\n4. Generating Vibe Guide...");
  const guideRes = await fetch(`${BASE_URL}/projects/${project.id}/generate-vibe-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!guideRes.ok) throw new Error(`Generate Guide failed: ${guideRes.statusText}`);
  const guideResult = await guideRes.json();
  console.log(
    `   Guides Generated. Status: ${guideResult.status} (Stage: ${guideResult.currentStage})`,
  );
  console.log(`   Guide A Length: ${guideResult.vibecodeGuideA?.length}`);
  console.log(`   Guide B Length: ${guideResult.vibecodeGuideB?.length}`);

  if (guideResult.currentStage !== 4) throw new Error("Failed to advance to Stage 4");

  // 5. Generate PM Breakdown
  console.log("\n5. Generating PM Breakdown...");
  const pmRes = await fetch(`${BASE_URL}/projects/${project.id}/generate-pm-breakdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!pmRes.ok) throw new Error(`Generate PM failed: ${pmRes.statusText}`);
  const pmResult = await pmRes.json();
  console.log(
    `   PM Breakdown Generated. Status: ${pmResult.status} (Stage: ${pmResult.currentStage})`,
  );
  console.log(
    `   PM Phases: ${pmResult.pmBreakdown?.phases?.length || pmResult.pmBreakdown?.length}`,
  );

  // 6. Final Approval
  console.log("\n6. Final Approval...");
  const finalRes = await fetch(`${BASE_URL}/projects/${project.id}/final-approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!finalRes.ok) throw new Error(`Final Approval failed: ${finalRes.statusText}`);
  const finalResult = await finalRes.json();
  console.log(`   Final Approval Complete. Status: ${finalResult.status}`);

  if (finalResult.status !== "complete") throw new Error("Failed to mark complete");

  console.log("\n✅ WORKFLOW VERIFICATION SUCCESSFUL!");
}

verifyWorkflow().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
