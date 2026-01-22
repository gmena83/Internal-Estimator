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

// Export app for serverless usage
export default app;

// Only start listening if run directly (development / standalone)
// ESM compatible check for direct execution
import { fileURLToPath } from "url";

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
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
  })();
} else {
  // For Vercel/Serverless: Routes must be registered before export
  // We wrap this in a promise or just register them synchronously if possible?
  // The current registerRoutes is async. This poses a challenge for Vercel which expects a synchronous export often,
  // OR we need the entry point to handle the async init.
  // Let's modify the Vercel entry point to handle this or make registerRoutes sync if possible.
  // BUT, registerRoutes is async.
  // However, in the provided Vercel adapter pattern, we usually export `(req, res) => { app(req, res) }`.
  // We can lazily initialize routes in the adapter.
}
