import app from "../src/index";
import { registerRoutes } from "../src/routes";

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
