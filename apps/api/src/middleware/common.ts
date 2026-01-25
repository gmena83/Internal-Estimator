import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

/**
 * Logs route usage in QA mode for instrumentation.
 */
const qaDir = path.join(process.cwd(), "qa_results");
if (!fs.existsSync(qaDir)) fs.mkdirSync(qaDir, { recursive: true });
const logStream = fs.createWriteStream(path.join(qaDir, "route_logs.txt"), { flags: "a" });

/**
 * Logs route usage in QA mode for instrumentation.
 */
export const qaLogger = (req: Request, _res: Response, next: NextFunction) => {
  if (process.env.QA_MODE !== "true") return next();

  const paramRegex = /\/[0-9a-fA-F-]{36}/g; // UUID matcher
  const cleanPath = req.path.replace(paramRegex, "/:id");
  const logLine = `${new Date().toISOString()} | ${req.method} ${cleanPath}\n`;

  logStream.write(logLine, (err) => {
    if (err) console.error("Failed to log route usage:", err);
  });
  next();
};

/**
 * Normalizes response payloads (e.g., ensuring consistent URL formats).
 */
export const responseNormalizer = (_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = (body: any) => {
    // Logic to normalize URLs or clean payloads could go here
    if (body && typeof body === "object") {
      // Example: Ensure links are absolute if needed
    }
    return originalJson.call(res, body);
  };
  next();
};
