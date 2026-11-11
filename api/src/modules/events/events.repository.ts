import { query } from "../../db/pool.js";
import type {
  CreateEventInput,
  EventType,
} from "../applications/applications.schemas.js";

export interface EventRow {
  id: string;
  application_id: string;
  type: EventType;
  content: string;
  happened_at: Date;
  created_at: Date;
}

export function toEvent(row: EventRow) {
  return {
    id: row.id,
    applicationId: row.application_id,
    type: row.type,
    content: row.content,
    happenedAt: row.happened_at,
    createdAt: row.created_at,
  };
}
export type ApplicationEvent = ReturnType<typeof toEvent>;

export async function listEvents(applicationId: string) {
  const { rows } = await query<EventRow>(
    "SELECT * FROM application_events WHERE application_id = $1 ORDER BY happened_at DESC, created_at DESC",
    [applicationId],
  );
  return rows.map(toEvent);
}

// INSERT ... SELECT: the row is inserted only if the application belongs to the user.
// Zero rows returned means "not yours or does not exist" -> the service returns 404.
export async function createEvent(
  userId: string,
  applicationId: string,
  input: CreateEventInput,
) {
  const { rows } = await query<EventRow>(
    `INSERT INTO application_events (application_id, type, content, happened_at)
     SELECT a.id, $2, $3, COALESCE($4::timestamptz, now())
     FROM applications a
     WHERE a.id = $1 AND a.user_id = $5
     RETURNING *`,
    [
      applicationId,
      input.type,
      input.content,
      input.happenedAt ?? null,
      userId,
    ],
  );
  return rows[0] ? toEvent(rows[0]) : null;
}

export async function deleteEvent(
  userId: string,
  applicationId: string,
  eventId: string,
) {
  const result = await query(
    `DELETE FROM application_events e
     USING applications a
     WHERE e.id = $1 AND e.application_id = a.id AND a.id = $2 AND a.user_id = $3`,
    [eventId, applicationId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}
