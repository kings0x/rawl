import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { signAccessToken } from "../../shared/security/tokens.js";

const commentsServiceMock = vi.hoisted(() => ({
  checkCommentOwnership: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  listComments: vi.fn(),
  toPublicComment: vi.fn((comment: { userId?: string; painId: string; body: string }, painIsAnonymous = false) => {
    const { userId, ...rest } = comment;

    return {
      ...rest,
      ...(painIsAnonymous ? {} : { userId }),
    };
  }),
}));

const painServiceMock = vi.hoisted(() => ({
  findPainById: vi.fn(),
}));

const notificationMock = vi.hoisted(() => ({
  enqueueNotificationJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./comments.service.js", () => commentsServiceMock);
vi.mock("../pains/pains.service.js", () => painServiceMock);
vi.mock("../../workers/bullmq/jobs/send-notification.job.js", () => notificationMock);

vi.resetModules();
const { buildApp } = await import("../../app.js");

type App = Awaited<ReturnType<typeof buildApp>>;

describe("comment routes", () => {
  const appPromise: ReturnType<typeof buildApp> = buildApp({ logger: false });
  const accessToken = signAccessToken({
    sub: "user-123",
    email: "person@example.com",
    isPremium: false,
    premiumTier: "BUILDER",
  });

  beforeEach(() => {
    commentsServiceMock.checkCommentOwnership.mockReset();
    commentsServiceMock.createComment.mockReset();
    commentsServiceMock.deleteComment.mockReset();
    commentsServiceMock.listComments.mockReset();
    commentsServiceMock.toPublicComment.mockClear();
    painServiceMock.findPainById.mockReset();
  });

  afterAll(async () => {
    const app: App = await appPromise;
    await app.close();
  });

  it("rejects unauthenticated comment creation", async () => {
    const app: App = await appPromise;

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000000/comments",
      payload: { body: "hello" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("creates comments and redacts identity when the pain is anonymous", async () => {
    const app: App = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000010",
      userId: "owner-123",
      rawDescription: "A pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
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
    commentsServiceMock.createComment.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000111",
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000010",
      body: "I see this too.",
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000010/comments",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        body: "I see this too.",
      },
    });

    expect(response.statusCode).toBe(201);
    type CreateCommentResponse = {
      comment: {
        id: string;
        body: string;
        userId?: string;
      };
    };

    const body: CreateCommentResponse = response.json();

    expect(body.comment.userId).toBeUndefined();
    expect(commentsServiceMock.createComment).toHaveBeenCalledWith({
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000010",
      painAuthorId: "owner-123",
      body: "I see this too.",
    });
  });

  it("lists anonymous pain comments without exposing commenter identity", async () => {
    const app: App = await appPromise;

    painServiceMock.findPainById.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000010",
      userId: "owner-123",
      rawDescription: "A pain.",
      frequency: "DAILY",
      workaround: "Spreadsheet workarounds",
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
    commentsServiceMock.listComments.mockResolvedValue([
      {
        id: "00000000-0000-0000-0000-000000000111",
        userId: "user-123",
        painId: "00000000-0000-0000-0000-000000000010",
        body: "I see this too.",
        createdAt: new Date("2026-05-23T00:00:00.000Z"),
      },
    ]);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/pains/00000000-0000-0000-0000-000000000010/comments?page=1&limit=20",
    });

    expect(response.statusCode).toBe(200);
    type ListCommentsResponse = {
      comments: Array<{
        id: string;
        body: string;
        userId?: string;
      }>;
    };

    const body: ListCommentsResponse = response.json();

    expect(body.comments[0]?.userId).toBeUndefined();
  });

  it("returns 403 when deleting another user's comment", async () => {
    const app: App = await appPromise;

    commentsServiceMock.checkCommentOwnership.mockResolvedValue({
      status: "forbidden",
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/comments/00000000-0000-0000-0000-000000000222",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 404 when deleting a missing comment", async () => {
    const app: App = await appPromise;

    commentsServiceMock.checkCommentOwnership.mockResolvedValue({
      status: "not_found",
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/comments/00000000-0000-0000-0000-000000000222",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("deletes an owned comment", async () => {
    const app: App = await appPromise;

    commentsServiceMock.checkCommentOwnership.mockResolvedValue({
      status: "ok",
      comment: {
        id: "00000000-0000-0000-0000-000000000222",
        userId: "user-123",
        painId: "00000000-0000-0000-0000-000000000010",
        body: "I see this too.",
        createdAt: new Date("2026-05-23T00:00:00.000Z"),
      },
    });
    commentsServiceMock.deleteComment.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000222",
      userId: "user-123",
      painId: "00000000-0000-0000-0000-000000000010",
      body: "I see this too.",
      createdAt: new Date("2026-05-23T00:00:00.000Z"),
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/comments/00000000-0000-0000-0000-000000000222",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
