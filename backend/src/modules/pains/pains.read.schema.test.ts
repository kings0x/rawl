import { describe, expect, it } from "vitest";

import { painsListQuerySchema } from "./pains.read.schema.js";

describe("painsListQuerySchema", () => {
  it("fills defaults for pagination and sorting", () => {
    const result = painsListQuerySchema.parse({});

    expect(result).toMatchObject({
      page: 1,
      limit: 20,
      sort: "recent",
    });
  });

  it("rejects limits over 50", () => {
    const result = painsListQuerySchema.safeParse({ limit: 51 });

    expect(result.success).toBe(false);
  });

  it("rejects invalid sort values", () => {
    const result = painsListQuerySchema.safeParse({ sort: "oldest" });

    expect(result.success).toBe(false);
  });
});
