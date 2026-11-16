import { z } from "zod";

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const EVENT_TYPES = ["note", "status_change", "interview", "follow_up"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const applicationFields = z.object({
  company: z.string().trim().min(1).max(120),
  roleTitle: z.string().trim().min(1).max(120),
  status: z.enum(APPLICATION_STATUSES),
  source: optionalText(50),
  jobUrl: z.url().max(2048).nullable().optional(),
  location: optionalText(120),
  notes: optionalText(5000),
  appliedAt: z.iso.date().nullable().optional(), // "YYYY-MM-DD"
});

export const createApplicationSchema = applicationFields.extend({
  status: z.enum(APPLICATION_STATUSES).default("applied"),
});

export const updateApplicationSchema = applicationFields
  .partial()
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), {
    message: "At least one field is required",
  });

export const SORT_OPTIONS = [
  "created_at:desc",
  "created_at:asc",
  "applied_at:desc",
  "applied_at:asc",
  "company:asc",
  "company:desc",
] as const;

export const listApplicationsQuerySchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(SORT_OPTIONS).default("created_at:desc"),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export const idParamSchema = z.object({ id: z.uuid() });
export const eventIdParamSchema = z.object({ id: z.uuid(), eventId: z.uuid() });

export const createEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  content: z.string().trim().min(1).max(2000),
  happenedAt: z.iso.datetime().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
