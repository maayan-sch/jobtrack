import bcrypt from "bcryptjs";
import { isProd } from "../config.js";
import { pool, query } from "./pool.js";
import { logger } from "../lib/logger.js";

if (isProd) {
  logger.error("Refusing to seed a production database");
  process.exit(1);
}

const DEMO_EMAIL = "demo@jobtrack.dev";
const DEMO_PASSWORD = "Password123!";

type Row = [company: string, role: string, status: string, appliedAt: string, source: string];
const APPLICATIONS: Row[] = [
  ["Wix", "Fullstack Developer", "interview", "2026-08-24", "linkedin"],
  ["Monday.com", "Junior Backend Engineer", "phone_screen", "2026-08-22", "company_site"],
  ["Fiverr", "Frontend Developer", "rejected", "2026-08-10", "referral"],
  ["Lemonade", "Software Engineer", "applied", "2026-08-27", "linkedin"],
  ["Riskified", "Fullstack Engineer", "applied", "2026-08-26", "linkedin"],
  ["Payoneer", "Junior Fullstack", "wishlist", "2026-08-30", "other"],
  ["Melio", "Backend Developer", "offer", "2026-07-30", "referral"],
  ["Gong", "Fullstack Developer", "interview", "2026-08-18", "company_site"],
  ["Yotpo", "Web Developer", "withdrawn", "2026-07-25", "linkedin"],
  ["AppsFlyer", "Junior Software Engineer", "applied", "2026-08-28", "linkedin"],
  ["Via", "Fullstack Engineer", "phone_screen", "2026-08-20", "referral"],
  ["Taboola", "Software Developer", "applied", "2026-08-12", "company_site"],
];

async function seed() {
  await query("DELETE FROM users WHERE email = $1", [DEMO_EMAIL]); // cascades
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const {
    rows: [user],
  } = await query<{ id: string }>(
    "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id",
    [DEMO_EMAIL, passwordHash, "Demo User"],
  );

  for (const [company, role, status, appliedAt, source] of APPLICATIONS) {
    const {
      rows: [app],
    } = await query<{ id: string }>(
      `INSERT INTO applications (user_id, company, role_title, status, applied_at, source)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user.id, company, role, status, appliedAt, source],
    );
    await query(
      `INSERT INTO application_events (application_id, type, content, happened_at)
       VALUES ($1, 'note', $2, $3::date)`,
      [app.id, `Applied via ${source}`, appliedAt],
    );
    if (status === "interview" || status === "offer") {
      await query(
        `INSERT INTO application_events (application_id, type, content)
         VALUES ($1, 'interview', 'Technical interview with the team lead')`,
        [app.id],
      );
    }
  }
  logger.info({ email: DEMO_EMAIL }, "seed complete");
}

seed()
  .then(() => pool.end())
  .catch(async (err) => {
    logger.error({ err }, "seed failed");
    await pool.end();
    process.exit(1);
  });
