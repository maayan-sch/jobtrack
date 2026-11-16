import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser, useCleanDatabase } from "./helpers.js";

const payload = { company: "Wix", roleTitle: "Fullstack Developer", appliedAt: "2026-09-01" };

describe("applications", () => {
  useCleanDatabase();

  it("requires authentication", async () => {
    await request(app).get("/api/applications").expect(401);
  });

  it("creates, reads, updates and deletes an application", async () => {
    const { cookie } = await registerUser();

    const created = await request(app)
      .post("/api/applications")
      .set("Cookie", cookie)
      .send(payload)
      .expect(201);
    const id = created.body.application.id;
    expect(created.body.application).toMatchObject({ ...payload, status: "applied" });

    const fetched = await request(app)
      .get(`/api/applications/${id}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(fetched.body.application.appliedAt).toBe("2026-09-01");
    expect(fetched.body.events).toEqual([]);

    const updated = await request(app)
      .patch(`/api/applications/${id}`)
      .set("Cookie", cookie)
      .send({ status: "interview" })
      .expect(200);
    expect(updated.body.application.status).toBe("interview");
    expect(updated.body.application.company).toBe("Wix");

    await request(app).delete(`/api/applications/${id}`).set("Cookie", cookie).expect(204);
    await request(app).get(`/api/applications/${id}`).set("Cookie", cookie).expect(404);
  });

  it("isolates data between users", async () => {
    const alice = await registerUser("alice@example.com");
    const bob = await registerUser("bob@example.com");
    const created = await request(app)
      .post("/api/applications")
      .set("Cookie", alice.cookie)
      .send(payload)
      .expect(201);
    const id = created.body.application.id;

    await request(app).get(`/api/applications/${id}`).set("Cookie", bob.cookie).expect(404);
    await request(app)
      .patch(`/api/applications/${id}`)
      .set("Cookie", bob.cookie)
      .send({ status: "offer" })
      .expect(404);
    await request(app).delete(`/api/applications/${id}`).set("Cookie", bob.cookie).expect(404);
    await request(app)
      .post(`/api/applications/${id}/events`)
      .set("Cookie", bob.cookie)
      .send({ type: "note", content: "hacked" })
      .expect(404);

    const list = await request(app).get("/api/applications").set("Cookie", bob.cookie).expect(200);
    expect(list.body.total).toBe(0);
  });

  it("filters, searches and paginates", async () => {
    const { cookie } = await registerUser();
    const rows = [
      { company: "Wix", roleTitle: "Fullstack", status: "applied" },
      { company: "Monday", roleTitle: "Backend", status: "interview" },
      { company: "Fiverr", roleTitle: "Fullstack", status: "applied" },
    ];
    for (const row of rows) {
      await request(app).post("/api/applications").set("Cookie", cookie).send(row).expect(201);
    }

    const applied = await request(app)
      .get("/api/applications?status=applied")
      .set("Cookie", cookie)
      .expect(200);
    expect(applied.body.total).toBe(2);

    const search = await request(app)
      .get("/api/applications?search=full")
      .set("Cookie", cookie)
      .expect(200);
    expect(search.body.items.map((a: { company: string }) => a.company).sort()).toEqual([
      "Fiverr",
      "Wix",
    ]);

    const page = await request(app)
      .get("/api/applications?limit=2&page=2&sort=company:asc")
      .set("Cookie", cookie)
      .expect(200);
    expect(page.body.items).toHaveLength(1);
    expect(page.body.items[0].company).toBe("Wix");

    await request(app).get("/api/applications?sort=user_id:asc").set("Cookie", cookie).expect(422);
  });
});
