import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const painServiceMock = vi.hoisted(() => ({
  createPain: vi.fn(),
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
    painServiceMock.findPainById.mockReset();
    painServiceMock.listPains.mockReset();
    painServiceMock.toPublicPain.mockClear();
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
});
