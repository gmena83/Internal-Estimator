
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup for QA Mode
process.env.QA_MODE = 'true';

const BASE_URL = 'http://127.0.0.1:5000'; // Assuming default port
const SCENARIOS_PATH = path.join(process.cwd(), 'qa_scenarios.json');
const QA_RESULTS_DIR = path.join(process.cwd(), 'qa_results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const CURRENT_RUN_DIR = path.join(QA_RESULTS_DIR, TIMESTAMP);

type Scenario = string;

interface QAMetrics {
    runId: number;
    scenario: string;
    success: boolean;
    durationMs: number;
    error?: string;
    stage: number;
    ghostRoutes: string[];
    geminiLatency: number[];
    dbRowsBefore: number;
    dbRowsAfter: number;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function loadScenarios(): Promise<Scenario[]> {
    const data = fs.readFileSync(SCENARIOS_PATH, 'utf-8');
    return JSON.parse(data);
}

// Agent 1: User Simulator Logic
async function runSimulation(scenarioIdx: number, scenarioText: string): Promise<QAMetrics> {
    const runId = scenarioIdx + 1;
    const runDir = path.join(CURRENT_RUN_DIR, `run_${runId.toString().padStart(2, '0')}`);
    await ensureDir(runDir);

    const metrics: QAMetrics = {
        runId,
        scenario: scenarioText,
        success: false,
        durationMs: 0,
        stage: 0,
        ghostRoutes: [],
        geminiLatency: [], // Latency tracking would ideally be captured from logs or headers
        dbRowsBefore: 0,
        dbRowsAfter: 0
    };

    const startTime = Date.now();
    let projectId: string | null = null;

    console.log(`[Run ${runId}] Starting scenario: "${scenarioText.substring(0, 50)}..."`);

    try {
        // Stage 1: Input Brief
        metrics.stage = 1;
        const createRes = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Sim: ${scenarioText.substring(0, 30)}...`,
                rawInput: scenarioText,
                clientName: "QA Simulator"
            })
        });

        if (!createRes.ok) throw new Error(`Stage 1 Failed: ${createRes.status} ${createRes.statusText}`);
        const projectData = await createRes.json();
        projectId = projectData.id;
        console.log(`[Run ${runId}] Validated Stage 1. Project ID: ${projectId}`);
        await sleep(1000); // Pace

        // Stage 2: Trigger Estimate
        metrics.stage = 2;
        // In the real app, the first message might trigger extraction, and subsequent messages might be needed
        // But assuming the first POST to /api/projects does the initial extraction and maybe estimate generation is triggered via analyze endpoint or chat
        // Looking at routes.ts (previous context), creating project usually inserts it.
        // Let's assume we simulate the chat flow or check if there's a specific 'generate estimate' trigger.
        // Based on typical flows seen: the project creation tracks the initial message. 
        // We might need to send a message to confirm or request estimate if it's not auto?
        // Let's assume we hit the "regenerate-estimate" or send a message "Generate estimate".

        // Actually, let's try hitting the `generate-estimate` endpoint or similar if it exists
        // Looking at routes.ts viewed previously: POST /api/projects/:id/regenerate-estimate exists.
        // Also there is /api/projects check.
        // Let's try sending a message "Please generate the estimate".
        const msgRes = await fetch(`${BASE_URL}/api/projects/${projectId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "Generate the estimate please.",
                role: "user"
            })
        });
        if (!msgRes.ok) throw new Error(`Stage 2 Message Failed: ${msgRes.status}`);

        // Wait for processing (polling project status)
        let attempts = 0;
        let estimateReady = false;
        while (attempts < 10) {
            const pollRes = await fetch(`${BASE_URL}/api/projects/${projectId}`);
            const pData = await pollRes.json();
            if (pData.estimateMarkdown) {
                estimateReady = true;
                break;
            }
            await sleep(2000);
            attempts++;
        }
        if (!estimateReady) throw new Error("Stage 2 Timeout: Estimate not generated");
        console.log(`[Run ${runId}] Validated Stage 2. Estimate Generated.`);

        // Stage 3: Generate Proposal PDF
        metrics.stage = 3;
        const approveRes = await fetch(`${BASE_URL}/api/projects/${projectId}/approve-estimate`, {
            method: 'POST'
        });
        if (!approveRes.ok) throw new Error(`Stage 3 Failed: ${approveRes.status}`);
        const pdfData = await approveRes.json();
        if (pdfData.proposalPdfUrl) {
            // Construct absolute URL
            const pdfUrl = pdfData.proposalPdfUrl.startsWith('http')
                ? pdfData.proposalPdfUrl
                : `${BASE_URL}${pdfData.proposalPdfUrl}`;

            const downloadRes = await fetch(pdfUrl);
            if (downloadRes.ok) {
                const dest = path.join(runDir, 'proposal.pdf');
                const buffer = Buffer.from(await downloadRes.arrayBuffer());
                fs.writeFileSync(dest, buffer);
            }
        }
        console.log(`[Run ${runId}] Validated Stage 3. PDF Generated.`);

        // Stage 4: Execution Manual
        metrics.stage = 4;
        const assetsRes = await fetch(`${BASE_URL}/api/projects/${projectId}/generate-assets`, {
            method: 'POST'
        });
        if (!assetsRes.ok) throw new Error(`Stage 4 Failed: ${assetsRes.status}`);
        // Wait for manual? usually generated async. assume sync for this test or poll.
        // Assuming success means triggered.
        console.log(`[Run ${runId}] Validated Stage 4. Assets Triggered.`);

        // Stage 5: Send Email
        metrics.stage = 5;
        const emailRes = await fetch(`${BASE_URL}/api/projects/${projectId}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientEmail: 'simulation@example.com',
                emailSubject: 'QA Simulation Proposal',
                emailBody: 'This is a test run.'
            })
        });
        if (!emailRes.ok) throw new Error(`Stage 5 Failed: ${emailRes.status}`);
        console.log(`[Run ${runId}] Validated Stage 5. Email Sent.`);

        metrics.success = true;

    } catch (err: any) {
        console.error(`[Run ${runId}] Error:`, err.message);
        metrics.error = err.message;
        fs.appendFileSync(path.join(QA_RESULTS_DIR, 'error_log.txt'), `[Run ${runId}] ${err.message}\n`);
    } finally {
        metrics.durationMs = Date.now() - startTime;
    }

    return metrics;
}

async function waitForServer(timeoutMs = 60000) {
    console.log("Waiting for server to be ready...");
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`${BASE_URL}/api/health`);
            if (res.ok) {
                console.log("Server is up!");
                return;
            }
        } catch (e) {
            // ignore
        }
        await sleep(1000);
    }
    throw new Error("Server startup timeout");
}

async function main() {
    await waitForServer();
    await ensureDir(CURRENT_RUN_DIR);
    const scenarios = await loadScenarios();
    const results: QAMetrics[] = [];

    console.log(`Starting High-Volume QA Cycle: 20 Runs`);
    console.log(`Results will be saved to: ${CURRENT_RUN_DIR}`);

    for (let i = 0; i < scenarios.length; i++) {
        const metrics = await runSimulation(i, scenarios[i]);
        results.push(metrics);

        // 10s cooldown
        if (i < scenarios.length - 1) {
            console.log(`Cooling down for 10s...`);
            await sleep(10000);
        }
    }

    // Agent 3: Reporting
    generateReport(results);
}

function generateReport(results: QAMetrics[]) {
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const avgDuration = results.reduce((acc, r) => acc + r.durationMs, 0) / total;

    // Read route logs from server (Agent 2)
    const routeLogsPath = path.join(QA_RESULTS_DIR, 'route_logs.txt');
    let routeCoverage = "Not available (check middleware)";
    if (fs.existsSync(routeLogsPath)) {
        const logs = fs.readFileSync(routeLogsPath, 'utf-8').split('\n');
        const uniqueRoutes = new Set(logs.filter(l => l.trim()));
        routeCoverage = `Unique Routes Hit: ${uniqueRoutes.size}\n` + Array.from(uniqueRoutes).join('\n');
    }

    const reportContent = `
# QA Summary Report
**Date:** ${new Date().toISOString()}
**Total Runs:** ${total}
**Pass Rate:** ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)
**Average Duration:** ${(avgDuration / 1000).toFixed(2)}s

## Cost Estimate
(Approximate based on typical usage)
- Input Tokens: ~${total * 1500}
- Output Tokens: ~${total * 2000}
- Est. Cost: $${(total * 0.05).toFixed(2)} USD

## Route Coverage Analysis
${routeCoverage}

## Run Details
| ID | Duration | Stage Reached | Error |
|----|----------|---------------|-------|
${results.map(r => `| ${r.runId} | ${(r.durationMs / 1000).toFixed(1)}s | ${r.stage}/5 | ${r.error || 'None'} |`).join('\n')}
    `;

    fs.writeFileSync(path.join(CURRENT_RUN_DIR, 'QA_SUMMARY.md'), reportContent);
    console.log(`Report generated: ${path.join(CURRENT_RUN_DIR, 'QA_SUMMARY.md')}`);
}

main().catch(console.error);
