import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const tx = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return {
    transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
    tx,
  };
});

const notificationMock = vi.hoisted(() => ({
  enqueueNotificationJob: vi.fn(),
}));

vi.mock("../../shared/config/database.js", () => ({
  db: {
    transaction: dbMock.transaction,
  },
}));

vi.mock("../../workers/bullmq/jobs/send-notification.job.js", () => notificationMock);

import { addMeToo, removeMeToo, SelfMeTooError } from "./metoo.service.js";

describe("metoo service", () => {
  beforeEach(() => {
    dbMock.transaction.mockClear();
    dbMock.tx.insert.mockReset();
    dbMock.tx.update.mockReset();
    dbMock.tx.delete.mockReset();
    notificationMock.enqueueNotificationJob.mockClear();
  });

  it("enqueues a notification after a successful Me Too insert", async () => {
    dbMock.tx.insert.mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: "metoo-1",
            userId: "user-123",
            painId: "pain-1",
            createdAt: new Date("2026-05-23T00:00:00.000Z"),
          },
        ]),
      })),
    });
    dbMock.tx.update.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    });

    const result = await addMeToo({
      userId: "user-123",
      painId: "pain-1",
      painAuthorId: "owner-123",
    });

    expect(result).toMatchObject({
      id: "metoo-1",
      userId: "user-123",
      painId: "pain-1",
    });
    expect(notificationMock.enqueueNotificationJob).toHaveBeenCalledWith({
      type: "ME_TOO",
      userId: "owner-123",
      payload: {
        painId: "pain-1",
        actorUserId: "user-123",
      },
    });
  });

  it("does not enqueue a notification on removal", async () => {
    dbMock.tx.delete.mockReturnValue({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: "metoo-1",
            userId: "user-123",
            painId: "pain-1",
            createdAt: new Date("2026-05-23T00:00:00.000Z"),
          },
        ]),
      })),
    });
    dbMock.tx.update.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    });

    const result = await removeMeToo({
      userId: "user-123",
      painId: "pain-1",
    });

    expect(result).toMatchObject({
      id: "metoo-1",
      userId: "user-123",
      painId: "pain-1",
    });
    expect(notificationMock.enqueueNotificationJob).not.toHaveBeenCalled();
  });

  it("rejects self-MeToo attempts", async () => {
    await expect(
      addMeToo({
        userId: "user-123",
        painId: "pain-1",
        painAuthorId: "user-123",
      }),
    ).rejects.toBeInstanceOf(SelfMeTooError);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });
});
