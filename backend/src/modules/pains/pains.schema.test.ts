import { describe, expect, it } from "vitest";

import { painSchema } from "./pains.schema.js";

describe("painSchema", () => {
  it("accepts valid pain input", () => {
    const result = painSchema.safeParse({
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
      wtpEstimate: 100,
      category: "WORK",
      country: "ng",
      isAnonymous: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe("NG");
      expect(result.data.isAnonymous).toBe(true);
    }
  });

  it("rejects missing rawDescription", () => {
    const result = painSchema.safeParse({
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
      category: "WORK",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid frequency enum values", () => {
    const result = painSchema.safeParse({
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "YEARLY",
      workaround: "Copying data into spreadsheets",
      category: "WORK",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid category enum values", () => {
    const result = painSchema.safeParse({
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
      category: "TRAVEL",
    });

    expect(result.success).toBe(false);
  });
});
