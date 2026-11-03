import { runMigrations } from "./migrate.js";
import { pool } from "./pool.js";
import { logger } from "../lib/logger.js";

runMigrations()
  .then(async (count) => {
    logger.info({ applied: count }, "migrations complete");
    await pool.end();
  })
  .catch(async (err) => {
    logger.error({ err }, "migration failed");
    await pool.end();
    process.exit(1);
  });
