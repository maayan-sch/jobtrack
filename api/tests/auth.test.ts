import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser, useCleanDatabase } from "./helpers.js";

describe("auth", () => {
  useCleanDatabase();

  it("registers a user, sets an HttpOnly cookie and returns the user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "New@Example.com", password: "Password123!", fullName: "New User" })
      .expect(201);

    expect(res.body.user).toMatchObject({ email: "new@example.com", fullName: "New User" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toContain("jobtrack_token=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("rejects invalid input with 422 and field details", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" })
      .expect(422);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["email", "password", "fullName"]));
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser("dup@example.com");
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "Password123!", fullName: "Again" })
      .expect(409);
  });

  it("logs in with the right password and rejects the wrong one", async () => {
    await registerUser("login@example.com");
    await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "Password123!" })
      .expect(200);
    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "wrong-password" })
      .expect(401);
    expect(bad.body.error.message).toBe("Invalid email or password");
  });

  it("returns the current user with a cookie and 401 without", async () => {
    const { cookie, user } = await registerUser();
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie).expect(200);
    expect(me.body.user.id).toBe(user.id);
    await request(app).get("/api/auth/me").expect(401);
  });

  it("logout clears the cookie", async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post("/api/auth/logout").set("Cookie", cookie).expect(204);
    expect(String(res.headers["set-cookie"])).toMatch(/jobtrack_token=;/);
  });
});
