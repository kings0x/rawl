import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { signAccessToken } from "../../src/shared/security/tokens.js";

const metooServiceMock = vi.hoisted(() => {
  class SelfMeTooError extends Error {
    override name = "SelfMeTooError";
  }

  return {
    SelfMeTooError,
    addMeToo: vi.fn(),
    getMeTooCount: vi.fn(),
    hasUserMeToo: vi.fn(),
    removeMeToo: vi.fn(),
  };
});

const painServiceMock = vi.hoisted(() => ({
  findPainById: vi.fn(),
}));

const notificationMock = vi.hoisted(() => ({
  enqueueNotificationJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/modules/engagement/metoo.service.js", () => metooServiceMock);
vi.mock("../../src/modules/pains/pains.service.js", () => painServiceMock);
vi.mock("../../src/workers/bullmq/jobs/send-notification.job.js", () => notificationMock);

vi.resetModules();
const { buildApp } = await import("../../src/app.js");

describe("metoo route", () => {
  const appPromise = buildApp({ logger: false });
  const accessToken = signAccessToken({
    sub: "user-123",
    email: "person@example.com",
    isPremium: false,
    premiumTier: "BUILDER",
  });

  beforeEach(() => {
    painServiceMock.findPainById.mockReset();
    metooServiceMock.addMeToo.mockReset();
    metooServiceMock.getMeTooCount.mockReset();
    metooServiceMock.hasUserMeToo.mockReset();
    metooServiceMock.removeMeToo.mockReset();
  });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("rejects unauthenticated me too requests", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000000/metoo",
    });

    expect(response.statusCode).toBe(401);
  });

  it("adds a me too and enqueues notification for another user's pain", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "owner-123",
      rawDescription: "A real pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: false,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 0,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });
    metooServiceMock.addMeToo.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000101",
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000001",
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000001/metoo",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(metooServiceMock.addMeToo).toHaveBeenCalledWith({
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000001",
      painAuthorId: "owner-123",
    });
  });

  it("rejects duplicate me too attempts with 409", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "owner-123",
      rawDescription: "A real pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: false,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 0,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });
    metooServiceMock.addMeToo.mockRejectedValue(new Error("duplicate"));

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000001/metoo",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it("rejects self-MeToo attempts with 403", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "user-123",
      rawDescription: "A real pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: false,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 0,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });
    metooServiceMock.addMeToo.mockRejectedValue(new metooServiceMock.SelfMeTooError());

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000001/metoo",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("removes a me too for the owner", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "owner-123",
      rawDescription: "A real pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: false,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 0,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });
    metooServiceMock.removeMeToo.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000101",
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000001",
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000001/metoo",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(metooServiceMock.removeMeToo).toHaveBeenCalledWith({
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000001",
    });
  });

  it("returns count and hasMeToo state on the count endpoint", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "owner-123",
      rawDescription: "A real pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: false,
      isResolved: false,
      opportunityScore: "0.00",
      meTooCount: 3,
      subscriberCount: 0,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });
    metooServiceMock.getMeTooCount.mockResolvedValue(3);
    metooServiceMock.hasUserMeToo.mockResolvedValue(true);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000001/metoos",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      count: 3,
      hasMeToo: true,
    });
  });
});
