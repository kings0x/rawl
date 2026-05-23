import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  insert: vi.fn(),
}));

vi.mock("../../shared/config/database.js", () => ({
  db: {
    insert: dbMock.insert,
  },
}));

import { createPain, toPublicPain } from "./pains.service.js";

describe("pains service", () => {
  beforeEach(() => {
    dbMock.insert.mockReset();
  });

  it("returns the created pain record from createPain", async () => {
    const createdPain = {
      id: "1e0f6bd8-2f41-4c80-bd51-b4d6d2d92d2c",
      userId: "b6e22e36-15f0-4b8e-b7fe-0fddcb0860b4",
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: true,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 0,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    };

    dbMock.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([createdPain]),
      }),
    });

    await expect(
      createPain({
        userId: createdPain.userId,
        rawDescription: createdPain.rawDescription,
        frequency: "DAILY",
        workaround: "Copying data into spreadsheets",
        wtpEstimate: 100,
        category: "WORK",
        country: "NG",
        isAnonymous: true,
      }),
    ).resolves.toEqual(createdPain);
  });

  it("strips userId from anonymous pains and keeps counts stable", () => {
    const publicPain = toPublicPain({
      id: "1e0f6bd8-2f41-4c80-bd51-b4d6d2d92d2c",
      userId: "b6e22e36-15f0-4b8e-b7fe-0fddcb0860b4",
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: true,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 0,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });

    expect(publicPain.userId).toBeUndefined();
    expect(publicPain.commentCount).toBe(0);
  });
});
