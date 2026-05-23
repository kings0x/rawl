import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const painServiceMock = vi.hoisted(() => ({
  checkPainOwnership: vi.fn(),
  createPain: vi.fn(),
  deletePain: vi.fn(),
  findPainById: vi.fn(),
  listPains: vi.fn(),
  toPublicPain: vi.fn((pain: { isAnonymous: boolean; userId?: string; commentCount?: number }) => {
    const { userId, ...rest } = pain;

    return {
      ...rest,
      ...(pain.isAnonymous ? {} : { userId }),
      commentCount: pain.commentCount ?? 0,
    };
  }),
  updatePain: vi.fn(),
}));

const authenticateMock = vi.hoisted(() => ({
  authenticate: (
    request: { headers: { authorization?: string }; user?: unknown },
    reply: { code: (status: number) => { send: (payload: { error: string }) => unknown } },
    done: () => void,
  ) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    request.user = {
      id: "user-123",
      email: "person@example.com",
      isPremium: false,
      premiumTier: "BUILDER",
    };
    done();
  },
}));

const databaseMock = vi.hoisted(() => ({
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(),
    })),
  })),
}));

vi.mock("../../src/modules/pains/pains.service.js", () => painServiceMock);
vi.mock("../../src/shared/config/database.js", () => ({
  db: {
    insert: databaseMock.insert,
  },
}));
vi.mock("../../src/shared/middleware/authenticate.js", () => authenticateMock);

vi.resetModules();
const { buildApp } = await import("../../src/app.js");

describe("pain routes", () => {
  const appPromise = buildApp({ logger: false });

  beforeEach(() => {
    painServiceMock.createPain.mockReset();
    painServiceMock.checkPainOwnership.mockReset();
    painServiceMock.deletePain.mockReset();
    painServiceMock.findPainById.mockReset();
    painServiceMock.listPains.mockReset();
    painServiceMock.toPublicPain.mockClear();
    painServiceMock.updatePain.mockReset();
  });

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("rejects unauthenticated pain creation", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains",
      payload: {},
    });

    expect(response.statusCode).toBe(401);
  });

  it("creates pains for authenticated users and hides userId for anonymous submissions", async () => {
    const app = await appPromise;
    databaseMock.insert.mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
            userId: "user-123",
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
          },
        ]),
      })),
    });
    painServiceMock.createPain.mockResolvedValue({
      id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      userId: "user-123",
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

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains",
      headers: {
        authorization: "Bearer test-token",
      },
      payload: {
        rawDescription: "My workflow is blocked by repeated manual reports.",
        frequency: "DAILY",
        workaround: "Copying data into spreadsheets",
        wtpEstimate: 100,
        category: "WORK",
        country: "ng",
        isAnonymous: true,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(painServiceMock.createPain).toHaveBeenCalledWith({
      userId: "user-123",
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
      wtpEstimate: 100,
      category: "WORK",
      country: "NG",
      isAnonymous: true,
    });
    const body: {
      pain: {
        id: string;
        rawDescription: string;
        isAnonymous: boolean;
        commentCount: number;
        userId?: string;
      };
    } = response.json();

    expect(body).toMatchObject({
      pain: {
        id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
        rawDescription: "My workflow is blocked by repeated manual reports.",
        isAnonymous: true,
        commentCount: 0,
      },
    });
    expect(body.pain.userId).toBeUndefined();
  });

  it("updates pains for the owner and keeps anonymous responses redacted", async () => {
    const app = await appPromise;
    painServiceMock.checkPainOwnership.mockResolvedValue({
      status: "ok",
      pain: {
        id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
        userId: "user-123",
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
      },
    });
    painServiceMock.updatePain.mockResolvedValue({
      id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      userId: "user-123",
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "MONTHLY",
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

    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/pains/e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      headers: {
        authorization: "Bearer test-token",
      },
      payload: {
        frequency: "MONTHLY",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(painServiceMock.updatePain).toHaveBeenCalledWith("e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3", {
      frequency: "MONTHLY",
    });
    const body: {
      pain: {
        id: string;
        frequency: string;
        isAnonymous: boolean;
        userId?: string;
      };
    } = response.json();
    expect(body.pain.frequency).toBe("MONTHLY");
    expect(body.pain.userId).toBeUndefined();
  });

  it("returns 403 when a non-owner tries to update a pain", async () => {
    const app = await appPromise;
    painServiceMock.checkPainOwnership.mockResolvedValue({
      status: "forbidden",
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/pains/e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      headers: {
        authorization: "Bearer test-token",
      },
      payload: {
        frequency: "MONTHLY",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 404 when updating a pain that does not exist", async () => {
    const app = await appPromise;
    painServiceMock.checkPainOwnership.mockResolvedValue({
      status: "not_found",
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/pains/e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      headers: {
        authorization: "Bearer test-token",
      },
      payload: {
        frequency: "MONTHLY",
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("deletes pains for the owner", async () => {
    const app = await appPromise;
    painServiceMock.checkPainOwnership.mockResolvedValue({
      status: "ok",
      pain: {
        id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
        userId: "user-123",
        rawDescription: "My workflow is blocked by repeated manual reports.",
        frequency: "DAILY",
        workaround: "Copying data into spreadsheets",
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
      },
    });
    painServiceMock.deletePain.mockResolvedValue({
      id: "e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      userId: "user-123",
      rawDescription: "My workflow is blocked by repeated manual reports.",
      frequency: "DAILY",
      workaround: "Copying data into spreadsheets",
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

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/pains/e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      headers: {
        authorization: "Bearer test-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(painServiceMock.deletePain).toHaveBeenCalledWith("e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3");
  });

  it("returns 403 when a non-owner tries to delete a pain", async () => {
    const app = await appPromise;
    painServiceMock.checkPainOwnership.mockResolvedValue({
      status: "forbidden",
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/pains/e3e6fd3e-3cbf-4dc0-b9c0-5dbe8d2dd7e3",
      headers: {
        authorization: "Bearer test-token",
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
