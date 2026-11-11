import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getStats } from "./stats.repository.js";

export const statsRouter = Router();
statsRouter.get("/", requireAuth, async (req, res) => {
  res.json(await getStats(req.userId));
});
