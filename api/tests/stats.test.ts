import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser, useCleanDatabase } from "./helpers.js";

const payloads = [
  { company: "Wix", roleTitle: "Fullstack Developer", appliedAt: "2026-09-01", status: "applied" },
  {
    company: "Fiverr",
    roleTitle: "Frontend Developer",
    appliedAt: "2026-09-02",
    status: "interview",
  },
  { company: "Google", roleTitle: "Backend Developer", appliedAt: "2026-09-03", status: "offer" },
  { company: "Meta", roleTitle: "Fullstack Developer", appliedAt: "2026-09-04", status: "applied" },
];

describe("stats", () => {
  useCleanDatabase();

  it("returns application counts grouped by status", async () => {
    const { cookie } = await registerUser();

    for (const payload of payloads) {
      await request(app).post("/api/applications").set("Cookie", cookie).send(payload).expect(201);
    }

    const res = await request(app).get("/api/stats").set("Cookie", cookie).expect(200);
    expect(res.body.byStatus).toEqual([
      { status: "applied", count: 2 },
      { status: "interview", count: 1 },
      { status: "offer", count: 1 },
    ]);
  });

  it("calculates the conversion rate correctly", async () => {
    const { cookie } = await registerUser();

    for (const payload of payloads) {
      await request(app).post("/api/applications").set("Cookie", cookie).send(payload).expect(201);
    }

    const res = await request(app).get("/api/stats").set("Cookie", cookie).expect(200);
    expect(res.body.conversionRate).toBe(50);
  });
});
