import { afterAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("auth register route", () => {
  const appPromise = buildApp({ logger: false });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("returns validation errors for missing fields on the api prefix", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {},
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({
      error: "Validation error",
    });
  });
});
