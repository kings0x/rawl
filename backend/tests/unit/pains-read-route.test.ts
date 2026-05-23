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

vi.mock("../../src/modules/pains/pains.service.js", () => painServiceMock);

vi.resetModules();
const { buildApp } = await import("../../src/app.js");

describe("pain read routes", () => {
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

  it("lists pains with the parsed query params", async () => {
    const app = await appPromise;

    painServiceMock.listPains.mockResolvedValue([
      {
        id: "f0b0d604-c9cb-4e5a-94f8-2a66741fbe65",
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
        meTooCount: 8,
        subscriberCount: 2,
        createdAt: new Date("2026-05-23T00:00:00.000Z"),
        updatedAt: new Date("2026-05-23T00:00:00.000Z"),
      },
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/pains?category=WORK&sort=popular&page=3&limit=50",
    });

    expect(response.statusCode).toBe(200);
    expect(painServiceMock.listPains).toHaveBeenCalledWith({
      category: "WORK",
      sort: "popular",
      page: 3,
      limit: 50,
    });
    const listBody: {
      pains: Array<{
        id: string;
        rawDescription: string;
        isAnonymous: boolean;
        commentCount: number;
        userId?: string;
      }>;
      page: number;
      limit: number;
    } = response.json();

    expect(listBody).toMatchObject({
      pains: [
        {
          id: "f0b0d604-c9cb-4e5a-94f8-2a66741fbe65",
          rawDescription: "My workflow is blocked by repeated manual reports.",
          isAnonymous: true,
          commentCount: 0,
        },
      ],
      page: 3,
      limit: 50,
    });
    expect(listBody.pains[0]?.userId).toBeUndefined();
  });

  it("returns a single pain and hides userId when anonymous", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "f0b0d604-c9cb-4e5a-94f8-2a66741fbe65",
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
      meTooCount: 8,
      subscriberCount: 2,
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
      updatedAt: new Date("2026-05-23T00:00:00.000Z"),
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/pains/f0b0d604-c9cb-4e5a-94f8-2a66741fbe65",
    });

    expect(response.statusCode).toBe(200);
    const singleBody: {
      pain: {
        id: string;
        rawDescription: string;
        isAnonymous: boolean;
        commentCount: number;
        userId?: string;
      };
    } = response.json();

    expect(singleBody).toMatchObject({
      pain: {
        id: "f0b0d604-c9cb-4e5a-94f8-2a66741fbe65",
        rawDescription: "My workflow is blocked by repeated manual reports.",
        isAnonymous: true,
        commentCount: 0,
      },
    });
    expect(singleBody.pain.userId).toBeUndefined();
  });

  it("returns 404 for missing pains", async () => {
    const app = await appPromise;

    painServiceMock.findPainById.mockResolvedValue(null);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/pains/f0b0d604-c9cb-4e5a-94f8-2a66741fbe65",
    });

    expect(response.statusCode).toBe(404);
  });
});
