import { afterAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("auth me route", () => {
  const appPromise = buildApp({ logger: false });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("returns unauthorized without an access token", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
    });

    expect(response.statusCode).toBe(401);
  });
});
