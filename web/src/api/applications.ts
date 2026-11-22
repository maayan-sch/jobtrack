import { api } from "./client";
import type {
  Application,
  ApplicationEvent,
  ApplicationInput,
  Paginated,
  Stats,
} from "./types";

export interface ListParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export function listApplications(params: ListParams) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return api<Paginated<Application>>(`/applications?${qs}`);
}

export function getApplication(id: string) {
  return api<{ application: Application; events: ApplicationEvent[] }>(
    `/applications/${id}`,
  );
}

export function createApplication(input: Partial<ApplicationInput>) {
  return api<{ application: Application }>("/applications", {
    method: "POST",
    body: input,
  });
}

export function updateApplication(
  id: string,
  patch: Partial<ApplicationInput>,
) {
  return api<{ application: Application }>(`/applications/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteApplication(id: string) {
  return api<void>(`/applications/${id}`, { method: "DELETE" });
}

export function addEvent(
  id: string,
  input: { type: string; content: string; happenedAt?: string },
) {
  return api<{ event: ApplicationEvent }>(`/applications/${id}/events`, {
    method: "POST",
    body: input,
  });
}

export function deleteEvent(id: string, eventId: string) {
  return api<void>(`/applications/${id}/events/${eventId}`, {
    method: "DELETE",
  });
}

export function getStats() {
  return api<Stats>("/stats");
}
