import { Router } from "express";
import { storage } from "../storage";

const router: Router = Router();

// Search Knowledge Base
router.get("/", async (req, res) => {
  try {
    const { category, q } = req.query;
    let entries;

    if (q && typeof q === "string") {
      entries = await storage.searchKnowledgeEntries(q, category as string);
    } else {
      entries = await storage.getKnowledgeEntries(category as string);
    }

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch knowledge entries" });
  }
});

export default router;
