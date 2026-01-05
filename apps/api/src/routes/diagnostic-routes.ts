import { Router } from "express";
import { storage } from "../storage";
import { Worker } from "node:worker_threads";

const router = Router();

// Create diagnostic report
router.post("/", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: "Repository URL is required" });

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ error: "Invalid GitHub URL format" });

    const [, owner, repoName] = match;
    const cleanRepoName = repoName.replace(/\.git$/, "");

    const report = await storage.createDiagnosticReport({
      repoUrl,
      repoOwner: owner,
      repoName: cleanRepoName,
      status: "analyzing",
    });

    // Run diagnostics asynchronously
    // Run diagnostics in a worker thread (non-blocking)
    const worker = new Worker(new URL("../workers/diagnostic.worker.ts", import.meta.url));

    worker.postMessage({ type: "START_DIAGNOSTICS", repoUrl });

    worker.on("message", async (msg) => {
      if (msg.type === "SUCCESS") {
        const results = msg.results;
        await storage.updateDiagnosticReport(report.id, {
          status: "completed",
          healthAssessment: results.healthAssessment,
          criticalCount: results.counts.critical,
          highCount: results.counts.high,
          mediumCount: results.counts.medium,
          lowCount: results.counts.low,
          findings: results.findings,
          correctedSnippets: results.snippets,
          fullReportMarkdown: results.fullReport,
          analyzedFiles: results.analyzedFiles,
        });
        worker.terminate();
      } else if (msg.type === "ERROR") {
        console.error("Diagnostic worker error:", msg.error);
        await storage.updateDiagnosticReport(report.id, {
          status: "failed",
          healthAssessment: `Analysis failed: ${msg.error}`,
        });
        worker.terminate();
      }
    });

    worker.on("error", async (err) => {
      console.error("Diagnostic worker system error:", err);
      await storage.updateDiagnosticReport(report.id, {
        status: "failed",
        healthAssessment: "System error during analysis",
      });
      worker.terminate();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Diagnostic worker stopped with exit code ${code}`);
      }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to create diagnostic report" });
  }
});

// Get diagnostic reports
router.get("/", async (_req, res) => {
  try {
    const reports = await storage.getDiagnosticReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch diagnostic reports" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const report = await storage.getDiagnosticReport(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch diagnostic report" });
  }
});

export default router;
