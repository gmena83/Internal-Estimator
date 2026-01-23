import "dotenv/config";
import express, { type Request, Response, NextFunction, type Express } from "express";
import { registerRoutes } from "./routes.js";

const app: Express = express();

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Initialization wrapper for Vercel
let initialized = false;
const init = async () => {
  if (initialized) return;
  try {
      // Pass null for httpServer as we are in serverless mode (no direct server control)
      await registerRoutes(null as any, app);

      // Add error handler AFTER routes
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          console.error("Express error handler:", err);
          if (!res.headersSent) {
            res.status(status).json({ message });
          }
      });

      initialized = true;
      log("Routes registered successfully");
  } catch (error) {
      console.error("Failed to register routes:", error);
      throw error;
  }
};

// Export app for serverless usage (wrapped)
export default async (req: Request, res: Response) => {
    try {
        await init();
        app(req, res);
    } catch (err: any) {
        console.error("Serverless handler error:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
};

// Only start listening if run directly (development / standalone)
// ESM compatible check for direct execution
import { fileURLToPath } from "url";

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  (async () => {
    try {
        await registerRoutes(null as any, app);

        // Enable static client serving in production standalone mode
        if (process.env.NODE_ENV === "production") {
          const { serveStatic } = await import("./static.js");
          serveStatic(app);
        }

        app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          res.status(status).json({ message });
          if (status === 500) console.error(err);
        });

        const port = parseInt(process.env.PORT || "5000", 10);
        app.listen(port, "0.0.0.0", () => {
          log(`Express server serving on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
  })();
}
