import { query } from "../../db/pool.js";
import type { ApplicationStatus } from "../applications/applications.schemas.js";

export async function getStats(userId: string) {
  const [byStatus, perWeek, funnel] = await Promise.all([
    query<{ status: ApplicationStatus; count: number }>(
      `SELECT status, COUNT(*)::int AS count
       FROM applications
       WHERE user_id = $1
       GROUP BY status`,
      [userId],
    ),
    query<{ week: string; count: number }>(
      `SELECT to_char(date_trunc('week', COALESCE(applied_at, created_at::date)), 'YYYY-MM-DD') AS week,
              COUNT(*)::int AS count
       FROM applications
       WHERE user_id = $1
         AND COALESCE(applied_at, created_at::date) >= CURRENT_DATE - INTERVAL '8 weeks'
       GROUP BY 1
       ORDER BY 1`,
      [userId],
    ),
    query<{ applied: number; interviewed: number }>(
      `SELECT COUNT(*) FILTER (WHERE status <> 'wishlist')::int AS applied,
              COUNT(*) FILTER (WHERE status IN ('interview', 'offer'))::int AS interviewed
       FROM applications
       WHERE user_id = $1`,
      [userId],
    ),
  ]);

  const { applied, interviewed } = funnel.rows[0];
  return {
    byStatus: byStatus.rows,
    perWeek: perWeek.rows,
    conversionRate:
      applied === 0 ? 0 : Math.round((interviewed / applied) * 100),
  };
}
