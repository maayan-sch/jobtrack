import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://jobtrack:jobtrack@localhost:5432/jobtrack_test",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      LOG_LEVEL: "silent",
    },
  },
});
