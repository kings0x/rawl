import { describe, expect, it } from "vitest";

import { painIdSchema } from "./metoo.schema.js";

describe("painIdSchema", () => {
  it("rejects invalid ids", () => {
    const result = painIdSchema.safeParse({ id: "not-a-uuid" });

    expect(result.success).toBe(false);
  });
});
