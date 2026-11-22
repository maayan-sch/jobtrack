import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser, useCleanDatabase } from "./helpers.js";

const payload = { company: "Wix", roleTitle: "Fullstack Developer", appliedAt: "2026-09-01" };

describe("events", () => {
  useCleanDatabase();

  it("creates, reads and deletes events", async () => {
    const { cookie } = await registerUser();

    const createdApplication = await request(app)
      .post("/api/applications")
      .set("Cookie", cookie)
      .send(payload)
      .expect(201);

    const idApplication = createdApplication.body.application.id;

    const createNote = await request(app)
      .post(`/api/applications/${idApplication}/events`)
      .set("Cookie", cookie)
      .send({ type: "note", content: "This is a note" })
      .expect(201);
    const noteId = createNote.body.event.id;

    const createInterview = await request(app)
      .post(`/api/applications/${idApplication}/events`)
      .set("Cookie", cookie)
      .send({ type: "interview", content: "This is an interview" })
      .expect(201);
    const interviewId = createInterview.body.event.id;

    const createFollowUp = await request(app)
      .post(`/api/applications/${idApplication}/events`)
      .set("Cookie", cookie)
      .send({ type: "follow_up", content: "This is a follow-up" })
      .expect(201);
    const followUpId = createFollowUp.body.event.id;

    const fetched = await request(app)
      .get(`/api/applications/${idApplication}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(fetched.body.events).toHaveLength(3);
    expect(fetched.body.events.map((event: { content: string }) => event.content)).toEqual([
      "This is a follow-up",
      "This is an interview",
      "This is a note",
    ]);

    await request(app)
      .delete(`/api/applications/${idApplication}/events/${noteId}`)
      .set("Cookie", cookie)
      .expect(204);

    await request(app)
      .delete(`/api/applications/${idApplication}/events/${interviewId}`)
      .set("Cookie", cookie)
      .expect(204);

    await request(app)
      .delete(`/api/applications/${idApplication}/events/${followUpId}`)
      .set("Cookie", cookie)
      .expect(204);

    const afterAllDeletes = await request(app)
      .get(`/api/applications/${idApplication}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(afterAllDeletes.body.events).toHaveLength(0);
  });

  it("isolates events between users", async () => {
    const alice = await registerUser("alice@example.com");
    const bob = await registerUser("bob@example.com");
    const created = await request(app)
      .post("/api/applications")
      .set("Cookie", alice.cookie)
      .send(payload)
      .expect(201);
    const id = created.body.application.id;

    const createEvent = await request(app)
      .post(`/api/applications/${id}/events`)
      .set("Cookie", alice.cookie)
      .send({ type: "note", content: "Alice's note" })
      .expect(201);
    const eventId = createEvent.body.event.id;

    await request(app).get(`/api/applications/${id}`).set("Cookie", bob.cookie).expect(404);
    await request(app)
      .post(`/api/applications/${id}/events`)
      .set("Cookie", bob.cookie)
      .send({ type: "note", content: "Bob's note" })
      .expect(404);
    await request(app)
      .delete(`/api/applications/${id}/events/${eventId}`)
      .set("Cookie", bob.cookie)
      .expect(404);
  });
});
