import { Router } from "express";
import { pool } from "../../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const uptime = Math.round(process.uptime());
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok", uptime });
  } catch {
    res.status(503).json({ status: "degraded", db: "unreachable", uptime });
  }
});
