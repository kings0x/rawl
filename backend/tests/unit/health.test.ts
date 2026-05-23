import { afterAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("health routes", () => {
  const appPromise = buildApp({ logger: false });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("returns the expected health payload", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });
    const body = response.json<{ status: string; timestamp: string }>();

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
    });
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns Prometheus metrics output", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/metrics",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.body).toContain("rawl_backend_process_cpu_user_seconds_total");
  });
});
