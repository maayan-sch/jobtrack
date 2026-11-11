import { query } from "../../db/pool.js";
import type {
  ApplicationStatus,
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationInput,
} from "./applications.schemas.js";

export interface ApplicationRow {
  id: string;
  user_id: string;
  company: string;
  role_title: string;
  status: ApplicationStatus;
  source: string | null;
  job_url: string | null;
  location: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toApplication(row: ApplicationRow) {
  return {
    id: row.id,
    company: row.company,
    roleTitle: row.role_title,
    status: row.status,
    source: row.source,
    jobUrl: row.job_url,
    location: row.location,
    notes: row.notes,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export type Application = ReturnType<typeof toApplication>;

// Only values from this map ever reach the SQL string. The key is validated by Zod.
const SORT_SQL: Record<ListApplicationsQuery["sort"], string> = {
  "created_at:desc": "created_at DESC",
  "created_at:asc": "created_at ASC",
  "applied_at:desc": "applied_at DESC NULLS LAST",
  "applied_at:asc": "applied_at ASC NULLS LAST",
  "company:asc": "company ASC",
  "company:desc": "company DESC",
};

// API field name -> DB column. Also acts as a whitelist for UPDATE.
const COLUMN_OF: Record<keyof UpdateApplicationInput, string> = {
  company: "company",
  roleTitle: "role_title",
  status: "status",
  source: "source",
  jobUrl: "job_url",
  location: "location",
  notes: "notes",
  appliedAt: "applied_at",
};

export async function listApplications(
  userId: string,
  q: ListApplicationsQuery,
) {
  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (q.status) {
    params.push(q.status);
    conditions.push(`status = $${params.length}`);
  }
  if (q.search) {
    params.push(`%${q.search}%`);
    conditions.push(
      `(company ILIKE $${params.length} OR role_title ILIKE $${params.length})`,
    );
  }

  const where = conditions.join(" AND ");
  const offset = (q.page - 1) * q.limit;

  const [items, count] = await Promise.all([
    query<ApplicationRow>(
      `SELECT * FROM applications
       WHERE ${where}
       ORDER BY ${SORT_SQL[q.sort]}, id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, q.limit, offset],
    ),
    query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM applications WHERE ${where}`,
      params,
    ),
  ]);

  return { items: items.rows.map(toApplication), total: count.rows[0].total };
}

export async function findApplicationById(userId: string, id: string) {
  const { rows } = await query<ApplicationRow>(
    "SELECT * FROM applications WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return rows[0] ? toApplication(rows[0]) : null;
}

export async function createApplication(
  userId: string,
  input: CreateApplicationInput,
) {
  const { rows } = await query<ApplicationRow>(
    `INSERT INTO applications
       (user_id, company, role_title, status, source, job_url, location, notes, applied_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      input.company,
      input.roleTitle,
      input.status,
      input.source ?? null,
      input.jobUrl ?? null,
      input.location ?? null,
      input.notes ?? null,
      input.appliedAt ?? null,
    ],
  );
  return toApplication(rows[0]);
}

export async function updateApplication(
  userId: string,
  id: string,
  patch: UpdateApplicationInput,
) {
  const entries = Object.entries(patch).filter(
    ([, value]) => value !== undefined,
  );
  const sets = entries.map(
    ([key], i) =>
      `${COLUMN_OF[key as keyof UpdateApplicationInput]} = $${i + 3}`,
  );
  const values = entries.map(([, value]) => value);

  const { rows } = await query<ApplicationRow>(
    `UPDATE applications
     SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, ...values],
  );
  return rows[0] ? toApplication(rows[0]) : null;
}

export async function deleteApplication(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await query(
    "DELETE FROM applications WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}
