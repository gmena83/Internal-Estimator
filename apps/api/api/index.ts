import app from "../src/index.js";
import { registerRoutes } from "../src/routes.js";

// Initialize routes once
let routesRegistered = false;

export default async function handler(req: any, res: any) {
  if (!routesRegistered) {
    await registerRoutes(null as any, app);
    routesRegistered = true;
  }

  // Vercel serverless function signature
  app(req, res);
}
