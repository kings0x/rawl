import { describe, expect, it } from "vitest";

import { commentBodySchema, commentListQuerySchema } from "./comments.schema.js";

describe("comment schemas", () => {
  it("rejects empty comments", () => {
    const result = commentBodySchema.safeParse({ body: "" });

    expect(result.success).toBe(false);
  });

  it("rejects comments over 1000 characters", () => {
    const result = commentBodySchema.safeParse({ body: "a".repeat(1001) });

    expect(result.success).toBe(false);
  });

  it("caps comment pagination at 50", () => {
    const result = commentListQuerySchema.safeParse({ limit: 51 });

    expect(result.success).toBe(false);
  });
});
