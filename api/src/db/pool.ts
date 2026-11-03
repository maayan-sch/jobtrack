import pg from "pg";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle PostgreSQL client");
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  const start = performance.now();
  const result = await pool.query<T>(text, params);
  logger.debug(
    {
      sql: text.replace(/\s+/g, " ").trim(),
      ms: Math.round(performance.now() - start),
      rows: result.rowCount,
    },
    "db query",
  );
  return result;
}
