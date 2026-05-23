import { describe, expect, it } from "vitest";

import { registerUserSchema } from "./users.schema.js";

describe("registerUserSchema", () => {
  it("rejects invalid email addresses", () => {
    const result = registerUserSchema.safeParse({
      email: "not-an-email",
      password: "correct horse battery staple",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = registerUserSchema.safeParse({
      email: "rawl@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
