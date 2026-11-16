import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";
import { logger } from "../lib/logger.js";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

export async function runMigrations(): Promise<number> {
  const client = await pool.connect();
  let applied = 0;
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
    const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
    const done = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        logger.info({ file }, "migration applied");
        applied += 1;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`, {
          cause: err,
        });
      }
    }
  } finally {
    client.release();
  }
  return applied;
}
