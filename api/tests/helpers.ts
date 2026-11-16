import request from "supertest";
import { beforeAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { runMigrations } from "../src/db/migrate.js";

export const app = createApp();

export function useCleanDatabase() {
  beforeAll(async () => {
    await runMigrations();
  });
  beforeEach(async () => {
    await pool.query("TRUNCATE users, applications, application_events CASCADE");
  });
}

export async function registerUser(email = "user@example.com") {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "Password123!", fullName: "Test User" })
    .expect(201);
  const cookie = res.headers["set-cookie"] as unknown as string[];
  return { cookie, user: res.body.user as { id: string; email: string } };
}
