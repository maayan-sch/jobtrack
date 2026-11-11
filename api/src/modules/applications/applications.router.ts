import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as service from "./applications.service.js";
import {
  createApplicationSchema,
  createEventSchema,
  eventIdParamSchema,
  idParamSchema,
  listApplicationsQuerySchema,
  updateApplicationSchema,
} from "./applications.schemas.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

applicationsRouter.get("/", async (req, res) => {
  const q = listApplicationsQuerySchema.parse(req.query);
  const { items, total } = await service.list(req.userId, q);
  res.json({ items, total, page: q.page, limit: q.limit });
});

applicationsRouter.post("/", async (req, res) => {
  const input = createApplicationSchema.parse(req.body);
  const application = await service.create(req.userId, input);
  res.status(201).json({ application });
});

applicationsRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.get(req.userId, id));
});

applicationsRouter.patch("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const patch = updateApplicationSchema.parse(req.body);
  const application = await service.update(req.userId, id, patch);
  res.json({ application });
});

applicationsRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await service.remove(req.userId, id);
  res.status(204).end();
});

applicationsRouter.post("/:id/events", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = createEventSchema.parse(req.body);
  const event = await service.addEvent(req.userId, id, input);
  res.status(201).json({ event });
});

applicationsRouter.delete("/:id/events/:eventId", async (req, res) => {
  const { id, eventId } = eventIdParamSchema.parse(req.params);
  await service.removeEvent(req.userId, id, eventId);
  res.status(204).end();
});
