import { notFound } from "../../lib/errors.js";
import * as repo from "./applications.repository.js";
import * as eventsRepo from "../events/events.repository.js";
import type {
  CreateApplicationInput,
  CreateEventInput,
  ListApplicationsQuery,
  UpdateApplicationInput,
} from "./applications.schemas.js";

export function list(userId: string, q: ListApplicationsQuery) {
  return repo.listApplications(userId, q);
}

export async function get(userId: string, id: string) {
  const application = await repo.findApplicationById(userId, id);
  if (!application) throw notFound("Application");
  const events = await eventsRepo.listEvents(application.id);
  return { application, events };
}

export function create(userId: string, input: CreateApplicationInput) {
  return repo.createApplication(userId, input);
}

export async function update(
  userId: string,
  id: string,
  patch: UpdateApplicationInput,
) {
  const application = await repo.updateApplication(userId, id, patch);
  if (!application) throw notFound("Application");
  return application;
}

export async function remove(userId: string, id: string) {
  const deleted = await repo.deleteApplication(userId, id);
  if (!deleted) throw notFound("Application");
}

export async function addEvent(
  userId: string,
  applicationId: string,
  input: CreateEventInput,
) {
  const event = await eventsRepo.createEvent(userId, applicationId, input);
  if (!event) throw notFound("Application");
  return event;
}

export async function removeEvent(
  userId: string,
  applicationId: string,
  eventId: string,
) {
  const deleted = await eventsRepo.deleteEvent(userId, applicationId, eventId);
  if (!deleted) throw notFound("Event");
}
