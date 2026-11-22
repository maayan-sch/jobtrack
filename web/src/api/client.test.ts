import { afterEach, expect, test, vi } from "vitest";
import { api, ApiError } from "./client";

afterEach(() => vi.restoreAllMocks());

test("throws ApiError with the server's code and message on non-2xx", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        error: { code: "NOT_FOUND", message: "Application not found" },
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
  await expect(api("/applications/x")).rejects.toMatchObject({
    status: 404,
    code: "NOT_FOUND",
    message: "Application not found",
  });
  await expect(api("/applications/x")).rejects.toBeInstanceOf(ApiError);
});

test("returns undefined on 204", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 204 }),
  );
  await expect(
    api("/applications/x", { method: "DELETE" }),
  ).resolves.toBeUndefined();
});
