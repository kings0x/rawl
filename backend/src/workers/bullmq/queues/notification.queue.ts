import { createQueue } from "../../../shared/config/bullmq.js";

export type NotificationJob = {
  type: string;
  userId: string;
  payload: Record<string, unknown>;
};

export const notificationQueue = createQueue<NotificationJob>("notification");
