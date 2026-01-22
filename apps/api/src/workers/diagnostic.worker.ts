import { parentPort } from "node:worker_threads";
import { runDiagnostics } from "../diagnostics-service.js";

if (!parentPort) {
  throw new Error("Worker not found");
}

parentPort.on("message", async (message) => {
  if (message.type === "START_DIAGNOSTICS") {
    try {
      const results = await runDiagnostics(message.repoUrl);
      parentPort?.postMessage({ type: "SUCCESS", results });
    } catch (error) {
      parentPort?.postMessage({
        type: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});
